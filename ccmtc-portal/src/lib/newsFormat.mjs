/**
 * 最新消息：內文轉換、輸入驗證、附件白名單（純函式，前後端與測試共用）。
 *
 * 內文格式（Announcement.contentFormat）：
 *   'html' 管理者在 /admin-center 發的公告（沿用舊行為，可貼 HTML，例如榮譽榜公告）
 *   'text' 教師在 /news-admin 發的消息：一律跳脫 HTML，只把網址轉成連結、保留換行。
 *          教師帳號多、不是每個人都懂 HTML，開放原始 HTML 等於開放任何人在官網插入腳本。
 */
import { SITES, getSite } from '../config/sites.mjs';

export const NEWS_CATEGORIES = ['一般公告', '課程消息', '競賽資訊', '活動公告'];
export const STATUS = { PUBLISHED: 'published', PENDING: 'pending', REJECTED: 'rejected' };
export const STATUS_LABEL = { published: '已發布', pending: '待審核', rejected: '退回' };
export const PAGE_SIZE = 15;

export const LIMITS = { title: 120, content: 20000, reviewNote: 500 };
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// 教師可上傳的附件。刻意不含 .svg / .html（瀏覽器會當網頁執行）。
export const TEACHER_UPLOAD_EXT = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip',
];

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 在「已跳脫」的字串上比對，所以要在 &quot; &#39; &lt; &gt; 前停下，引號裡的網址才不會把結尾引號吃進去。
const URL_RE = /\bhttps?:\/\/(?:(?!&quot;|&#39;|&lt;|&gt;)[^\s<>"'）)」』，。、])+/g;

/** 純文字 → 安全 HTML：先整段跳脫，再把 http(s) 網址轉成連結。換行由 CSS pre-wrap 保留。 */
export function renderPlainText(text) {
  return escapeHtml(text).replace(URL_RE, url => {
    // url 已經跳脫過，可以直接放進屬性
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

/** 依 contentFormat 產生要放進頁面的 HTML。 */
export function renderContent(item) {
  if (!item) return '';
  return item.contentFormat === 'text' ? renderPlainText(item.content) : String(item.content ?? '');
}

/** 列表摘要：去掉 HTML 標籤與多餘空白後截斷。 */
export function excerpt(item, max = 90) {
  const raw = item?.contentFormat === 'text'
    ? String(item.content ?? '')
    : String(item?.content ?? '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const flat = raw.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

/** 公開頁顯示的日期：發布時間優先，舊資料退回建立時間。 */
export function displayDate(item) {
  return item?.publishedAt || item?.createdAt;
}

/** 可以綁定的站台（有自己網址的說明站、榮譽榜等）。 */
export function linkableSites(list = SITES) {
  return list.map(s => ({ key: s.key, title: s.title, short: s.short, icon: s.icon }));
}

export function isAllowedUpload(filename, size) {
  const m = /\.[a-z0-9]+$/i.exec(String(filename || ''));
  const ext = m ? m[0].toLowerCase() : '';
  if (!TEACHER_UPLOAD_EXT.includes(ext)) {
    return { ok: false, error: `不支援的檔案類型（可上傳：${TEACHER_UPLOAD_EXT.join(' ')}）` };
  }
  if (!(size > 0)) return { ok: false, error: '檔案是空的' };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: `檔案超過 ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
  return { ok: true, ext };
}

/** 只接受本站 /api/uploads/ 底下的附件網址，避免被填入外部或 javascript: 連結。 */
export function isUploadUrl(url) {
  return typeof url === 'string' && /^\/api\/uploads\/[A-Za-z0-9._-]+$/.test(url) && !url.includes('..');
}

/**
 * 驗證教師送出的消息。回傳 { ok, data } 或 { ok: false, error }。
 * data 只含教師可以改的欄位；置頂、狀態、作者由伺服器決定。
 */
export function validatePost(body) {
  const title = String(body?.title ?? '').trim();
  const content = String(body?.content ?? '').replace(/\r\n/g, '\n').trim();
  const category = String(body?.category ?? '一般公告');
  const siteKey = body?.siteKey ? String(body.siteKey) : null;
  const fileUrl = body?.fileUrl ? String(body.fileUrl) : null;
  const fileName = body?.fileName ? String(body.fileName).slice(0, 200) : null;

  if (!title) return { ok: false, error: '標題為必填' };
  if (!content) return { ok: false, error: '內容為必填' };
  if (title.length > LIMITS.title) return { ok: false, error: `標題最多 ${LIMITS.title} 字` };
  if (content.length > LIMITS.content) return { ok: false, error: `內容最多 ${LIMITS.content} 字` };
  if (!NEWS_CATEGORIES.includes(category)) return { ok: false, error: '分類不正確' };
  if (siteKey && !getSite(siteKey)) return { ok: false, error: '相關網站不存在' };
  if (fileUrl && !isUploadUrl(fileUrl)) return { ok: false, error: '附件網址不正確' };

  return {
    ok: true,
    data: { title, content, category, siteKey, fileUrl, fileName: fileUrl ? fileName : null },
  };
}
