import { SITES as REGISTRY, proxiedSites } from '../config/sites.mjs';

/**
 * 子站台的伺服器端通行碼驗證。站台本身的設定一律寫在 src/config/sites.mjs。
 * middleware 與登入 API 共用，兩邊都跑得到（不依賴 Node 專屬 API，使用 Web Crypto API）。
 *
 * SITES 是由清單攤平的「代號 → 驗證設定」對照表，保留舊欄位名稱（name、envVar、cookie、
 * signMessage、loginPath）讓既有程式不用改。公開站（auth: null）的 envVar 等欄位為 null。
 *
 * 注意：cookie 名稱與 signMessage 必須維持原值，現有使用者手上的 cookie 才不會失效。
 */
export const SITES = Object.fromEntries(
  proxiedSites(REGISTRY).map(s => [
    s.key,
    {
      key: s.key,
      name: s.short,
      title: s.title,
      kicker: s.kicker || '車城自造教育科技中心',
      prefix: s.prefix,
      envVar: s.auth?.envVar ?? null,
      cookie: s.auth?.cookie ?? null,
      signMessage: s.auth?.signMessage ?? null,
      isPublic: !s.auth,
      loginPath: `/guide-login?site=${s.key}`,
      apiPath: '/api/guide-login',
    },
  ]),
);

export const COOKIE_NAME = SITES.squid.cookie;
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

/**
 * 依請求路徑找出對應的子站台設定（嚴格檢查前綴邊界：剛好等於 prefix 或以 prefix + '/' 開頭）。
 */
export function getSiteByPath(pathname) {
  if (typeof pathname !== 'string') return null;
  for (const site of Object.values(SITES)) {
    if (pathname === site.prefix || pathname.startsWith(`${site.prefix}/`)) {
      return site;
    }
  }
  return null;
}

/**
 * 用通行碼當金鑰簽一段固定訊息，結果拿來當 cookie 的值。
 * cookie 裡不含通行碼本身；沒有通行碼就算不出正確簽章；
 * 通行碼一改，所有舊 cookie 自動失效。
 *
 * @param {string} pass 通行碼
 * @param {string|{signMessage?: string}} [siteOrMessage='squid'] 站台鍵名 ('squid'|'robot')、站台物件或自訂 signMessage
 */
export async function signPass(pass, siteOrMessage = 'squid') {
  let msg = SITES.squid.signMessage;
  if (typeof siteOrMessage === 'string') {
    msg = SITES[siteOrMessage]?.signMessage || siteOrMessage;
  } else if (siteOrMessage && typeof siteOrMessage.signMessage === 'string') {
    msg = siteOrMessage.signMessage;
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 常數時間比較，避免用回應時間逐字元試出通行碼或簽章。 */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * 只允許該站台前綴底下的相對路徑，擋掉 //evil.com、/robotx、跨站導向等開放重新導向。
 *
 * @param {string} next 欲導向的目標路徑
 * @param {string|{prefix?: string}} [siteOrPrefix='squid'] 站台鍵名 ('squid'|'robot')、站台物件或前綴字串 (如 '/robot')
 */
export function safeNext(next, siteOrPrefix = 'squid') {
  let prefix = SITES.squid.prefix;
  if (typeof siteOrPrefix === 'string') {
    if (SITES[siteOrPrefix]) {
      prefix = SITES[siteOrPrefix].prefix;
    } else if (siteOrPrefix.startsWith('/')) {
      prefix = siteOrPrefix.replace(/\/+$/, '');
    }
  } else if (siteOrPrefix && typeof siteOrPrefix.prefix === 'string') {
    prefix = siteOrPrefix.prefix;
  }

  const fallback = `${prefix}/`;
  if (typeof next !== 'string') return fallback;
  if (next.startsWith('//') || next.includes('\\')) return fallback;

  // 必須恰好是 prefix、或以 prefix + '/'、prefix + '?' 開頭，避免 /robotx 被當成 /robot
  if (
    next === prefix ||
    next.startsWith(`${prefix}/`) ||
    next.startsWith(`${prefix}?`)
  ) {
    return next === prefix ? fallback : next;
  }
  return fallback;
}

/**
 * 取得對外正確的 Base Origin（例如 https://ccmtc.mooo.com 或 http://localhost:3040）。
 * 避免容器在 Docker / 反向代理環境下（監聽 0.0.0.0:3040）將 request.url 判定為 http://0.0.0.0:3040，
 * 導致重新導向時將使用者導向無效的內部位址。
 */
export function getBaseOrigin(request) {
  // 1. SITE_URL 最優先。DSM 的反向代理會送 x-forwarded-host: ccmtc.mooo.com，
  //    但 x-forwarded-proto 是 http（它到容器這一段本來就是 http），照著用會把
  //    使用者導去 http://ccmtc.mooo.com —— 而 NAS 的 80 埠是關的，結果是 403。
  //    SITE_URL 由 compose 寫死成 https://ccmtc.mooo.com，是這裡唯一可信的來源。
  if (process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL).origin;
    } catch {}
  }

  // 2. 沒有 SITE_URL 時才看反向代理傳進來的主機名
  const forwardedHost = request?.headers?.get?.('x-forwarded-host');
  const forwardedProto = request?.headers?.get?.('x-forwarded-proto') || 'https';
  if (forwardedHost && !isInternalHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 3. Host 標頭（本機開發的 localhost:3040 走這裡）
  const host = request?.headers?.get?.('host');
  if (host && !isInternalHost(host)) {
    const proto =
      request?.headers?.get?.('x-forwarded-proto') ||
      (request?.url?.startsWith?.('https:') ? 'https' : 'http');
    return `${proto}://${host}`;
  }

  // 4. 最後才回頭問 request 自己 —— 在容器裡這通常是 http://0.0.0.0:3040，
  //    導向那裡使用者只會看到連不上，所以擺在最後並過濾掉內部位址。
  if (request?.nextUrl?.origin && !isInternalHost(request.nextUrl.host)) {
    return request.nextUrl.origin;
  }

  if (request?.url) {
    try {
      const parsed = new URL(request.url);
      if (!isInternalHost(parsed.host)) {
        return parsed.origin;
      }
    } catch {}
  }

  return 'http://localhost:3040';
}

export function isInternalHost(host) {
  if (!host) return true;
  return (
    host.startsWith('0.0.0.0') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('portal:') ||
    host.startsWith('ccmtc-portal') ||
    host.startsWith('guides') ||
    Object.keys(SITES).some(k => host.startsWith(k))
  );
}
