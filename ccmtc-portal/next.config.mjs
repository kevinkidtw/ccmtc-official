import { buildRewrites } from './src/config/sites.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 子站掛在 /squid/、/drone/ 等路徑底下，站內用的是相對連結，網址結尾那條斜線不能少。
  // Next 預設會把 /squid/ 正規化成 /squid（308），和 middleware 自己補斜線的
  // 導向互相打架成無限迴圈，所以關掉自動正規化、改由 middleware 處理。
  // 官網其他路徑本來就沒有結尾斜線，不受影響。
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async rewrites() {
    const resultsUrl = process.env.RESULTS_PROXY_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3010' : 'http://results:3010');
    // 競賽說明站與教材站：路徑對應統一由 src/config/sites.mjs 產生。
    // 新站一律放進共用靜態容器 guides（ccmtc-guides），舊站沿用各自容器直到遷移完成。
    const isDev = process.env.NODE_ENV === 'development';
    const guidesUrl = process.env.GUIDES_PROXY_URL || (isDev ? 'http://127.0.0.1:3100' : 'http://guides:80');
    return [
      ...buildRewrites({ guidesUrl, isDev, env: process.env }),
      {
        source: '/api/images/:path*',
        destination: `${resultsUrl}/results/api/images/:path*`,
      },
      {
        source: '/results/:path*',
        destination: `${resultsUrl}/results/:path*`,
      },
    ];
  },
};

export default nextConfig;
