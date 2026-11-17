export default function AboutSection() {
  const courseTags = ['傳統工藝', '數位自造', '電子電路', '新興科技', '程式設計'];

  return (
    <section id="about" className="section animate-up">
      <div className="about-grid">
        <div className="about-logo-wrap">
          <img src="/logo.jpg" alt="車城自造教育科技中心 Logo" className="about-logo" />
        </div>

        <div className="about-text">
          <h2>關於車城自造中心</h2>
          <p className="about-fullname">屏東縣立車城國民中學自造教育及科技中心</p>

          <div className="about-meta-badge">
            🏫 2021 年 4 月 9 日揭牌・屏東縣第四所自造教育中心
          </div>

          <p className="about-para">
            車城自造教育科技中心（CCMTC）設立於屏東縣立車城國民中學，是屏東縣南部地區推動自造教育的重要基地。中心秉持「動手做、用科技、想方法、合邏輯」的核心理念，致力於將科技教育帶入偏鄉，縮短城鄉間的數位落差。
          </p>
          <p className="about-para">
            中心服務範圍涵蓋恆春半島六個鄉鎮——車城鄉、枋山鄉、恆春鎮、滿州鄉、獅子鄉與牡丹鄉，共服務 24 所國中小學校，是屏南地區最重要的科技教育資源中心。透過與在地學校深度合作，協助各校發展校訂課程，讓學生在熟悉的土地上探索科技的無限可能。
          </p>
          <p className="about-para">
            目前已培育超過 70 位種子教師，提供教師研習培訓與學生體驗課程，涵蓋傳統工藝、數位自造、電子電路、新興科技與程式設計五大主題，並定期舉辦智創機器人競賽，培養學生解決問題的能力與團隊合作精神。
          </p>

          <div className="about-tags">
            {courseTags.map(tag => (
              <span key={tag} className="about-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
