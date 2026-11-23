/**
 * 官網子站清單 —— 所有競賽說明站、教材站的唯一設定來源。
 *
 * 這份清單同時餵給：
 *   - next.config.mjs        產生 rewrite（路徑 → 哪個容器）
 *   - src/middleware.js      通行碼驗證、結尾斜線導正
 *   - /guide-login、/api/guide-login   通用通行碼登入
 *   - /contests              競賽專區列表
 *   - 首頁 QuickAccess        快速入口卡片
 *
 * 新增一個說明站只要：
 *   1. 把靜態檔放到 ccmtc-guides/site/<key>/
 *   2. 在下面加一筆（upstream: 'guides'）
 *   3. 需要通行碼的話，在 NAS 的 ccmtc-official/.env 補上 auth.envVar
 *
 * 欄位說明：
 *   key        站台代號，也是 ccmtc-guides 底下的資料夾名稱
 *   prefix     官網上的路徑（不含結尾斜線）
 *   title      完整站名；short 是卡片／導覽用短名
 *   role       'host' 中心辦理（主辦／承辦）的競賽 | 'team' 中心隊伍參賽用的培訓與程式說明
 *   hostType   role 為 host 時：'主辦' | '承辦'（卡片徽章顯示「中心主辦／中心承辦」）
 *   category   'competition'（競賽）| 'material'（教材）| 'training'（訓練）
 *   year       學年度或賽事年度標籤，競賽專區依此分組（字串）
 *   status     'active' 進行中 | 'archived' 已封存（只出現在競賽專區的「歷屆」區）
 *   featured   true 才會出現在首頁快速入口
 *   upstream   'guides'（共用靜態容器 ccmtc-guides）
 *              | { service, port, envVar, devPort }（舊的獨立容器，逐步遷入 guides）
 *              | { href }（外部或其他路由處理的網址，官網只放連結）
 *   auth       null 表示公開（目前全部公開）；否則 { envVar, cookie, signMessage }，由官網 middleware 驗證
 *   access     'register' 表示由站台自己要求註冊登入（官網只負責標示）
 *              —— cookie 名稱與 signMessage 一經上線就不要改，否則使用者手上的 cookie 會全部失效。
 *   kicker     登入頁上方的小字（單位 · 賽事）
 */
export const SITES = [
  {
    key: 'drone',
    // 中心雖列承辦單位之一，但非主要角色；此站性質是公版程式說明。
    role: 'team',
    prefix: '/drone',
    title: '屏東縣無人機競賽 公版程式說明站',
    short: '無人機說明站',
    icon: '🛸',
    category: 'competition',
    year: '115',
    status: 'active',
    featured: true,
    desc: '115 學年度屏東縣無人機競賽：Gigo Drone 程控任務賽公版程式、互動飛行模擬器、可調參數速查與上場前檢查清單，附程式與簡章下載。',
    upstream: 'guides',
    auth: null,
    kicker: '車城自造教育科技中心 · 115 學年度屏東縣無人機競賽',
  },
  {
    key: 'drone-awards',
    // 屏南地區得獎榮譽榜；中心列承辦單位之一，名單由中心彙整屏南學校成績。
    role: 'host',
    hostType: '承辦',
    prefix: '/drone-awards',
    title: '2026 屏東縣無人機競賽 屏南地區得獎榮譽榜',
    short: '無人機競賽榮譽榜',
    icon: '🏆',
    category: 'competition',
    year: '115',
    status: 'active',
    featured: true,
    desc: '115.11.20–21 南州國中：屏南 7 校 79 項次獲獎（金 2、銀 1、銅 3）。足球、穿環、程控、虛擬飛行四項賽事完整名單，可依學校與組別篩選，附海報下載。',
    upstream: 'guides',
    auth: null,
  },
  {
    key: 'robot',
    role: 'team',
    prefix: '/robot',
    title: '智創機器人程式說明站',
    short: '機器人說明站',
    icon: '🦾',
    category: 'competition',
    year: '115',
    status: 'active',
    featured: true,
    desc: '2026 全國 AI 智創機器人競賽：發射與夾爪含全國賽自動化，賽前清單、搖桿配對、P1～P7 調參、狀態機與程式下載。',
    upstream: 'guides', // 2026-11-23 由獨立容器併入 ccmtc-guides
    // 2026-11 起公開。若要恢復通行碼：{ envVar: 'ROBOT_PASS', cookie: 'robot_pass', signMessage: 'robot-guide-v1' }
    auth: null,
    kicker: '車城自造教育科技中心 · 2026 全國 AI 智創機器人競賽',
  },
  {
    key: 'r4m',
    role: 'team',
    prefix: '/r4m',
    title: '機關王 R4M 程式說明站',
    short: '機關王說明站',
    icon: '🚜',
    category: 'competition',
    year: '115',
    status: 'active',
    featured: true,
    desc: '2027 世界機關王 R4M 基礎組：A／B 車 KSB 搖桿與手機 V7RC 遙控、配對步驟，C 車循跡取料與參數校正。',
    upstream: 'guides', // 2026-11-23 由獨立容器併入 ccmtc-guides
    // 2026-11 起公開。若要恢復通行碼：{ envVar: 'R4M_PASS', cookie: 'r4m_pass', signMessage: 'r4m-guide-v1' }
    auth: null,
    kicker: '車城自造教育科技中心 · 2027 世界機關王 R4M 基礎組',
  },
  {
    key: 'squid',
    role: 'team',
    prefix: '/squid',
    title: '魷來魷去 AI 教材站',
    short: 'AI 教材站',
    icon: '🦑',
    category: 'material',
    year: '115',
    status: 'active',
    featured: true,
    desc: '115 年度總統盃 AI 素養爭霸賽教材。約 2100 場離線實測，從觀念到實作的完整教學資源。',
    upstream: 'guides', // 2026-11-23 由獨立容器併入 ccmtc-guides
    // 2026-11 起公開。若要恢復通行碼：{ envVar: 'SQUID_PASS', cookie: 'squid_pass', signMessage: 'squid-portal-v1' }
    auth: null,
    kicker: '車城國中 · 115 年度總統盃 AI 素養爭霸賽',
  },
  {
    key: 'competition',
    role: 'host',
    hostType: '主辦',
    prefix: '/competition',
    title: '2026 屏東縣屏南區國中小 STEAM AI 智創機器人競賽',
    short: '屏南區智創機器人競賽',
    icon: '🏆',
    category: 'competition',
    year: '114',
    status: 'archived',
    featured: false,
    desc: '屏南地區 118 隊參賽：恆春半島認知大作戰、洋蔥分類大作戰、智創機器人奪標攻防賽。保留競賽簡章、報名隊伍、抽籤順序與最終成績。',
    // 2026-11 封存：原 ccmtc-competition（Next.js + SQLite）下線，改為 ccmtc-guides 內的凍結鏡像。
    upstream: 'guides',
    auth: null,
  },
  {
    key: 'training',
    role: 'team',
    prefix: '/資科競賽訓練',
    title: '資科競賽訓練',
    short: '資科訓練',
    icon: '🧩',
    category: 'training',
    year: '115',
    status: 'active',
    featured: true,
    desc: '國中小程式解題訓練。從零開始的學習地圖（48 題入門題）一路銜接 114 學年 102 題競賽題庫，Blockly／Scratch 雙平台，每題附參考解答。',
    // 由 ccmtc-router 在官網外層分流，官網只放連結、不經過 middleware。
    upstream: { href: '/資科競賽訓練/' },
    auth: null,
    // 題目授權僅限教育用途，由 ccmtc-router 要求註冊帳號（或通行碼）登入，官網不經手。
    access: 'register',
  },
];

export const SITE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

const CATEGORY_LABEL = {
  competition: '競賽說明',
  material: '教材',
  training: '訓練',
};

export const ROLES = [
  {
    key: 'host',
    title: '中心辦理的競賽',
    tag: 'HOSTED',
    desc: '由車城自造教育科技中心主辦或承辦的競賽：簡章、公版程式、報名名單與成績',
  },
  {
    key: 'team',
    title: '參賽培訓與程式說明',
    tag: 'TRAINING',
    desc: '中心指導隊伍參加各項競賽時使用的程式說明、調參指南、教材與解題訓練',
  },
];

/** 依角色分區，每區再依年度分組；沒有站的區塊不回傳。 */
export function groupByRole(list = SITES) {
  return ROLES
    .map(role => [role, groupByYear(list.filter(s => s.role === role.key))])
    .filter(([, groups]) => groups.length > 0);
}

export function categoryLabel(c) {
  return CATEGORY_LABEL[c] || c;
}

/** 卡片上的分類徽章：中心辦理的賽事標「中心主辦／承辦」，其餘標類別。 */
export function badgeLabel(site) {
  if (site.role === 'host' && site.hostType) return `中心${site.hostType}`;
  return categoryLabel(site.category);
}

/** 由官網 middleware 管的站（有 prefix、走 rewrite 的），排除只放連結的外部站。 */
export function proxiedSites(list = SITES) {
  return list.filter(s => typeof s.upstream === 'string' || (s.upstream && s.upstream.service));
}

export function getSite(key, list = SITES) {
  if (typeof key !== 'string' || !SITE_KEY_RE.test(key)) return null;
  return list.find(s => s.key === key) || null;
}

/** 站台在官網上的入口網址（一律帶結尾斜線，站內相對連結才不會指錯）。 */
export function siteHref(site) {
  if (site.upstream && typeof site.upstream === 'object' && site.upstream.href) {
    return site.upstream.href;
  }
  return `${site.prefix}/`;
}

/** 進站限制的標示文字：'需通行碼' | '需註冊' | null（公開）。 */
export function accessLabel(site) {
  if (site.auth) return '需通行碼';
  if (site.access === 'register') return '需註冊';
  return null;
}

export function needsPass(site) {
  return accessLabel(site) !== null;
}

/**
 * 產生 Next rewrites。guidesUrl 是共用靜態容器的位址；
 * 舊獨立容器保留原本的環境變數覆寫（SQUID_PROXY_URL 等），行為和改版前相同。
 */
export function buildRewrites({ guidesUrl, isDev, env = {} }, list = SITES) {
  return proxiedSites(list).flatMap(site => {
    if (site.upstream === 'guides') {
      const base = `${guidesUrl}/${site.key}`;
      // 站首頁要明確對到「資料夾/」：`:path*` 為空時 Next 會產生 /<key>（少了斜線），
      // 靜態伺服器回 301 補斜線，瀏覽器又回到同一個網址，形成無限導向。
      return [
        { source: `${site.prefix}/`, destination: `${base}/` },
        { source: `${site.prefix}/:path+`, destination: `${base}/:path+` },
      ];
    }
    const u = site.upstream;
    const base = env[u.envVar] || (isDev ? `http://127.0.0.1:${u.devPort}` : `http://${u.service}:${u.port}`);
    return [{ source: `${site.prefix}/:path*`, destination: `${base}/:path*` }];
  });
}

/** 競賽專區用：依 year 由新到舊分組；同組內進行中在前。 */
export function groupByYear(list = SITES) {
  const map = new Map();
  for (const s of list) {
    if (!map.has(s.year)) map.set(s.year, []);
    map.get(s.year).push(s);
  }
  const rank = s => (s.status === 'archived' ? 1 : 0);
  return [...map.entries()]
    .sort((a, b) => String(b[0]).localeCompare(String(a[0]), 'zh-Hant', { numeric: true }))
    .map(([year, sites]) => [year, [...sites].sort((a, b) => rank(a) - rank(b))]);
}
