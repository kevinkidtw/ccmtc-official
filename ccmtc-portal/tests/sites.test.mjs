import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITES as REGISTRY, ROLES, badgeLabel, groupByRole, SITE_KEY_RE, buildRewrites, groupByYear, siteHref, getSite, proxiedSites, needsPass, accessLabel,
} from '../src/config/sites.mjs';
import {
  SITES, getSiteByPath, safeNext, signPass, safeEqual, isInternalHost,
} from '../src/lib/siteAuth.js';

test('站台清單：key、prefix 唯一且格式正確', () => {
  const keys = REGISTRY.map(s => s.key);
  const prefixes = REGISTRY.map(s => s.prefix);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(prefixes).size, prefixes.length);
  for (const s of REGISTRY) {
    assert.match(s.key, SITE_KEY_RE, s.key);
    assert.ok(s.prefix.startsWith('/') && !s.prefix.endsWith('/'), s.prefix);
    assert.ok(['active', 'archived'].includes(s.status), `${s.key} status`);
    assert.ok(s.title && s.short && s.icon && s.desc && s.year, `${s.key} 欄位不完整`);
    if (s.auth) {
      assert.ok(s.auth.envVar && s.auth.cookie && s.auth.signMessage, `${s.key} auth 不完整`);
    }
  }
});

test('全部說明站公開：官網不要求任何通行碼', () => {
  for (const site of Object.values(SITES)) {
    assert.equal(site.isPublic, true, `${site.key} 應為公開`);
    assert.equal(site.envVar, null);
  }
});

test('資科訓練保留註冊登入（由 ccmtc-router 處理）', () => {
  const t = getSite('training');
  assert.equal(t.access, 'register');
  assert.equal(accessLabel(t), '需註冊');
  assert.equal(accessLabel(getSite('robot')), null);
  assert.equal(accessLabel(getSite('squid')), null);
});

test('rewrite：所有靜態站都導到 guides 共用容器的子資料夾', () => {
  const prod = buildRewrites({ guidesUrl: 'http://guides:80', isDev: false, env: {} });
  const by = Object.fromEntries(prod.map(r => [r.source, r.destination]));
  assert.equal(by['/drone/'], 'http://guides:80/drone/', '站首頁要帶結尾斜線，否則無限 301');
  assert.equal(by['/drone/:path+'], 'http://guides:80/drone/:path+');
  // 2026-11-23 robot／r4m／squid 由獨立容器併入 guides
  for (const k of ['robot', 'r4m', 'squid']) {
    assert.equal(by[`/${k}/`], `http://guides:80/${k}/`);
    assert.equal(by[`/${k}/:path+`], `http://guides:80/${k}/:path+`);
  }
  assert.ok(!Object.values(by).some(v => /\/\/(robot|r4m|squid):80/.test(v)), '不應再指向舊容器');
  assert.ok(!Object.keys(by).some(k => k.includes('資科')), '外部連結站不應產生 rewrite');
  assert.equal(by['/competition/'], 'http://guides:80/competition/', '屏南區競賽改由封存鏡像提供');
  assert.equal(by['/competition/:path+'], 'http://guides:80/competition/:path+');
});

test('rewrite：仍支援獨立容器型 upstream（環境變數覆寫、開發埠）', () => {
  const legacy = [{ key: 'x', prefix: '/x', upstream: { service: 'xs', port: 80, envVar: 'X_PROXY_URL', devPort: 3999 } }];
  assert.equal(buildRewrites({ guidesUrl: 'g', isDev: false, env: {} }, legacy)[0].destination, 'http://xs:80/:path*');
  assert.equal(buildRewrites({ guidesUrl: 'g', isDev: true, env: {} }, legacy)[0].destination, 'http://127.0.0.1:3999/:path*');
  assert.equal(buildRewrites({ guidesUrl: 'g', isDev: true, env: { X_PROXY_URL: 'http://y:1' } }, legacy)[0].destination, 'http://y:1/:path*');
});

test('getSiteByPath 嚴格比對前綴邊界', () => {
  assert.equal(getSiteByPath('/drone')?.key, 'drone');
  assert.equal(getSiteByPath('/drone/downloads/x.hex')?.key, 'drone');
  assert.equal(getSiteByPath('/dronex'), null);
  assert.equal(getSiteByPath('/robotics'), null);
  assert.equal(getSiteByPath('/'), null);
  assert.equal(getSiteByPath('/contests'), null);
  assert.equal(getSiteByPath('/資科競賽訓練/'), null);
});

test('needsPass 只對有進站限制的站成立', () => {
  assert.equal(needsPass(getSite('training')), true);
  assert.equal(needsPass(getSite('drone')), false);
  assert.equal(needsPass(getSite('robot')), false);
});

test('safeNext 擋開放重新導向', () => {
  const s = SITES.robot;
  assert.equal(safeNext('/robot/faq.html', s), '/robot/faq.html');
  assert.equal(safeNext('/robot', s), '/robot/');
  assert.equal(safeNext('//evil.com', s), '/robot/');
  assert.equal(safeNext('/robotx/', s), '/robot/');
  assert.equal(safeNext('/r4m/', s), '/robot/');
  assert.equal(safeNext('https://evil.com', s), '/robot/');
  assert.equal(safeNext('/robot/\\evil', s), '/robot/');
});

test('signPass 簽章（保留給日後恢復通行碼時使用）', async () => {
  const a = await signPass('pw', { signMessage: 'robot-guide-v1' });
  const b = await signPass('pw', 'robot-guide-v1');
  const c = await signPass('pw', { signMessage: 'r4m-guide-v1' });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.ok(safeEqual(a, b));
  assert.ok(!safeEqual(a, c));
});

test('getSite 拒絕非法代號', () => {
  assert.equal(getSite('../etc'), null);
  assert.equal(getSite('__proto__'), null);
  assert.equal(getSite('constructor'), null);
  assert.equal(getSite('drone').key, 'drone');
});

test('groupByYear 新年度在前、封存排後', () => {
  const list = [
    { key: 'a', year: '114', status: 'active' },
    { key: 'b', year: '115', status: 'archived' },
    { key: 'c', year: '115', status: 'active' },
  ];
  const g = groupByYear(list);
  assert.deepEqual(g.map(([y]) => y), ['115', '114']);
  assert.deepEqual(g[0][1].map(s => s.key), ['c', 'b']);
});

test('siteHref 與內部主機判斷', () => {
  assert.equal(siteHref(getSite('drone')), '/drone/');
  assert.equal(siteHref(getSite('training')), '/資科競賽訓練/');
  assert.ok(isInternalHost('guides:80'));
  assert.ok(!isInternalHost('ccmtc.mooo.com'));
  assert.equal(proxiedSites().length, 6);
  assert.equal(siteHref(getSite('drone-awards')), '/drone-awards/');
});

test('一次性成果頁不上首頁卡片（以最新消息宣傳）', () => {
  assert.equal(getSite('drone-awards').featured, false);
  assert.equal(getSite('drone-awards').status, 'active', '仍在競賽專區當作進行中的站顯示');
});

test('封存站：保留網址、不上首頁、不需登入', () => {
  const c = getSite('competition');
  assert.equal(c.status, 'archived');
  assert.equal(c.featured, false);
  assert.equal(c.upstream, 'guides');
  assert.equal(getSiteByPath('/competition/leaderboard')?.key, 'competition');
  assert.equal(getSiteByPath('/competitions'), null);
  assert.equal(SITES.competition.isPublic, true);
  const [, list114] = groupByYear().find(([y]) => y === '114');
  assert.ok(list114.some(s => s.key === 'competition'));
});

test('每個站都有角色：中心辦理 vs 參賽培訓', () => {
  const keys = ROLES.map(r => r.key);
  for (const s of REGISTRY) assert.ok(keys.includes(s.role), `${s.key} role=${s.role}`);
  const hosted = REGISTRY.filter(s => s.role === 'host').map(s => s.key).sort();
  assert.deepEqual(hosted, ['competition', 'drone-awards']);
});

test('groupByRole：中心辦理在前，各區依年度分組', () => {
  const sections = groupByRole();
  assert.deepEqual(sections.map(([r]) => r.key), ['host', 'team']);
  const [, hostGroups] = sections[0];
  assert.deepEqual(hostGroups.map(([y]) => y), ['115', '114']);
  assert.equal(groupByRole([{ key: 'x', role: 'team', year: '115', status: 'active' }]).length, 1, '空的區塊不輸出');
});

test('徽章：中心辦理標主辦／承辦，其餘標類別', () => {
  assert.equal(badgeLabel(getSite('drone')), '競賽說明');
  assert.equal(badgeLabel(getSite('competition')), '中心主辦');
  assert.equal(badgeLabel(getSite('drone-awards')), '中心承辦');
  assert.equal(badgeLabel(getSite('robot')), '競賽說明');
  assert.equal(badgeLabel(getSite('squid')), '教材');
});
