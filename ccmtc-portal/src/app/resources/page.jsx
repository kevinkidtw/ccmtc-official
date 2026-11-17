import { prisma } from '@/lib/prisma';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ScrollAnimInit from '../components/ScrollAnimInit';
import ResourceCourseList from '../components/ResourceCourseList';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '課程資源 | 車城自造教育科技中心',
  description: '車城自造教育科技中心課程教學資源下載：簡報、教案、學習單、影片與相關附件。',
};

function groupByCourse(resources) {
  const map = new Map();
  for (const r of resources) {
    if (!map.has(r.courseName)) map.set(r.courseName, []);
    map.get(r.courseName).push(r);
  }
  return [...map.entries()];
}

export default async function ResourcesPage() {
  const resultsUrl = process.env.RESULTS_URL || 'http://localhost:3010';

  let resources = [];
  try {
    resources = await prisma.courseResource.findMany({
      orderBy: [{ courseName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  } catch {
    // DB not ready yet
  }

  const courses = groupByCourse(
    resources.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );

  return (
    <>
      <NavBar resultsUrl={resultsUrl} />

      <main style={{ minHeight: '60vh' }}>
        <section className="section animate-up" style={{ paddingTop: '3.5rem' }}>
          <div className="section-header">
            <div className="section-tag">RESOURCES</div>
            <h2 className="section-title">課程資源</h2>
            <p className="section-desc">
              中心課程的教學簡報、教案、學習單、影片與相關附件，提供教師與學員線上預覽或下載使用
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              目前尚無課程資源，敬請期待。
            </div>
          ) : (
            <ResourceCourseList courses={courses} />
          )}
        </section>

        <div style={{ padding: '2rem 0' }} />
      </main>

      <Footer
        resultsUrl={resultsUrl}
      />

      <ScrollAnimInit />
    </>
  );
}
