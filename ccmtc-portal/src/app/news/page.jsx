import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { getNewsPage } from '@/lib/newsQuery';
import { NEWS_CATEGORIES, excerpt, displayDate } from '@/lib/newsFormat.mjs';
import { newsCss, formatDate } from './newsStyles';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '最新消息 | 車城自造教育科技中心',
  description: '車城自造教育科技中心與屏南地區學校的課程、競賽與活動消息。',
};

function href(category, page) {
  const q = new URLSearchParams();
  if (category) q.set('cat', category);
  if (page > 1) q.set('page', String(page));
  const s = q.toString();
  return s ? `/news?${s}` : '/news';
}

export default async function NewsPage({ searchParams }) {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  const sp = await searchParams;
  let data = { items: [], total: 0, page: 1, pages: 1, category: null };
  try {
    data = await getNewsPage({ page: sp?.page, category: sp?.cat });
  } catch {
    // 資料庫尚未就緒時顯示空狀態
  }
  const { items, page, pages, category } = data;

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <style dangerouslySetInnerHTML={{ __html: newsCss }} />
      <main style={{ minHeight: '60vh' }}>
        <section className="section" style={{ paddingTop: '3.5rem', paddingBottom: '1.5rem' }}>
          <div className="section-header">
            <div className="section-tag">NEWS</div>
            <h2 className="section-title">最新消息</h2>
            <p className="section-desc">中心與屏南地區學校的課程、競賽與活動消息</p>
            <nav className="newsx-cats" aria-label="分類">
              <a href="/news" className={category ? '' : 'on'}>全部</a>
              {NEWS_CATEGORIES.map(c => (
                <a key={c} href={href(c, 1)} className={category === c ? 'on' : ''}>{c}</a>
              ))}
            </nav>
          </div>
        </section>

        <div className="newsx-wrap">
          {items.length === 0 ? (
            <div className="newsx-empty">目前沒有{category ? `「${category}」的` : ''}消息。</div>
          ) : (
            <ul className="newsx-list">
              {items.map(item => (
                <li key={item.id} className="newsx-row">
                  <a href={`/news/${item.id}`}>
                    <div className="newsx-meta">
                      <span>{formatDate(displayDate(item))}</span>
                      {item.isPinned && <span className="news-pin-badge">置頂</span>}
                      <span className={`news-cat-badge cat-${item.category}`}>{item.category}</span>
                      {item.authorName && <span>· {item.authorName}</span>}
                      {item.fileUrl && <span title="有附件">📎</span>}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{excerpt(item)}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav className="newsx-pager" aria-label="分頁">
              {page > 1 ? <a href={href(category, page - 1)}>← 較新</a> : <span />}
              <span>第 {page} / {pages} 頁</span>
              {page < pages ? <a href={href(category, page + 1)}>較舊 →</a> : <span />}
            </nav>
          )}
        </div>
      </main>
      <Footer resultsUrl={resultsUrl} />
    </>
  );
}
