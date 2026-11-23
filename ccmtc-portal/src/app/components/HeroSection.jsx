export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orb-1" aria-hidden="true" />
      <div className="hero-orb-2" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-badge">屏東縣第四所自造教育中心・2020 年啟用</div>

        <h1 className="hero-title">
          車城自造教育科技中心
          <span className="hero-title-abbr">CCMTC</span>
        </h1>

        <p className="hero-subtitle">啟迪創造力・連結在地知識・培育未來人才</p>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-number">6</div>
            <div className="hero-stat-label">服務鄉鎮</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">24</div>
            <div className="hero-stat-label">合作學校</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">70+</div>
            <div className="hero-stat-label">種子教師</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">5</div>
            <div className="hero-stat-label">課程類別</div>
          </div>
        </div>

      </div>

      <div className="scroll-hint" aria-hidden="true">
        <span>向下探索</span>
        <div className="scroll-arrow" />
      </div>
    </section>
  );
}
