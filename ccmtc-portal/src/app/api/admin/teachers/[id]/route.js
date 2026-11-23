import { prisma } from '@/lib/prisma';
import { hashPassword, generatePassword } from '@/lib/teacherAuth.mjs';
import { isAdminToken, json, publicTeacher } from '@/lib/teacherSession';

/**
 * 管理者修改教師帳號：
 *   { resetPassword: true }  重新產生密碼（只回傳這一次），該教師所有登入立即失效
 *   { isActive, canPublish, name, school }
 * 不提供刪除：停用即可，保留發文紀錄的作者對應。
 */
export async function PUT(req, { params }) {
  if (!isAdminToken(req)) return json({ error: 'Unauthorized' }, 401);
  const { id } = await params;
  const t = await prisma.teacher.findUnique({ where: { id } });
  if (!t) return json({ error: '找不到帳號' }, 404);
  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }

  const data = {};
  let initialPassword;
  if (body.resetPassword) {
    initialPassword = generatePassword();
    data.passwordHash = hashPassword(initialPassword);
  }
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.canPublish === 'boolean') data.canPublish = body.canPublish;
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 40);
  if (typeof body.school === 'string') data.school = body.school.trim().slice(0, 40) || null;

  const updated = await prisma.teacher.update({ where: { id }, data });
  return json({ teacher: publicTeacher(updated), ...(initialPassword && { initialPassword }) });
}
