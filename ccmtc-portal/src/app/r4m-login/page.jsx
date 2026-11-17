import { redirect } from 'next/navigation';
import { legacyLoginTarget } from '@/lib/guideLogin';

// 舊網址保留：一律轉到通用登入頁 /guide-login。
export const dynamic = 'force-dynamic';

export default async function LegacyLogin({ searchParams }) {
  redirect(legacyLoginTarget('r4m', await searchParams));
}
