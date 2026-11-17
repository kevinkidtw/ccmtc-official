import { handleGuideLogin } from '@/lib/guideLogin';

/** 所有子站共用的通行碼登入；站台由表單的 site 欄位決定（見 src/config/sites.mjs）。 */
export async function POST(request) {
  return handleGuideLogin(request);
}
