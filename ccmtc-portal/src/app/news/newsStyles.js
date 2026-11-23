/** /news 與 /news/[id] 共用樣式（沿用首頁 news-* 的色票與分類徽章 .cat-*）。 */
export const newsCss = `
.newsx-wrap{max-width:960px;margin:0 auto;padding:0 1.5rem 4rem}
.newsx-cats{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-top:1.25rem}
.newsx-cats a{font-size:.88rem;font-weight:700;padding:.4rem .95rem;border-radius:999px;border:2px solid var(--theme-color);
  color:var(--theme-dark);text-decoration:none}
.newsx-cats a.on,.newsx-cats a:hover{background:var(--theme-color);color:#1a1a2e}
.newsx-list{list-style:none;margin:0;padding:0;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.05);overflow:hidden}
.newsx-row{border-bottom:1px solid #f1f5f9}
.newsx-row:last-child{border-bottom:none}
.newsx-row a{display:block;padding:1.1rem 1.4rem;text-decoration:none;color:inherit}
.newsx-row a:hover{background:var(--theme-lighter)}
.newsx-meta{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;font-size:.8rem;color:var(--text-muted)}
.newsx-row h3{font-size:1.02rem;font-weight:800;margin:.4rem 0 .25rem;line-height:1.5;color:var(--text-main)}
.newsx-row p{margin:0;font-size:.88rem;color:var(--text-muted);line-height:1.6}
.newsx-pager{display:flex;justify-content:center;align-items:center;gap:1rem;margin-top:1.75rem;font-weight:700}
.newsx-pager a{color:var(--theme-dark);text-decoration:none;padding:.4rem .9rem;border-radius:8px;border:1.5px solid var(--theme-color)}
.newsx-pager span{color:var(--text-muted);font-size:.9rem}
.newsx-empty{text-align:center;padding:3rem 1rem;color:var(--text-muted)}
.newsx-article{background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.05);padding:2rem 2.25rem}
.newsx-article h1{font-size:1.55rem;font-weight:900;line-height:1.45;margin:.6rem 0 1rem}
.newsx-body{line-height:1.85;font-size:1rem;color:var(--text-main);white-space:pre-wrap;overflow-wrap:anywhere}
.newsx-body img{max-width:100%;height:auto}
.newsx-body a{color:#1e40af}
.newsx-site{display:flex;align-items:center;gap:.9rem;margin-top:1.75rem;padding:1rem 1.2rem;border-radius:12px;
  border:2px solid var(--theme-color);background:var(--theme-lighter);text-decoration:none;color:inherit}
.newsx-site b{display:block;font-size:1rem}
.newsx-site small{color:var(--text-muted)}
.newsx-file{margin-top:1.5rem;padding-top:1rem;border-top:1px dashed rgba(26,26,46,.15)}
.newsx-file img{display:block;max-width:100%;border-radius:8px;margin-bottom:.75rem}
.newsx-file a{display:inline-flex;gap:6px;font-weight:700;font-size:.88rem;color:#1e40af;background:#eff6ff;border:1px solid #bfdbfe;
  padding:6px 14px;border-radius:8px;text-decoration:none}
.newsx-back{display:inline-block;margin:0 0 1rem;font-weight:700;color:var(--theme-dark);text-decoration:none}
@media (max-width:600px){.newsx-article{padding:1.4rem 1.1rem}.newsx-article h1{font-size:1.3rem}.newsx-row a{padding:1rem}}
`;

export function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });
}
