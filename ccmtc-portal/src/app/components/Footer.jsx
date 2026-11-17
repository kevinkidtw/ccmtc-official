'use client';

import { useState, useEffect } from 'react';

export default function Footer({ resultsUrl }) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    fetch('/api/counter?site=portal')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setViews(data.count);
        }
      })
      .catch(err => console.error('Failed to load view count:', err));
  }, []);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/logo.jpg" alt="CCMTC" className="footer-logo" />
              <span className="footer-name">車城自造教育科技中心<br />CCMTC</span>
            </div>
            <p className="footer-tagline">
              屏東縣立車城國民中學自造教育及科技中心<br />
              啟迪創造力・連結在地知識・培育未來人才<br />
              服務屏南六鄉鎮・24 所學校・70+ 種子教師
            </p>
            <div className="footer-social" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a 
                href="https://www.facebook.com/profile.php?id=100064024092239&locale=zh_TW" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>追蹤官方粉專</span>
              </a>
            </div>
          </div>

          <div>
            <div className="footer-col-title">系統入口</div>
            <div className="footer-links">
              <a href={resultsUrl} target="_blank" rel="noopener noreferrer" className="footer-link">教學成果發佈系統</a>
              <a href="/contests" className="footer-link">競賽專區</a>
              <a href="/competition/" className="footer-link">屏南區智創機器人競賽（封存）</a>
            </div>
          </div>

          <div>
            <div className="footer-col-title">快速連結</div>
            <div className="footer-links">
              <a href="/#about" className="footer-link">關於中心</a>
              <a href="/#courses" className="footer-link">課程服務</a>
              <a href="/resources" className="footer-link">課程資源</a>
              <a href="/#news" className="footer-link">最新消息</a>
              <a href="/#service-area" className="footer-link">服務範圍</a>
              <a href="/#contact" className="footer-link">聯絡我們</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span className="footer-copy">© 2026 屏東縣立車城國民中學自造教育及科技中心 CCMTC. 版權所有。</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>📊 累積瀏覽次數：</span>
              <strong style={{ color: 'var(--theme-color)', fontFamily: 'monospace', fontWeight: 700 }}>{views !== null ? views.toLocaleString() : '...'}</strong>
            </span>
            <span className="footer-tech">Powered by Claude Code</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
