'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function NavBar({ resultsUrl }) {
  const [open, setOpen] = useState(false);

  const links = [
    { label: '關於中心', href: '/#about' },
    { label: '課程服務', href: '/#courses' },
    { label: '課程資源', href: '/resources' },
    // 各競賽說明站、教材站、資科訓練統一收在競賽專區（清單見 src/config/sites.mjs）
    { label: '競賽專區', href: '/contests' },
    { label: '最新消息', href: '/#news' },
    { label: '服務範圍', href: '/#service-area' },
    { label: '聯絡我們', href: '/#contact' },
  ];

  const close = () => setOpen(false);

  return (
    <>
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <img src="/logo.jpg" alt="CCMTC Logo" className="navbar-logo" />
          <span className="navbar-name">車城自造教育科技中心</span>
          <span className="navbar-name-short">CCMTC</span>
        </a>

        <div className="navbar-links">
          {links.map(l => (
            <a key={l.href} href={l.href} className="navbar-link">{l.label}</a>
          ))}
          <a href={resultsUrl} target="_blank" rel="noopener noreferrer" className="navbar-cta">
            教學成果 ↗
          </a>
        </div>

        <button
          className="navbar-hamburger"
          onClick={() => setOpen(v => !v)}
          aria-label="選單"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          )}
        </button>
      </nav>

      <div className={`navbar-mobile-menu${open ? ' open' : ''}`}>
        {links.map(l => (
          <a key={l.href} href={l.href} className="navbar-mobile-link" onClick={close}>{l.label}</a>
        ))}
        <a
          href={resultsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-mobile-link"
          onClick={close}
          style={{ color: 'var(--theme-dark)', fontWeight: 800 }}
        >
          教學成果系統 ↗
        </a>
      </div>
    </>
  );
}
