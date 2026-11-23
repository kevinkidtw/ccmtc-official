const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : '/app/data/dev.db';

console.log(`[migrate] Connecting to database at ${dbPath}...`);
const db = new Database(dbPath);

const addColumn = (table, column, definition) => {
  try {
    db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get();
  } catch (e) {
    if (e.message.includes('no such column')) {
      console.log(`[migrate] Adding column ${column} to ${table}...`);
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    }
  }
};

try {
  console.log('[migrate] Creating Announcement table if not exists...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT '一般公告',
      "isPinned" INTEGER NOT NULL DEFAULT 0,
      "fileUrl" TEXT,
      "fileName" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  addColumn('Announcement', 'category', "TEXT NOT NULL DEFAULT '一般公告'");
  addColumn('Announcement', 'fileUrl', "TEXT");
  addColumn('Announcement', 'fileName', "TEXT");

  // 2026-11-23 最新消息後台（教師發文與審核）。既有公告視為管理者發的 HTML、已發布。
  addColumn('Announcement', 'status', "TEXT NOT NULL DEFAULT 'published'");
  addColumn('Announcement', 'contentFormat', "TEXT NOT NULL DEFAULT 'html'");
  addColumn('Announcement', 'siteKey', "TEXT");
  addColumn('Announcement', 'authorId', "TEXT");
  addColumn('Announcement', 'authorName', "TEXT");
  addColumn('Announcement', 'reviewNote', "TEXT");
  addColumn('Announcement', 'publishedAt', "DATETIME");
  db.prepare(`UPDATE "Announcement" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL AND "status" = 'published'`).run();

  console.log('[migrate] Creating Teacher table if not exists...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS "Teacher" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "school" TEXT,
      "passwordHash" TEXT NOT NULL,
      "canPublish" INTEGER NOT NULL DEFAULT 0,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "lastLoginAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log('[migrate] Creating Counter table if not exists...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS "Counter" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "site" TEXT NOT NULL UNIQUE,
      "count" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log('[migrate] Creating CourseResource table if not exists...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS "CourseResource" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "courseName" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT '附件',
      "fileUrl" TEXT,
      "fileName" TEXT,
      "externalUrl" TEXT,
      "note" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log('[migrate] Removing retired seed course resources...');
  db.prepare(`DELETE FROM "CourseResource" WHERE "id" = ?`).run('seed-rockbot-plan');

  console.log('[migrate] Seeding built-in course resources...');
  const seedResource = db.prepare(`
    INSERT OR IGNORE INTO "CourseResource"
      ("id", "courseName", "title", "type", "fileUrl", "fileName", "sortOrder")
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  seedResource.run(
    'seed-rockbot-slides',
    '洛克霸出任務！麥克納姆輪全向移動挑戰',
    '教學簡報（PBL 四節課）',
    '簡報',
    '/course-files/rockbot-slides.pptx',
    '洛克霸教學簡報.pptx',
    1
  );
  seedResource.run(
    'seed-rockbot-worksheet',
    '洛克霸出任務！麥克納姆輪全向移動挑戰',
    '學習單',
    '學習單',
    '/course-files/rockbot-worksheet.docx',
    '洛克霸學習單.docx',
    2
  );

  const seedLink = db.prepare(`
    INSERT OR IGNORE INTO "CourseResource"
      ("id", "courseName", "title", "type", "externalUrl", "note", "sortOrder")
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  seedLink.run(
    'seed-rockbot-makecode',
    '洛克霸出任務！麥克納姆輪全向移動挑戰',
    'MakeCode 線上程式編輯器',
    '連結',
    'https://makecode.microbit.org',
    '開啟後新增專案，於「擴充」加入 RockBot 積木',
    3
  );
  seedLink.run(
    'seed-rockbot-extension',
    '洛克霸出任務！麥克納姆輪全向移動挑戰',
    'RockBot MakeCode 擴充套件',
    '連結',
    'https://github.com/iCShopMgr/RockBot_for_MakeCode',
    '於 MakeCode「擴充」搜尋框貼上此網址即可加入 RockBot',
    4
  );

  console.log('[migrate] Migration complete.');
} catch (err) {
  console.error('[migrate] Critical migration error:', err);
} finally {
  db.close();
}
