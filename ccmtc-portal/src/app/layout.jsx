import './globals.css';

const siteUrl = process.env.SITE_URL || 'http://localhost:3040';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: '車城自造教育科技中心 CCMTC',
  description: '屏東縣立車城國民中學自造教育及科技中心，服務屏南六鄉鎮24所學校，推動自造教育、科技課程與智創機器人競賽。',
  openGraph: {
    siteName: '車城自造教育科技中心 CCMTC',
    locale: 'zh_TW',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
      </body>
    </html>
  );
}
