import { notFound } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { getNewsItem } from '@/lib/newsQuery';
import { renderContent, excerpt, displayDate } from '@/lib/newsFormat.mjs';
import { getSite, siteHref } from '@/config/sites.mjs';
import { newsCss, formatDate } from '../newsStyles';

export const dynamic = 'force-dynamic';

async function load(params) {
  const { id } = await params;
  try {
    return await getNewsItem(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const item = await load(params);
  if (!item) return { title: '找不到消息 | 車城自造教育科技中心' };
  const isImage = item.fileUrl && /\.(png|jpe?g|gif|webp)$/i.test(item.fileUrl);
  return {
    title: `${item.title} | 車城自造教育科技中心`,
    description: excerpt(item, 120),
    openGraph: {
      title: item.title,
      description: excerpt(item, 120),
      type: 'article',
      ...(isImage && { images: [item.fileUrl] }),
    },
  };
}

export default async function NewsItemPage({ params }) {
  const item = await load(params);
  if (!item) notFound();
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  const site = item.siteKey ? getSite(item.siteKey) : null;
  const isImage = item.fileUrl && /\.(png|jpe?g|gif|webp)$/i.test(item.fileUrl);

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <style dangerouslySetInnerHTML={{ __html: newsCss }} />
      <main style={{ minHeight: '60vh', paddingTop: '2.5rem' }}>
        <div className="newsx-wrap">
          <a href="/news" className="newsx-back">← 最新消息</a>
          <article className="newsx-article">
            <div className="newsx-meta">
              <span>{formatDate(displayDate(item))}</span>
              {item.isPinned && <span className="news-pin-badge">置頂</span>}
              <span className={`news-cat-badge cat-${item.category}`}>{item.category}</span>
              {item.authorName && <span>· {item.authorName}</span>}
            </div>
            <h1>{item.title}</h1>
            <div className="newsx-body" dangerouslySetInnerHTML={{ __html: renderContent(item) }} />

            {site && (
              <a className="newsx-site" href={siteHref(site)}>
                <span style={{ fontSize: '1.8rem' }}>{site.icon}</span>
                <span><b>{site.title}</b><small>前往相關網站 →</small></span>
              </a>
            )}

            {item.fileUrl && (
              <div className="newsx-file">
                {isImage && <img src={item.fileUrl} alt={item.fileName || '公告圖片'} />}
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">📥 {item.fileName || '下載附件'}</a>
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer resultsUrl={resultsUrl} />
    </>
  );
}
