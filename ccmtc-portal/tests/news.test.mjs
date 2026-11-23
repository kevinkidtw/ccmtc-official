import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword, verifyPassword, generatePassword, sessionSecret, signSession, readSession,
  isSameOrigin, createLoginLimiter, USERNAME_RE, SESSION_MAX_AGE,
} from '../src/lib/teacherAuth.mjs';
import {
  escapeHtml, renderPlainText, renderContent, excerpt, isAllowedUpload, isUploadUrl, validatePost,
  displayDate, NEWS_CATEGORIES, recentNewsBySite,
} from '../src/lib/newsFormat.mjs';

test('密碼：雜湊不含明文、驗證正確、加鹽', () => {
  const h = hashPassword('correct horse');
  assert.ok(h.startsWith('scrypt$'));
  assert.ok(!h.includes('correct horse'));
  assert.ok(verifyPassword('correct horse', h));
  assert.ok(!verifyPassword('wrong horse!', h));
  assert.notEqual(hashPassword('correct horse'), h, '同一密碼每次雜湊不同');
  assert.ok(!verifyPassword('x', 'garbage'));
  assert.ok(!verifyPassword(undefined, h));
  assert.throws(() => hashPassword('short'), /至少/);
});

test('初始密碼：長度與字元集（無易混淆字元）', () => {
  const p = generatePassword();
  assert.equal(p.length, 12);
  assert.match(p, /^[a-km-zA-HJ-NP-Z2-9]+$/);
  assert.notEqual(generatePassword(), generatePassword());
});

test('帳號格式', () => {
  assert.ok(USERNAME_RE.test('wang.ming'));
  assert.ok(USERNAME_RE.test('t001'));
  assert.ok(!USERNAME_RE.test('ab'));
  assert.ok(!USERNAME_RE.test('Admin'));
  assert.ok(!USERNAME_RE.test('a b c'));
  assert.ok(!USERNAME_RE.test('.hidden'));
});

test('session：簽章、竄改、到期、換金鑰、改密碼版本', () => {
  const secret = sessionSecret('token-a');
  const hash = hashPassword('password-1');
  const now = Date.UTC(2026, 10, 23);
  const tok = signSession({ teacherId: 'abc', passwordHash: hash }, secret, now);
  const s = readSession(tok, secret, now + 1000);
  assert.equal(s.teacherId, 'abc');

  const [payload, sig] = tok.split('.');
  const forged = Buffer.from(JSON.stringify({ t: 'admin', e: 9e9, v: s.version })).toString('base64url');
  assert.equal(readSession(`${forged}.${sig}`, secret, now), null, '改內容簽章就對不上');
  assert.equal(readSession(`${payload}.x${sig.slice(1)}`, secret, now), null);
  assert.equal(readSession(tok, sessionSecret('token-b'), now), null, 'ADMIN_TOKEN 換了舊 session 失效');
  assert.equal(readSession(tok, secret, now + (SESSION_MAX_AGE + 1) * 1000), null, '過期');
  assert.equal(readSession('nonsense', secret, now), null);
  assert.equal(readSession(tok, null, now), null);
  assert.equal(sessionSecret(''), null, '沒有 ADMIN_TOKEN 就停用登入');

  const tok2 = signSession({ teacherId: 'abc', passwordHash: hashPassword('password-2') }, secret, now);
  assert.notEqual(readSession(tok2, secret, now).version, s.version, '重設密碼後版本不同');
});

test('同源檢查', () => {
  assert.ok(isSameOrigin(null, 'https://ccmtc.mooo.com'));
  assert.ok(isSameOrigin('https://ccmtc.mooo.com', 'https://ccmtc.mooo.com'));
  assert.ok(!isSameOrigin('https://evil.com', 'https://ccmtc.mooo.com'));
  assert.ok(!isSameOrigin('http://ccmtc.mooo.com', 'https://ccmtc.mooo.com'));
  assert.ok(!isSameOrigin('not a url', 'https://ccmtc.mooo.com'));
});

test('登入節流：5 次失敗後封鎖，視窗過後解除', () => {
  const lim = createLoginLimiter({ max: 5, windowMs: 1000 });
  for (let i = 0; i < 5; i++) { assert.ok(!lim.blocked('k', 0)); lim.fail('k', 0); }
  assert.ok(lim.blocked('k', 10));
  assert.ok(!lim.blocked('other', 10));
  assert.ok(!lim.blocked('k', 2000));
  lim.fail('k', 3000); lim.reset('k');
  assert.ok(!lim.blocked('k', 3001));
});

test('教師內文：HTML 一律跳脫，只有 http(s) 網址變連結', () => {
  assert.equal(escapeHtml(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  const out = renderPlainText('<script>alert(1)</script>\n報名：https://ccmtc.mooo.com/contests?a=1&b=2 截止');
  assert.ok(!out.includes('<script>'));
  assert.ok(out.includes('&lt;script&gt;'));
  assert.ok(out.includes('<a href="https://ccmtc.mooo.com/contests?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">'));
  assert.ok(out.includes('\n'), '保留換行');
  assert.ok(!renderPlainText('javascript:alert(1)').includes('<a'), 'javascript: 不轉連結');
  const quoted = renderPlainText('"https://a.tw/x" 與「https://b.tw」');
  assert.ok(quoted.includes('href="https://a.tw/x"'), '引號不吃進網址');
  assert.ok(quoted.includes('href="https://b.tw"'));
  const attr = renderPlainText('https://a.tw/"onmouseover="alert(1)');
  assert.ok(!/<a [^>]*onmouseover/.test(attr), '不能從網址跳出屬性');
});

test('renderContent：管理者 html 原樣、教師 text 跳脫', () => {
  assert.equal(renderContent({ contentFormat: 'html', content: '<b>x</b>' }), '<b>x</b>');
  assert.equal(renderContent({ content: '<b>x</b>' }), '<b>x</b>', '舊資料沒有 contentFormat 視為 html');
  assert.equal(renderContent({ contentFormat: 'text', content: '<b>x</b>' }), '&lt;b&gt;x&lt;/b&gt;');
});

test('摘要去標籤並截斷；日期以發布時間優先', () => {
  assert.equal(excerpt({ contentFormat: 'html', content: '<style>.a{}</style><p>得獎&nbsp;名單</p>' }), '得獎 名單');
  assert.equal(excerpt({ contentFormat: 'text', content: 'a'.repeat(100) }, 10), 'aaaaaaaaaa…');
  assert.equal(displayDate({ createdAt: 'c', publishedAt: 'p' }), 'p');
  assert.equal(displayDate({ createdAt: 'c', publishedAt: null }), 'c');
});

test('附件白名單：擋 svg/html/無副檔名、限制大小', () => {
  assert.ok(isAllowedUpload('簡章.PDF', 1000).ok);
  assert.ok(isAllowedUpload('a.pptx', 1000).ok);
  assert.ok(!isAllowedUpload('x.svg', 1000).ok);
  assert.ok(!isAllowedUpload('x.html', 1000).ok);
  assert.ok(!isAllowedUpload('noext', 1000).ok);
  assert.ok(!isAllowedUpload('a.pdf', 0).ok);
  assert.ok(!isAllowedUpload('a.pdf', 21 * 1024 * 1024).ok);
  assert.ok(isUploadUrl('/api/uploads/1700-abc.pdf'));
  assert.ok(!isUploadUrl('https://evil.com/x.pdf'));
  assert.ok(!isUploadUrl('javascript:alert(1)'));
  assert.ok(!isUploadUrl('/api/uploads/../x'));
});

test('validatePost：必填、長度、分類、站台、附件；不接受置頂與狀態', () => {
  const ok = validatePost({ title: ' 標題 ', content: '內容\r\n第二行', category: '競賽資訊', siteKey: 'drone-awards', isPinned: true, status: 'published' });
  assert.ok(ok.ok);
  assert.deepEqual(ok.data, { title: '標題', content: '內容\n第二行', category: '競賽資訊', siteKey: 'drone-awards', fileUrl: null, fileName: null });
  assert.equal(validatePost({ title: '', content: 'x' }).error, '標題為必填');
  assert.equal(validatePost({ title: 'x', content: ' ' }).error, '內容為必填');
  assert.ok(!validatePost({ title: 'x'.repeat(121), content: 'x' }).ok);
  assert.ok(!validatePost({ title: 'x', content: 'x', category: '大會公告' }).ok);
  assert.ok(!validatePost({ title: 'x', content: 'x', siteKey: 'nope' }).ok);
  assert.ok(!validatePost({ title: 'x', content: 'x', fileUrl: 'https://evil.com/a.pdf' }).ok);
  assert.ok(validatePost({ title: 'x', content: 'x', fileUrl: '/api/uploads/1-a.pdf', fileName: 'a.pdf' }).ok);
  assert.equal(NEWS_CATEGORIES.length, 4);
});

test('NEW 徽章：每站取 30 天內最新一則已發布、有綁站的消息', () => {
  const now = Date.UTC(2026, 10, 23);
  const day = 864e5;
  const at = d => new Date(now - d * day).toISOString();
  const m = recentNewsBySite([
    { id: 'a', title: '舊', siteKey: 'drone', status: 'published', publishedAt: at(10) },
    { id: 'b', title: '新', siteKey: 'drone', status: 'published', publishedAt: at(2) },
    { id: 'c', title: '過期', siteKey: 'robot', status: 'published', publishedAt: at(31) },
    { id: 'd', title: '待審', siteKey: 'r4m', status: 'pending', publishedAt: null, createdAt: at(1) },
    { id: 'e', title: '沒綁站', siteKey: null, status: 'published', publishedAt: at(1) },
    { id: 'f', title: '舊資料沒 publishedAt', siteKey: 'squid', status: 'published', publishedAt: null, createdAt: at(3) },
  ], now, 30);
  assert.deepEqual(Object.keys(m).sort(), ['drone', 'squid']);
  assert.equal(m.drone.id, 'b');
  assert.equal(m.squid.id, 'f');
  assert.deepEqual(recentNewsBySite(null, now), {});
  assert.deepEqual(recentNewsBySite([{ id: 'x', siteKey: 'drone-awards', status: 'published', publishedAt: at(1) }], now), {},
    'listed:false 的站不產生徽章');
});
