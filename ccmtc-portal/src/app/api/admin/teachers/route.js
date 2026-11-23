import { prisma } from '@/lib/prisma';
import { hashPassword, generatePassword, USERNAME_RE } from '@/lib/teacherAuth.mjs';
import { isAdminToken, json, publicTeacher } from '@/lib/teacherSession';

/** 管理者：教師帳號列表（附每人的發文數）。 */
export async function GET(req) {
  if (!isAdminToken(req)) return json({ error: 'Unauthorized' }, 401);
  const teachers = await prisma.teacher.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }] });
  const counts = await prisma.announcement.groupBy({ by: ['authorId'], _count: { _all: true } });
  const byId = Object.fromEntries(counts.map(c => [c.authorId, c._count._all]));
  return json(teachers.map(t => ({ ...publicTeacher(t), postCount: byId[t.id] || 0 })));
}

/**
 * 管理者建立教師帳號。初始密碼由伺服器隨機產生，只在這次回應出現一次，
 * 由管理者轉交教師，教師登入後可自行修改。
 */
export async function POST(req) {
  if (!isAdminToken(req)) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }
  const username = String(body?.username || '').trim().toLowerCase();
  const name = String(body?.name || '').trim().slice(0, 40);
  const school = String(body?.school || '').trim().slice(0, 40) || null;
  if (!USERNAME_RE.test(username)) return json({ error: '帳號需 3–32 字，小寫英數，可含 . _ -' }, 400);
  if (!name) return json({ error: '姓名為必填' }, 400);
  if (await prisma.teacher.findUnique({ where: { username } })) return json({ error: '帳號已存在' }, 409);
  const password = generatePassword();
  const t = await prisma.teacher.create({
    data: { username, name, school, canPublish: !!body?.canPublish, passwordHash: hashPassword(password) },
  });
  return json({ teacher: publicTeacher(t), initialPassword: password }, 201);
}
