import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBaseOrigin } from '@/lib/siteAuth';
import { verifyPassword, signSession, createLoginLimiter, isSameOrigin } from '@/lib/teacherAuth.mjs';
import { secret, json, setSessionCookie, clientIp, publicTeacher } from '@/lib/teacherSession';

const limiter = globalThis.__teacherLoginLimiter || (globalThis.__teacherLoginLimiter = createLoginLimiter());
// 帳號不存在時也跑一次雜湊比對，讓回應時間不洩漏「帳號存不存在」
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(64);

export async function POST(req) {
  if (!isSameOrigin(req.headers.get('origin'), getBaseOrigin(req))) return json({ error: '來源不正確' }, 403);
  const key = secret();
  if (!key) return json({ error: '登入功能尚未設定，請聯絡管理者' }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }
  const username = String(body?.username || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const rateKey = `${clientIp(req)}|${username}`;
  if (limiter.blocked(rateKey)) return json({ error: '嘗試次數過多，請 15 分鐘後再試' }, 429);

  const t = username ? await prisma.teacher.findUnique({ where: { username } }) : null;
  const ok = verifyPassword(password, t?.passwordHash || DUMMY_HASH) && t && t.isActive;
  if (!ok) {
    limiter.fail(rateKey);
    return json({ error: '帳號或密碼錯誤，或帳號已停用' }, 401);
  }
  limiter.reset(rateKey);
  await prisma.teacher.update({ where: { id: t.id }, data: { lastLoginAt: new Date() } });

  const res = NextResponse.json({ teacher: publicTeacher(t) }, { headers: { 'Cache-Control': 'no-store' } });
  setSessionCookie(res, signSession({ teacherId: t.id, passwordHash: t.passwordHash }, key));
  return res;
}
