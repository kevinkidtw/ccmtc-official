import { prisma } from '@/lib/prisma';
import { NEWS_CATEGORIES, PAGE_SIZE } from '@/lib/newsFormat.mjs';

/** 官網公開頁面的消息查詢：只取已發布，依發布時間新到舊。 */
const PUBLISHED = { status: 'published' };

export async function getHomeNews() {
  const pinned = await prisma.announcement.findMany({
    where: { ...PUBLISHED, isPinned: true }, orderBy: { publishedAt: 'desc' }, take: 3,
  });
  const rest = await prisma.announcement.findMany({
    where: { ...PUBLISHED, isPinned: false }, orderBy: { publishedAt: 'desc' }, take: 6,
  });
  const total = await prisma.announcement.count({ where: PUBLISHED });
  return { items: [...pinned, ...rest], total };
}

export async function getNewsPage({ page = 1, category = null } = {}) {
  const cat = NEWS_CATEGORIES.includes(category) ? category : null;
  const where = { ...PUBLISHED, ...(cat && { category: cat }) };
  const total = await prisma.announcement.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const p = Math.min(Math.max(1, Number.parseInt(page, 10) || 1), pages);
  const items = await prisma.announcement.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    skip: (p - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { items, total, page: p, pages, category: cat };
}

export async function getNewsItem(id) {
  if (typeof id !== 'string' || id.length > 64) return null;
  const item = await prisma.announcement.findUnique({ where: { id } });
  return item && item.status === 'published' ? item : null;
}
