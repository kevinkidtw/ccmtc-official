import CardNewsBadge from './CardNewsBadge';

export default function QuickAccess({ resultsUrl, siteNews = {} }) {
  // 首頁只放中心的三個主要入口；競賽說明站、教材站一律從「競賽專區」進入。
  const hubs = [
    {
      icon: '🗂️',
      title: '競賽專區',
      desc: '中心辦理的競賽，以及參賽培訓、程式說明與教材，依學年度整理，含歷屆賽事封存資料。',
      linkLabel: '查看全部',
      href: '/contests',
      sameTab: true,
    },
    {
      icon: '📋',
      title: '教學成果發佈',
      desc: '教師上傳課程成果、教學照片與紀錄，即時公開展示，記錄每一堂精彩的課程。',
      linkLabel: '進入成果系統',
      href: resultsUrl,
    },
    {
      icon: '📚',
      title: '課程資源',
      desc: '中心課程的教學簡報、教案、學習單與影片，提供教師與學員線上預覽或下載。',
      linkLabel: '瀏覽資源',
      href: '/resources',
      sameTab: true,
    },
  ];

  // 說明站、教材站、榮譽榜都收在競賽專區，首頁不再逐站放卡片（2026-11-23）。
  // 任何站有 30 天內綁定的新消息時，「競賽專區」卡片顯示 NEW 徽章，連到最新那一則。
  const newest = Object.values(siteNews).sort((a, b) => b.time - a.time)[0];
  hubs[0].news = newest;
  const cards = hubs;
  return (
    <div className="quick-access-wrapper animate-up">
      <div className="quick-access-grid">
        {cards.map((card) => (
          <CardNewsBadge key={card.title} news={card.news}>
          <a
            href={card.href}
            target={card.sameTab ? undefined : '_blank'}
            rel={card.sameTab ? undefined : 'noopener noreferrer'}
            className="access-card"
          >
            <div className="access-icon">{card.icon}</div>
            <div className="access-title">{card.title}</div>
            <p className="access-desc">{card.desc}</p>
            <span className="access-link">
              {card.linkLabel}
              <span className="access-arrow">→</span>
            </span>
          </a>
          </CardNewsBadge>
        ))}
      </div>
    </div>
  );
}
