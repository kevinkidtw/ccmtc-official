import { NextResponse } from 'next/server';
import {
  SITES,
  COOKIE_MAX_AGE,
  signPass,
  safeEqual,
  safeNext,
  getBaseOrigin,
} from './siteAuth';

/**
 * 子站通用的通行碼登入處理（/api/guide-login 與舊的 /api/<站>-login 共用）。
 * 對的話發一張簽章 cookie 再導回原本要去的頁；錯的話帶 ?e=1 回登入頁。
 * 通行碼只從環境變數讀，不寫進原始碼也不進版控。
 */
export async function handleGuideLogin(request, siteKey) {
  const form = await request.formData();
  const key = siteKey || String(form.get('site') || '');
  const site = Object.hasOwn(SITES, key) ? SITES[key] : null;
  const origin = getBaseOrigin(request);

  if (!site) {
    return NextResponse.redirect(new URL('/contests', origin), 303);
  }

  const next = safeNext(String(form.get('next') || `${site.prefix}/`), site);

  // 公開站不需要登入，直接放行到目的地。
  if (site.isPublic) {
    return NextResponse.redirect(new URL(next, origin), 303);
  }

  const pass = process.env[site.envVar];
  if (!pass) {
    return new NextResponse(`${site.name}尚未設定通行碼，請聯絡管理者。`, {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const input = String(form.get('pass') || '');
  if (!safeEqual(input, pass)) {
    const back = new URL('/guide-login', origin);
    back.searchParams.set('site', site.key);
    back.searchParams.set('next', next);
    back.searchParams.set('e', '1');
    return NextResponse.redirect(back, 303);
  }

  const res = NextResponse.redirect(new URL(next, origin), 303);
  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    origin.startsWith('https:');

  res.cookies.set(site.cookie, await signPass(pass, site), {
    httpOnly: true, // JS 讀不到，降低被竊取的風險
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

/** 舊登入頁網址（/robot-login 等）轉到通用登入頁，保留 next 與錯誤提示。 */
export function legacyLoginTarget(siteKey, sp) {
  const q = new URLSearchParams({ site: siteKey });
  if (typeof sp?.next === 'string') q.set('next', sp.next);
  if (sp?.e === '1') q.set('e', '1');
  return `/guide-login?${q.toString()}`;
}
