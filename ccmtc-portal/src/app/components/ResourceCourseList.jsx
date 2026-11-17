'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TYPE_META = {
  '簡報': { icon: '📊', color: '#f2b705' },
  '教案': { icon: '📘', color: '#3b82f6' },
  '學習單': { icon: '📝', color: '#10b981' },
  '影片': { icon: '🎬', color: '#ef4444' },
  '連結': { icon: '🔗', color: '#8b5cf6' },
  '附件': { icon: '📎', color: '#64748b' },
};

// pptx 不提供預覽（線上檢視器相容性不佳），docx/xlsx 走 Office 檢視器，pdf/圖片原生預覽
const OFFICE_EXT = /\.(docx?|xlsx?)$/i;
const PDF_EXT = /\.pdf$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

function getPreviewKind(item) {
  const path = item.fileUrl || '';
  if (!path) return null;
  if (OFFICE_EXT.test(path)) return 'office';
  if (PDF_EXT.test(path)) return 'pdf';
  if (IMAGE_EXT.test(path)) return 'image';
  return null;
}

function buildPreviewSrc(item, kind) {
  const absUrl = window.location.origin + item.fileUrl;
  if (kind === 'office') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absUrl)}`;
  }
  return absUrl;
}

function PreviewModal({ item, onClose }) {
  const kind = getPreviewKind(item);
  const src = buildPreviewSrc(item, kind);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1100px, 96vw)', height: 'min(760px, 88vh)',
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0.7rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
        }}>
          <span style={{
            flex: 1, minWidth: 0, fontWeight: 700, fontSize: '0.9rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.title}{item.fileName ? `｜${item.fileName}` : ''}
          </span>
          <a
            href={item.fileUrl}
            download={item.fileName || true}
            style={{
              fontSize: '0.78rem', fontWeight: 700, color: '#1e40af',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              padding: '4px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0,
            }}
          >
            📥 下載
          </a>
          <button
            onClick={onClose}
            aria-label="關閉預覽"
            style={{
              fontSize: '1rem', fontWeight: 700, lineHeight: 1, cursor: 'pointer',
              border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: '#eef2f7' }}>
          {kind === 'image' ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <img src={src} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <iframe
              src={src}
              title={`預覽：${item.title}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ResourceCourseList({ courses }) {
  const [previewItem, setPreviewItem] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 960, margin: '0 auto' }}>
      {courses.map(([courseName, items]) => (
        <div key={courseName} className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <h3 style={{
            fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem',
            borderLeft: '4px solid var(--theme-color)', paddingLeft: 12,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {courseName}
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
              background: '#f1f5f9', padding: '2px 10px', borderRadius: 999,
            }}>
              {items.length} 項資源
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META['附件'];
              const href = item.externalUrl || item.fileUrl;
              const isExternal = !!item.externalUrl;
              const canPreview = !isExternal && !!getPreviewKind(item);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '0.9rem 1.1rem', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    transition: 'border-color .2s ease, box-shadow .2s ease',
                  }}
                >
                  <span style={{
                    fontSize: '1.35rem', width: 44, height: 44, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: `${meta.color}18`,
                  }}>
                    {meta.icon}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem' }}>
                      {item.title}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.note || item.fileName || item.externalUrl || ''}
                    </span>
                  </span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: meta.color,
                    border: `1.5px solid ${meta.color}55`, background: `${meta.color}10`,
                    padding: '3px 10px', borderRadius: 999, flexShrink: 0,
                  }}>
                    {item.type}
                  </span>
                  {canPreview && (
                    <button
                      onClick={() => setPreviewItem(item)}
                      style={{
                        fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-dark)',
                        border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        padding: '5px 12px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      預覽 👁
                    </button>
                  )}
                  <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    download={!isExternal ? (item.fileName || true) : undefined}
                    style={{
                      fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-dark)',
                      textDecoration: 'none', flexShrink: 0,
                    }}
                  >
                    {isExternal ? '開啟 ↗' : '下載 ⬇'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}
