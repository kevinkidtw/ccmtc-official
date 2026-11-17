export default function CoursesSection() {
  const courses = [
    {
      icon: '🪵',
      name: '傳統工藝',
      desc: '在地文化工藝技術傳承，結合素材認識與手作體驗，讓學生在創作中認識故鄉。',
    },
    {
      icon: '🖨️',
      name: '數位自造',
      desc: '3D 列印、雷射切割與 CNC 加工，從設計到實作的完整製造流程體驗。',
    },
    {
      icon: '⚡',
      name: '電子電路',
      desc: '基礎電路原理、Arduino 開發板與各式感測器，動手完成電子互動專題。',
    },
    {
      icon: '🤖',
      name: '新興科技',
      desc: '人工智慧、物聯網與無人機操控，引導學生接軌全球科技發展最新趨勢。',
    },
    {
      icon: '💻',
      name: '程式設計',
      desc: '從 Scratch 視覺化積木到 Python 文字程式，系統化的階梯式學習路徑。',
    },
  ];

  return (
    <section id="courses" className="section animate-up" style={{ paddingTop: '3rem' }}>
      <div className="section-header">
        <div className="section-tag">COURSES</div>
        <h2 className="section-title">五大課程類別</h2>
        <p className="section-desc">涵蓋數位製造與傳統工藝，提供多元跨域的科技學習體驗</p>
      </div>

      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.name} className="course-card">
            <div className="course-icon">{course.icon}</div>
            <div className="course-name">{course.name}</div>
            <p className="course-desc">{course.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
