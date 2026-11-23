import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import NewsAdmin from './NewsAdmin';
import { linkableSites } from '@/lib/newsFormat.mjs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '教師發布消息 | 車城自造教育科技中心',
  robots: { index: false, follow: false },
};

export default function NewsAdminPage() {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';
  return (
    <>
      <NavBar resultsUrl={resultsUrl} />
      <main style={{ minHeight: '70vh', padding: '2.5rem 1.25rem 4rem', background: 'var(--bg-color)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <NewsAdmin sites={linkableSites()} />
        </div>
      </main>
      <Footer resultsUrl={resultsUrl} />
    </>
  );
}
