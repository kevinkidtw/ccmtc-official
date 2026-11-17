import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');

    if (!site) {
      return NextResponse.json({ error: 'Missing site parameter' }, { status: 400 });
    }

    // 使用 upsert 來原子性遞增計數。
    // 如果 site 不存在，則初始化 count 為 1；如果已存在，則 count 遞增 1。
    const counter = await prisma.counter.upsert({
      where: { site },
      update: { count: { increment: 1 } },
      create: { site, count: 1 },
    });

    return NextResponse.json(
      { success: true, site: counter.site, count: counter.count },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  } catch (err) {
    console.error('Counter API error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
