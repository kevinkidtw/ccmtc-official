/**
 * 卡片外框：包住一張 .access-card，若該站最近有綁定的消息就在右上角加「NEW」徽章。
 * 徽章是獨立連結（不能把 <a> 放進卡片的 <a> 裡），點了直接到那則消息。
 */
export default function CardNewsBadge({ news, children }) {
  return (
    <div className="card-wrap">
      {children}
      {news && (
        <a className="card-news-badge" href={`/news/${news.id}`} title={news.title}>
          NEW · 有新消息
        </a>
      )}
    </div>
  );
}
