import { prisma } from '@/lib/prisma';
import { NEWS_CATEGORIES, PAGE_SIZE, recentNewsBySite } from '@/lib/newsFormat.mjs';

/** 官網公開頁面的消息查詢：只取已發布，依發布時間新到舊。 */
const PUBLISHED = { status: 'published' };

/**
 * 首頁「最新消息」條：單純依發布時間取最新幾則，不看置頂。
 * 置頂只影響 /news 列表的排序，否則舊的置頂公告會一直佔住首頁，新消息反而看不到。
 */
export async function getLatestNews(take = 3) {
  const items = await prisma.announcement.findMany({
    where: PUBLISHED, orderBy: { publishedAt: 'desc' }, take,
  });
  const total = await prisma.announcement.count({ where: PUBLISHED });
  return { items, total };
}

/** 卡片 NEW 徽章用：{ siteKey: { id, title, time } } */
export async function getRecentSiteNews(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await prisma.announcement.findMany({
    where: { ...PUBLISHED, siteKey: { not: null }, publishedAt: { gte: since } },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });
  return recentNewsBySite(items, Date.now(), days);
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
