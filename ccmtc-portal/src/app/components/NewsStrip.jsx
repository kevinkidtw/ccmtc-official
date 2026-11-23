import { displayDate } from '@/lib/newsFormat.mjs';

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });
}

/**
 * 首頁快速入口下方的精簡消息條：只放最新 3 則的日期、分類、標題。
 * 內容一律點進 /news/<id> 看；完整列表在 /news。（2026-11-23 取代原本首頁下方的展開式公告區）
 */
export default function NewsStrip({ items = [], total = 0 }) {
  return (
    <section id="news" className="news-strip animate-up" aria-labelledby="news-strip-title">
      <div className="news-strip-head">
        <h2 id="news-strip-title">📢 最新消息</h2>
        <a href="/news" className="news-strip-more">看全部{total ? `（${total} 則）` : ''} →</a>
      </div>
      {items.length === 0 ? (
        <p className="news-strip-empty">目前尚無消息。</p>
      ) : (
        <ul className="news-strip-list">
          {items.map(item => (
            <li key={item.id}>
              <a href={`/news/${item.id}`}>
                <span className="news-strip-date">{formatDate(displayDate(item))}</span>
                <span className={`news-cat-badge cat-${item.category}`}>{item.category}</span>
                <span className="news-strip-title">{item.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="news-strip-foot">
        屏南地區教師可申請帳號自行發布消息：<a href="/news-admin">教師發布消息 →</a>
      </div>
    </section>
  );
}
