/**
 * 保留為轉出口（re-export），相容既有 import '@/lib/squidAuth' 的檔案。
 * 實際邏輯已一般化至 src/lib/siteAuth.js。
 */
export {
  SITES,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  getSiteByPath,
  signPass,
  safeEqual,
  safeNext,
  getBaseOrigin,
  isInternalHost,
} from './siteAuth.js';
