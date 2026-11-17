export default function ServiceArea() {
  const townships = [
    { name: '車城鄉', note: '中心所在地・恆春半島北大門', isCenter: true },
    { name: '恆春鎮', note: '半島核心・觀光文化重鎮' },
    { name: '枋山鄉', note: '屏南門戶・海岸自然生態' },
    { name: '滿州鄉', note: '東海岸・牧野風情' },
    { name: '獅子鄉', note: '山地原鄉・排灣族文化' },
    { name: '牡丹鄉', note: '排灣族聚落・牡丹水庫' },
  ];

  const stats = [
    { icon: '🏫', num: '24', label: '服務學校' },
    { icon: '🗺️', num: '6', label: '服務鄉鎮' },
    { icon: '👩‍🏫', num: '70+', label: '種子教師' },
    { icon: '📅', num: '5', label: '年服務經驗' },
  ];

  return (
    <section id="service-area" className="section animate-up">
      <div className="section-header">
        <div className="section-tag">SERVICE AREA</div>
        <h2 className="section-title">服務範圍</h2>
        <p className="section-desc">深耕屏南六鄉鎮，讓每一所偏鄉學校都能享有優質科技教育資源</p>
      </div>

      <div className="service-layout">
        <div className="township-grid">
          {townships.map((t) => (
            <div key={t.name} className={`township-card${t.isCenter ? ' center' : ''}`}>
              <div className="township-name">{t.name}</div>
              <div className="township-note">{t.note}</div>
              {t.isCenter && <div className="township-center-badge">中心所在地</div>}
            </div>
          ))}
        </div>

        <div className="service-stats">
          {stats.map((s) => (
            <div key={s.label} className="service-stat-card">
              <div className="service-stat-icon">{s.icon}</div>
              <div>
                <div className="service-stat-num">{s.num}</div>
                <div className="service-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
