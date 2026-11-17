export default function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-inner">
        <div className="section-header" style={{ color: '#1a1a2e' }}>
          <div className="section-tag" style={{ background: 'rgba(0,0,0,0.12)', color: '#1a1a2e' }}>CONTACT</div>
          <h2 className="section-title" style={{ color: '#1a1a2e' }}>聯絡我們</h2>
          <p className="section-desc" style={{ color: 'rgba(26,26,46,0.75)' }}>歡迎各校師長與家長與我們聯繫，共同推動屏南科技教育</p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon">📍</div>
            <div className="contact-card-title">地址</div>
            <p className="contact-card-text">
              94441 屏東縣車城鄉<br />
              福興村新興路 42 號<br />
              屏東縣立車城國民中學
            </p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">📞</div>
            <div className="contact-card-title">電話 / 傳真</div>
            <p className="contact-card-text">
              電話：08-882-1045 分機19<br />
              傳真：08-882-4178<br />
              電話：08-882-3723 分機19
            </p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">🕐</div>
            <div className="contact-card-title">服務時間</div>
            <p className="contact-card-text">
              週一至週五<br />
              08:00 – 17:00<br />
              （例假日及國定假日除外）
            </p>
          </div>

          <div className="contact-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="contact-card-icon" style={{ color: '#1877F2' }}>👥</div>
            <div className="contact-card-title">官方粉絲專頁</div>
            <p className="contact-card-text" style={{ flex: 1 }}>
              按讚追蹤最新科技課程、教師研習與競賽花絮資訊。
            </p>
            <div style={{ marginTop: '1rem' }}>
              <a 
                href="https://www.facebook.com/profile.php?id=100064024092239&locale=zh_TW" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-card-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>前往粉專 ↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
