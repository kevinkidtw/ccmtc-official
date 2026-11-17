import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function isValidToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const all = await prisma.courseResource.findMany({
      orderBy: [{ courseName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { courseName, title, type, fileUrl, fileName, externalUrl, note, sortOrder } = await req.json();
    if (!courseName?.trim() || !title?.trim()) {
      return NextResponse.json({ error: '課程名稱與資源標題為必填' }, { status: 400 });
    }
    if (!fileUrl && !externalUrl?.trim()) {
      return NextResponse.json({ error: '請上傳檔案或填寫外部連結（至少一項）' }, { status: 400 });
    }
    const item = await prisma.courseResource.create({
      data: {
        courseName: courseName.trim(),
        title: title.trim(),
        type: type || '附件',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        externalUrl: externalUrl?.trim() || null,
        note: note?.trim() || null,
        sortOrder: Number.isFinite(+sortOrder) ? +sortOrder : 0,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
