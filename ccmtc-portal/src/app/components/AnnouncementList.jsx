'use client';
import { useState } from 'react';

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AnnouncementList({ announcements }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  return (
    <section id="news" className="section animate-up">
      <div className="section-header">
        <div className="section-tag">NEWS</div>
        <h2 className="section-title">最新消息</h2>
        <p className="section-desc">中心最新公告、課程消息與競賽資訊</p>
      </div>

      <div className="news-layout">
        <div className="news-list">
          {announcements.length === 0 ? (
            <div className="news-empty">目前尚無公告，請稍後再查看。</div>
          ) : (
            announcements.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="news-item">
                  <div className="news-item-header" onClick={() => toggle(item.id)}>
                    <span className="news-date">{formatDate(item.createdAt)}</span>
                    {item.isPinned && <span className="news-pin-badge">置頂</span>}
                    <span className={`news-cat-badge cat-${item.category}`}>{item.category}</span>
                    <span className="news-title">{item.title}</span>
                    <span className={`news-chevron${isOpen ? ' open' : ''}`}>▾</span>
                  </div>
                  <div className={`news-item-body${isOpen ? ' open' : ''}`}>
                    <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: item.content }} />
                    {item.fileUrl && (
                      <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px dashed rgba(26,26,46,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        {/\.(png|jpe?g|gif|webp|svg)$/i.test(item.fileUrl) && (
                          <div style={{
                            width: '100%',
                            maxWidth: '720px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            margin: '0.5rem 0'
                          }}>
                            <img 
                              src={item.fileUrl} 
                              alt={item.fileName || '公告圖片'} 
                              style={{ width: '100%', height: 'auto', display: 'block' }} 
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.875rem', color: '#1a1a2e', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📎 相關附件：</span>
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download={item.fileName || '下載附件'}
                            style={{
                              fontSize: '0.825rem',
                              color: '#1e40af',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dbeafe';
                              e.currentTarget.style.borderColor = '#93c5fd';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#eff6ff';
                              e.currentTarget.style.borderColor = '#bfdbfe';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <span style={{ fontSize: '0.9rem' }}>📥</span> {item.fileName || '點此下載附件'}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="news-sidebar">
          <h3>📢 公告訂閱</h3>
          <p>
            請定期關注本中心最新公告，掌握課程報名、競賽資訊與活動消息，
            歡迎各校師長轉知同仁與學生。
          </p>
          <div className="news-sidebar-contact">
            📞 08-882-1045 分機19<br />
            🏫 車城國中自造中心
          </div>
        </div>
      </div>
    </section>
  );
}
