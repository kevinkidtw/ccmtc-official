import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, signSession, MIN_PASSWORD } from '@/lib/teacherAuth.mjs';
import { requireTeacher, json, secret, setSessionCookie } from '@/lib/teacherSession';

/** 教師自行修改密碼。成功後換發新 session（舊裝置上的登入隨之失效）。 */
export async function POST(req) {
  const { teacher, error } = await requireTeacher(req, { write: true });
  if (error) return error;
  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }
  const { current, next } = body || {};
  if (!verifyPassword(String(current || ''), teacher.passwordHash)) return json({ error: '目前密碼不正確' }, 400);
  if (typeof next !== 'string' || next.length < MIN_PASSWORD) return json({ error: `新密碼至少 ${MIN_PASSWORD} 個字元` }, 400);
  const passwordHash = hashPassword(next);
  await prisma.teacher.update({ where: { id: teacher.id }, data: { passwordHash } });
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  setSessionCookie(res, signSession({ teacherId: teacher.id, passwordHash }, secret()));
  return res;
}
