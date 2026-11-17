import { SITES, siteHref, accessLabel } from '@/config/sites.mjs';

export default function QuickAccess({ resultsUrl }) {
  // 第一列：中心的三個主要入口；其下為各說明站（依站台清單順序）。
  // 格線一列 3 張：共 8 張時寬螢幕為 3＋3＋2、平板為 2×4，不會只剩一張落單。
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

  // 說明站／教材站卡片由站台清單產生（featured 且進行中的才上首頁）
  const guides = SITES.filter(site => site.featured && site.status !== 'archived').map(site => ({
    icon: site.icon,
    title: site.title,
    desc: accessLabel(site) ? `${site.desc}${accessLabel(site)}。` : site.desc,
    linkLabel: '進入網站',
    href: siteHref(site),
    sameTab: true,
  }));

  const cards = [...hubs, ...guides];

  return (
    <div className="quick-access-wrapper animate-up">
      <div className="quick-access-grid">
        {cards.map((card) => (
          <a
            key={card.title}
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
        ))}
      </div>
    </div>
  );
}
