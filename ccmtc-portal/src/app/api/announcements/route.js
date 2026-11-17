import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pinned = await prisma.announcement.findMany({
      where: { isPinned: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    const rest = await prisma.announcement.findMany({
      where: { isPinned: false },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });
    return NextResponse.json([...pinned, ...rest]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
