import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { validatePost, STATUS } from '@/lib/newsFormat.mjs';
import { requireTeacher, json, authorLabel } from '@/lib/teacherSession';

async function ownPost(req, params) {
  const { teacher, error } = await requireTeacher(req, { write: true });
  if (error) return { error };
  const { id } = await params;
  const item = await prisma.announcement.findUnique({ where: { id } });
  // 不是自己的文章一律回 404，不透露存在與否
  if (!item || item.authorId !== teacher.id) return { error: json({ error: '找不到這則消息' }, 404) };
  return { teacher, item };
}

async function removeUpload(fileUrl) {
  const name = String(fileUrl || '').replace('/api/uploads/', '');
  if (!name || name.includes('/') || name.includes('..')) return;
  await fs.rm(path.join(process.cwd(), 'public', 'uploads', name), { force: true }).catch(() => {});
}

/** 修改自己的消息。沒有直接發布權限的教師，改過的內容要重新審核（期間不在官網顯示）。 */
export async function PUT(req, { params }) {
  const { teacher, item, error } = await ownPost(req, params);
  if (error) return error;
  let body;
  try { body = await req.json(); } catch { return json({ error: '格式錯誤' }, 400); }
  const v = validatePost(body);
  if (!v.ok) return json({ error: v.error }, 400);
  if (item.fileUrl && item.fileUrl !== v.data.fileUrl) await removeUpload(item.fileUrl);
  const publish = teacher.canPublish;
  const updated = await prisma.announcement.update({
    where: { id: item.id },
    data: {
      ...v.data,
      authorName: authorLabel(teacher),
      status: publish ? STATUS.PUBLISHED : STATUS.PENDING,
      publishedAt: publish ? (item.publishedAt || new Date()) : null,
      reviewNote: null,
    },
  });
  return json(updated);
}

export async function DELETE(req, { params }) {
  const { item, error } = await ownPost(req, params);
  if (error) return error;
  if (item.fileUrl) await removeUpload(item.fileUrl);
  await prisma.announcement.delete({ where: { id: item.id } });
  return json({ ok: true });
}
