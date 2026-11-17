import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function isValidToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export async function PUT(req, { params }) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const data = {};
    for (const key of ['courseName', 'title', 'type', 'fileUrl', 'fileName', 'externalUrl', 'note']) {
      if (key in body) data[key] = body[key];
    }
    if ('sortOrder' in body) data.sortOrder = Number.isFinite(+body.sortOrder) ? +body.sortOrder : 0;
    const item = await prisma.courseResource.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isValidToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.courseResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
