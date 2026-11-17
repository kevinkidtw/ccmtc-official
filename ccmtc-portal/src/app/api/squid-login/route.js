import { handleGuideLogin } from '@/lib/guideLogin';

/** 舊登入端點，保留給已開著的舊登入頁；邏輯與 /api/guide-login 相同。 */
export async function POST(request) {
  return handleGuideLogin(request, 'squid');
}
