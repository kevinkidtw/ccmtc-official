import { redirect } from 'next/navigation';
import { SITES, safeNext } from '@/lib/siteAuth';

/**
 * 所有子站共用的通行碼登入頁：/guide-login?site=<代號>&next=<原本要去的頁>
 * 站名、說明小字都從 src/config/sites.mjs 來，新增站台不用再複製一份登入頁。
 */
export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const site = typeof sp?.site === 'string' && Object.hasOwn(SITES, sp.site) ? SITES[sp.site] : null;
  return {
    title: `${site ? site.title : '說明站'} · 通行碼`,
    robots: { index: false, follow: false },
  };
}

// 每次都要即時算（不能被靜態快取），否則錯誤提示會卡住
export const dynamic = 'force-dynamic';

const css = `
.rb-login-page{min-height:100vh;display:grid;place-items:center;padding:24px;
  background:#f4f6f8;color:#0f172a;
  font-family:"Noto Sans TC","PingFang TC","Heiti TC","Microsoft JhengHei",system-ui,sans-serif}
.rb-login-card{width:100%;max-width:420px;background:#ffffff;border:1px solid #cbd5e1;
  border-top:4px solid #1d4ed8;border-radius:3px;padding:32px 30px 28px;
  box-shadow:0 1px 3px rgba(15,23,42,.06),0 10px 30px -18px rgba(15,23,42,.35)}
.rb-login-kicker{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;
  font-weight:600;letter-spacing:.14em;color:#475569;margin:0 0 10px}
.rb-login-card h1{font-size:25px;font-weight:900;line-height:1.3;margin:0 0 8px;letter-spacing:.01em}
.rb-login-card p.sub{font-size:14px;color:#334155;line-height:1.7;margin:0 0 22px}
.rb-login-card label{display:block;font-size:13px;font-weight:700;margin:0 0 7px}
.rb-login-card input{width:100%;font:inherit;font-size:16px;padding:11px 13px;
  border:1px solid #cbd5e1;border-radius:2px;background:#fff;color:#0f172a}
.rb-login-card input:focus{outline:2px solid #1d4ed8;outline-offset:1px;border-color:#1d4ed8}
.rb-login-card button{width:100%;margin-top:16px;font:inherit;font-size:15px;font-weight:700;
  color:#fff;background:#1e40af;border:0;border-radius:2px;padding:12px;cursor:pointer}
.rb-login-card button:hover{background:#1e3a8a}
.rb-login-err{background:#fee2e2;border-left:3px solid #b91c1c;border-radius:3px;
  padding:11px 14px;margin:0 0 18px;font-size:13.5px;color:#b91c1c}
.rb-login-foot{margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;
  font-size:12.5px;color:#475569;line-height:1.7}
.rb-login-foot a{color:#1d4ed8}
@media (prefers-color-scheme:dark){
  .rb-login-page{background:#0b0f17;color:#f1f5f9}
  .rb-login-card{background:#131b26;border-color:#334155;
    box-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -18px rgba(0,0,0,.9)}
  .rb-login-kicker{color:#94a3b8}
  .rb-login-card p.sub{color:#cbd5e1}
  .rb-login-card input{background:#0b0f17;border-color:#334155;color:#f1f5f9}
  .rb-login-err{background:#3b1219;color:#f87171;border-left-color:#f87171}
  .rb-login-foot{border-top-color:#1e293b;color:#94a3b8}
  .rb-login-foot a{color:#60a5fa}
}
`;

export default async function GuideLogin({ searchParams }) {
  const sp = await searchParams;
  const key = typeof sp?.site === 'string' ? sp.site : '';
  const site = Object.hasOwn(SITES, key) ? SITES[key] : null;
  if (!site) redirect('/contests');

  const next = safeNext(typeof sp?.next === 'string' ? sp.next : `${site.prefix}/`, site);
  // 公開站不需要通行碼，誤入登入頁時直接送回目的地。
  if (site.isPublic) redirect(next);
  const failed = sp?.e === '1';

  return (
    <div className="rb-login-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="rb-login-card">
        <p className="rb-login-kicker">{site.kicker}</p>
        <h1>{site.title}</h1>
        <p className="sub">通行碼向指導老師索取。</p>

        {failed && <p className="rb-login-err">通行碼不對，再試一次。</p>}

        <form method="post" action="/api/guide-login">
          <input type="hidden" name="site" value={site.key} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="rb-pass">通行碼</label>
          <input
            id="rb-pass"
            name="pass"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
          />
          <button type="submit">進入{site.name}</button>
        </form>

        <p className="rb-login-foot">
          輸入一次之後這台裝置會記住 30 天。<br />
          <a href="/contests">← 競賽專區</a>　<a href="/">回車城自造教育科技中心官網</a>
        </p>
      </div>
    </div>
  );
}
