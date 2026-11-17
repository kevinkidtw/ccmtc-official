import { NextResponse } from 'next/server';
import { getSiteByPath, signPass, safeEqual, getBaseOrigin } from '@/lib/siteAuth';

/**
 * 子站（競賽說明站、教材站）的前置處理。站台清單見 src/config/sites.mjs。
 *   1. 沒有結尾斜線時 308 導正（站內用相對連結，少了斜線會全部指錯）。
 *   2. 需要通行碼的站，在伺服器端檢查簽章 cookie —— 靜態網站用 JS 檢查密碼等於沒有保護。
 *
 * matcher 必須是靜態字面值，無法從清單產生，所以放寬成「全部頁面」，
 * 再由 getSiteByPath 判斷；不屬於任何子站的路徑會直接放行。
 */
export const config = {
  matcher: ['/((?!_next/|api/|favicon\\.ico).*)'],
};

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const site = getSiteByPath(pathname);
  if (!site) {
    return NextResponse.next();
  }

  const origin = getBaseOrigin(request);

  if (pathname === site.prefix) {
    return NextResponse.redirect(new URL(`${site.prefix}/${search}`, origin), 308);
  }

  if (site.isPublic) {
    return NextResponse.next();
  }

  const pass = process.env[site.envVar];
  if (!pass) {
    // 沒設定就不放行 —— 漏填設定不該變成全站公開。
    return new NextResponse(
      `${site.name}尚未設定通行碼，請聯絡管理者。`,
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const got = request.cookies.get(site.cookie)?.value;
  if (got && safeEqual(got, await signPass(pass, site))) {
    return NextResponse.next();
  }

  const login = new URL(site.loginPath, origin);
  login.searchParams.set('next', pathname + search);
  const res = NextResponse.redirect(login, 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
