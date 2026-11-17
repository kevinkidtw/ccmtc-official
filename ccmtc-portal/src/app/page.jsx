import { prisma } from '@/lib/prisma';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import QuickAccess from './components/QuickAccess';
import AboutSection from './components/AboutSection';
import CoursesSection from './components/CoursesSection';
import AnnouncementList from './components/AnnouncementList';
import ServiceArea from './components/ServiceArea';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ScrollAnimInit from './components/ScrollAnimInit';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  // 說明站、教材站、資科訓練的入口改由 src/config/sites.mjs 統一管理

  let announcements = [];
  try {
    const pinned = await prisma.announcement.findMany({
      where: { isPinned: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    const rest = await prisma.announcement.findMany({
      where: { isPinned: false },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });
    announcements = [...pinned, ...rest];
  } catch {
    // DB not ready yet, show empty state
  }

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <HeroSection />
      <QuickAccess
        resultsUrl={resultsUrl}
      />

      <div style={{ padding: '4rem 0 0' }} />
      <div className="section-divider" />

      <AboutSection />

      <div className="section-divider" />

      <CoursesSection />

      <div className="section-divider" />

      <AnnouncementList announcements={announcements} />

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
