import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ScrollAnimInit from '../components/ScrollAnimInit';
import { SITES, groupByRole, siteHref, accessLabel, badgeLabel } from '@/config/sites.mjs';
import CardNewsBadge from '../components/CardNewsBadge';
import { getRecentSiteNews } from '@/lib/newsQuery';

// 頁尾連結讀執行期環境變數，不能在建置時靜態化
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '競賽專區 | 車城自造教育科技中心',
  description: '車城自造教育科技中心各項競賽的程式說明站、教材與訓練網站入口，依年度整理，含歷屆封存資料。',
};

const css = `
.contest-jump{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;margin-top:1.25rem}
.contest-jump a{font-size:.9rem;font-weight:700;padding:.45rem 1rem;border-radius:999px;
  border:2px solid var(--theme-color);color:var(--theme-dark);text-decoration:none}
.contest-jump a:hover{background:var(--theme-light)}
.contest-role{max-width:1200px;margin:0 auto 3.5rem;padding:0 1.5rem;scroll-margin-top:80px}
.contest-role-head{border-left:5px solid var(--theme-color);padding:.25rem 0 .25rem 1rem;margin-bottom:1.75rem}
.contest-role-head h2{font-size:1.6rem;font-weight:900;margin:.35rem 0 .3rem}
.contest-role-head p{margin:0;color:var(--text-muted);line-height:1.7}
.contest-year{margin:0 0 2.25rem}
.contest-year h3{font-size:1.25rem;font-weight:900;margin:0 0 1rem;display:flex;align-items:center;gap:.6rem}
.contest-year h3 small{font-size:.8rem;font-weight:700;color:var(--text-muted)}
.contest-badges{display:flex;flex-wrap:wrap;gap:6px}
.contest-badge{font-size:.72rem;font-weight:800;padding:2px 8px;border-radius:999px;
  background:var(--theme-light);color:var(--theme-dark);letter-spacing:.02em}
.contest-badge.lock{background:#e0e7ff;color:#3730a3}
.contest-badge.open{background:#dcfce7;color:#166534}
.contest-badge.archived{background:#e5e7eb;color:#374151}
.access-card.is-archived{opacity:.78}
.contest-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem}
`;

export default async function ContestsPage() {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  const sections = groupByRole(SITES);
  let siteNews = {};
  try { siteNews = await getRecentSiteNews(); } catch { /* 資料庫未就緒就不顯示徽章 */ }

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <main style={{ minHeight: '60vh' }}>
        <section className="section animate-up" style={{ paddingTop: '3.5rem', paddingBottom: '1rem' }}>
          <div className="section-header">
            <div className="section-tag">CONTESTS</div>
            <h2 className="section-title">競賽專區</h2>
            <p className="section-desc">
              中心辦理的競賽，以及中心隊伍參賽用的培訓與程式說明；已結束的賽事保留為封存資料
            </p>
            <nav className="contest-jump">
              {sections.map(([role]) => (
                <a key={role.key} href={`#${role.key}`}>{role.title}</a>
              ))}
            </nav>
          </div>
        </section>

        {sections.map(([role, groups]) => (
          <section key={role.key} id={role.key} className="contest-role animate-up">
            <div className="contest-role-head">
              <div className="section-tag">{role.tag}</div>
              <h2>{role.title}</h2>
              <p>{role.desc}</p>
            </div>
            {groups.map(([year, sites]) => (
              <div key={year} className="contest-year">
                <h3>
                  {`${year} 學年度`}
                  <small>
                    {sites.some(s => s.status !== 'archived')
                      ? `${sites.filter(s => s.status !== 'archived').length} 個進行中`
                      : '已結束'}
                  </small>
                </h3>
                <div className="contest-grid">
                  {sites.map(s => (
                    <CardNewsBadge key={s.key} news={siteNews[s.key]}>
                    <a
                      href={siteHref(s)}
                      className={`access-card${s.status === 'archived' ? ' is-archived' : ''}`}
                    >
                      <div className="access-icon">{s.icon}</div>
                      <div className="contest-badges">
                        <span className="contest-badge">{badgeLabel(s)}</span>
                        {s.status === 'archived' && <span className="contest-badge archived">已封存</span>}
                        {accessLabel(s)
                          ? <span className="contest-badge lock">{accessLabel(s)}</span>
                          : <span className="contest-badge open">公開</span>}
                      </div>
                      <div className="access-title">{s.title}</div>
                      <p className="access-desc">{s.desc}</p>
                      <span className="access-link">
                        {s.status === 'archived' ? '查看封存資料' : '進入網站'}
                        <span className="access-arrow">→</span>
                      </span>
                    </a>
                    </CardNewsBadge>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      <Footer resultsUrl={resultsUrl} />
      <ScrollAnimInit />
    </>
  );
}
