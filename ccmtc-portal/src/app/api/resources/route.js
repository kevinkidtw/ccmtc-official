import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const all = await prisma.courseResource.findMany({
      orderBy: [{ courseName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
