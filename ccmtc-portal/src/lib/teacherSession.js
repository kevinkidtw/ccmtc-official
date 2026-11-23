import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBaseOrigin } from '@/lib/siteAuth';
import {
  SESSION_COOKIE, SESSION_MAX_AGE, sessionSecret, readSession, passwordVersion, isSameOrigin,
} from '@/lib/teacherAuth.mjs';

/** 教師登入相關的伺服器端共用函式（只在 Node runtime 的 route handler 使用）。 */

export const secret = () => sessionSecret(process.env.ADMIN_TOKEN);

export function isAdminToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

/** 消息上顯示的作者：「學校 姓名」。 */
export function authorLabel(t) {
  return [t.school, t.name].filter(Boolean).join(' ');
}

/** 回給前端的教師資料（不含密碼雜湊）。 */
export function publicTeacher(t) {
  if (!t) return null;
  const { passwordHash, ...rest } = t;
  return rest;
}

/** 讀 cookie → 驗簽章 → 查資料庫確認帳號仍啟用且密碼沒被重設。 */
export async function getTeacher(req) {
  const s = readSession(req.cookies.get(SESSION_COOKIE)?.value, secret());
  if (!s) return null;
  const t = await prisma.teacher.findUnique({ where: { id: s.teacherId } });
  if (!t || !t.isActive || passwordVersion(t.passwordHash) !== s.version) return null;
  return t;
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * 寫入類 API 的共同檢查：同源 + 已登入。
 * 回傳 { teacher } 或 { error: NextResponse }。
 */
export async function requireTeacher(req, { write = false } = {}) {
  if (write && !isSameOrigin(req.headers.get('origin'), getBaseOrigin(req))) {
    return { error: json({ error: '來源不正確' }, 403) };
  }
  const teacher = await getTeacher(req);
  if (!teacher) return { error: json({ error: '請先登入' }, 401) };
  return { teacher };
}

export function setSessionCookie(res, token) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.SITE_URL || '').startsWith('https://'),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export function clientIp(req) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}
