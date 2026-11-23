/**
 * 教師帳號：密碼雜湊與登入 session（純函式，不碰資料庫，方便單元測試）。
 *
 * - 密碼用 Node 內建 scrypt 加鹽雜湊，格式 `scrypt$<salt hex>$<hash hex>`，資料庫不存明文。
 * - session 是 HMAC 簽章的 cookie，不另建 session 表：
 *     <base64url(JSON{ t: 教師 id, e: 到期秒數, v: 密碼版本 })>.<簽章>
 *   密碼版本取自密碼雜湊，管理者重設密碼後舊 session 全部失效。
 * - 簽章金鑰由 NAS .env 既有的 ADMIN_TOKEN 衍生，不需要新增任何機密設定。
 */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'ccmtc_teacher';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const MIN_PASSWORD = 8;

const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new Error(`密碼至少 ${MIN_PASSWORD} 個字元`);
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize('NFKC'), salt, 32, SCRYPT);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const [algo, saltHex, hashHex] = stored.split('$');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const got = scryptSync(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), expected.length, SCRYPT);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** 管理者建立帳號或重設密碼時產生的初始密碼：去掉易混淆字元，12 碼。 */
export function generatePassword(length = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

/** 由 ADMIN_TOKEN 衍生 session 簽章金鑰；沒有 ADMIN_TOKEN 就回 null（登入功能停用）。 */
export function sessionSecret(adminToken) {
  if (!adminToken) return null;
  return createHash('sha256').update(`ccmtc-teacher-session-v1:${adminToken}`).digest();
}

export function passwordVersion(passwordHash) {
  return createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 12);
}

const b64 = s => Buffer.from(s).toString('base64url');
const sign = (secret, data) => createHmac('sha256', secret).update(data).digest('base64url');

export function signSession({ teacherId, passwordHash }, secret, now = Date.now()) {
  if (!secret) throw new Error('session secret 未設定');
  const payload = b64(JSON.stringify({
    t: teacherId,
    e: Math.floor(now / 1000) + SESSION_MAX_AGE,
    v: passwordVersion(passwordHash),
  }));
  return `${payload}.${sign(secret, payload)}`;
}

/** 驗證簽章與到期時間；通過回傳 { teacherId, version }，否則 null。密碼版本由呼叫端比對資料庫。 */
export function readSession(token, secret, now = Date.now()) {
  if (!secret || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(secret, payload));
  const got = Buffer.from(sig);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const { t, e, v } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof t !== 'string' || typeof e !== 'number' || e * 1000 < now) return null;
    return { teacherId: t, version: v };
  } catch {
    return null;
  }
}

/**
 * 寫入類 API 的同源檢查（CSRF 第二道防線，第一道是 SameSite=Lax cookie）。
 * 有 Origin 標頭時必須與官網同源；沒有 Origin（同源 GET、舊瀏覽器）則放行。
 */
export function isSameOrigin(originHeader, allowedOrigin) {
  if (!originHeader) return true;
  try {
    return new URL(originHeader).origin === new URL(allowedOrigin).origin;
  } catch {
    return false;
  }
}

/** 登入失敗節流：同一個 key（IP + 帳號）15 分鐘內最多失敗 5 次。記憶體內計數，容器重啟歸零。 */
export function createLoginLimiter({ max = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const fails = new Map();
  return {
    blocked(key, now = Date.now()) {
      const r = fails.get(key);
      if (!r) return false;
      if (now - r.first > windowMs) { fails.delete(key); return false; }
      return r.count >= max;
    },
    fail(key, now = Date.now()) {
      const r = fails.get(key);
      if (!r || now - r.first > windowMs) fails.set(key, { first: now, count: 1 });
      else r.count += 1;
      if (fails.size > 5000) fails.clear(); // 防止被灌爆記憶體
    },
    reset(key) { fails.delete(key); },
  };
}
