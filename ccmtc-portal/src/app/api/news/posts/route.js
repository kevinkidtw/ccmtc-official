import { prisma } from '@/lib/prisma';
import { validatePost, STATUS } from '@/lib/newsFormat.mjs';
import { requireTeacher, json, authorLabel } from '@/lib/teacherSession';

/** 教師自己的消息（含待審核、退回）。 */
export async function GET(req) {
  const { teacher, error } = await requireTeacher(req);
  if (error) return error;
  const list = await prisma.announcement.findMany({
    where: { authorId: teacher.id },
    orderBy: { createdAt: 'desc' },
  });
  return json(list);
}

/** 發文：有直接發布權限就上線，否則送審。教師不能置頂、內文一律以純文字處理。 */
export async function POST(req) {
  const { teacher, error } = await requireTeacher(req, { write: true });
  if (error) return error;
  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }
  const v = validatePost(body);
  if (!v.ok) return json({ error: v.error }, 400);
  const publish = teacher.canPublish;
  const item = await prisma.announcement.create({
    data: {
      ...v.data,
      isPinned: false,
      contentFormat: 'text',
      status: publish ? STATUS.PUBLISHED : STATUS.PENDING,
      publishedAt: publish ? new Date() : null,
      authorId: teacher.id,
      authorName: authorLabel(teacher),
    },
  });
  return json(item, 201);
}
