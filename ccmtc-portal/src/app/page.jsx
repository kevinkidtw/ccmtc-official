import { getLatestNews, getRecentSiteNews } from '@/lib/newsQuery';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import QuickAccess from './components/QuickAccess';
import AboutSection from './components/AboutSection';
import CoursesSection from './components/CoursesSection';
import NewsStrip from './components/NewsStrip';
import ServiceArea from './components/ServiceArea';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ScrollAnimInit from './components/ScrollAnimInit';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  // 說明站、教材站、資科訓練的入口改由 src/config/sites.mjs 統一管理

  // 卡片＝長期入口；消息＝有日期的事件。首頁只放最新 3 則標題，卡片用 NEW 徽章連到相關消息。
  let latest = { items: [], total: 0 };
  let siteNews = {};
  try {
    [latest, siteNews] = await Promise.all([getLatestNews(3), getRecentSiteNews()]);
  } catch {
    // DB not ready yet, show empty state
  }

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <HeroSection />
      <QuickAccess
        resultsUrl={resultsUrl}
        siteNews={siteNews}
      />

      <NewsStrip items={latest.items} total={latest.total} />

      <div style={{ padding: '4rem 0 0' }} />
      <div className="section-divider" />

      <AboutSection />

      <div className="section-divider" />

      <CoursesSection />

      <div className="section-divider" />

      <ServiceArea />

      <ContactSection />

      <Footer
        resultsUrl={resultsUrl}
      />

      <ScrollAnimInit />
    </>
  );
}
