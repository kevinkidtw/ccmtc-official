import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function isValidToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export async function PUT(req, { params }) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const current = await prisma.announcement.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // If the file is being updated or removed, we could clean up the old file
    if (body.fileUrl !== undefined) {
      const oldItem = await prisma.announcement.findUnique({ where: { id } });
      if (oldItem && oldItem.fileUrl && oldItem.fileUrl !== body.fileUrl) {
        const oldFilename = oldItem.fileUrl.replace('/api/uploads/', '');
        if (oldFilename) {
          const oldFilePath = path.join(process.cwd(), 'public', 'uploads', oldFilename);
          await fs.rm(oldFilePath, { force: true }).catch(err => console.error('Error deleting old attachment file:', err));
        }
      }
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
        ...(body.fileName !== undefined && { fileName: body.fileName }),
        // 審核教師消息：通過 → 發布（第一次發布時記錄時間）；退回 → 附上原因
        ...(body.status === 'published' && { status: 'published', reviewNote: null, publishedAt: current?.publishedAt || new Date() }),
        ...(body.status === 'rejected' && { status: 'rejected', reviewNote: String(body.reviewNote || '').slice(0, 500) || null }),
        ...(body.status === 'pending' && { status: 'pending' }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    
    // Find the item first to get file path for cleanup
    const item = await prisma.announcement.findUnique({ where: { id } });
    if (item && item.fileUrl) {
      const filename = item.fileUrl.replace('/api/uploads/', '');
      if (filename) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await fs.rm(filePath, { force: true }).catch(err => console.error('Error deleting attachment file on delete:', err));
      }
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
