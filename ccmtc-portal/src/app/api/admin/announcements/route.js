import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function isValidToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const all = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { title, content, category, isPinned, fileUrl, fileName } = await req.json();
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '標題與內容為必填' }, { status: 400 });
    }
    const item = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || '一般公告',
        isPinned: !!isPinned,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
