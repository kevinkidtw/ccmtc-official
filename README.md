# CCMTC 競賽與成果發佈系統 - 部署與架構說明書

本專案為 CCMTC 旗下三大核心服務的整合專案，採用 Docker 容器化技術進行多容器編排（Docker Compose）部署。

為了方便維護，本文件詳細記錄了**本地目錄、遠端 NAS 目錄、容器名稱與功能之間的完美對等關係**。我們已成功於 2026 年 5 月完成了命名架構重構，消除了所有中文目錄與歷史命名混淆。

---

## 🏗️ 系統架構拓撲圖 (Mermaid)

```mermaid
graph TD
    subgraph 外網存取通道 (Port 443)
        DNS[ccmtc.mooo.com] --> NGINX[Nginx 反向代理]
    end

    subgraph NAS 大專案：ccmtc-official (Docker Compose 編排)
        NGINX -->|/| Portal[ccmtc-portal <br> 埠: 3040]
        NGINX -->|/results| Results[ccmtc-results <br> 埠: 3010]
        NGINX -->|/competition| Competition[ccmtc-competition <br> 埠: 3020]
    end
    
    style DNS fill:#f9f,stroke:#333,stroke-width:2px
    style NGINX fill:#bbf,stroke:#333,stroke-width:2px
    style Results fill:#f96,stroke:#333,stroke-width:2px
    style Competition fill:#f96,stroke:#333,stroke-width:2px
    style Portal fill:#f96,stroke:#333,stroke-width:2px
```

---

## 📊 專案目錄與 Docker 容器對照表 (方案 B 重構後)

我們已將「本地資料夾」、「遠端 NAS 實體目錄」、「Docker 容器名稱」與「Compose 服務名稱」實現了 **100% 統一與一致**：

| 服務項目 | 本地資料夾名稱 | 遠端 NAS 實體目錄 | 遠端 Docker 容器名稱 | Compose 服務名稱 | 內部對照埠 | 外網映射 URL | 備註說明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **主站入口** | `ccmtc-portal` | `/volume1/docker/ccmtc-official` (大專案根目錄) | `ccmtc-portal` | `portal` | `3040` | `https://ccmtc.mooo.com` | 主站門戶與公告管理後台（含 PDF 附件上傳） |
| **成果發佈中心** | `ccmtc-results` | `/volume1/docker/ccmtc-results` | `ccmtc-results` | `results` | `3010` | `https://ccmtc.mooo.com/results` | 教學簡介範本（自動折行 UI）與成果展示後台 |
| **競賽管理系統** | `ccmtc-competition` | `/volume1/docker/ccmtc-competition` | `ccmtc-competition` | `competition` | `3020` | `https://ccmtc.mooo.com/competition` | 隊伍報名、同校迴避抽籤排序與裁判計分後台 |

> 💡 **重要防護說明**：
> * 所有專案的持久化 SQLite 資料庫 (`dev.db`) 及上傳的 PDF 檔案、照片，皆分別安全存放於各自目錄下的 `data/` 與 `uploads/` 卷冊目錄。
> * **安全備份留存**：我們已在 NAS 的 `/volume1/docker/ccmtc-backups-safety` 目錄下建立並保存了完整的遷移前資料備份，以策安全。

---

## 🚀 常用維護與部署指令

所有的容器編排均由 `/volume1/docker/ccmtc-official` 底下的 `docker-compose.yml` 統一管控。

### 1. 檢視全站容器運行狀態
```bash
cd /volume1/docker/ccmtc-official
sudo docker-compose ps
```

### 2. 限制與查看日誌 (Log Rotation)
我們已為全站三大容器套用了 **10MB (最多 3 份)** 的日誌輪轉限制，防止 NAS 硬碟爆滿。
```bash
# 查看主站日誌
sudo docker-compose logs -f portal

# 查看成果中心日誌
sudo docker-compose logs -f results

# 查看競賽系統日誌
sudo docker-compose logs -f competition
```

### 3. 課程資源功能（2026/07 新增）

主站新增「課程資源」頁面（`https://ccmtc.mooo.com/resources`），提供課程簡報、教案、學習單、影片等資源下載：

* **前台頁面**：`/resources`，依課程名稱分組顯示，導覽列與頁尾皆有入口。
* **後台管理**：`/admin-center/<ADMIN_TOKEN>` 頁面下方新增「課程資源管理」區塊，可上傳檔案（存於 `uploads/` 卷冊）或填寫外部連結（如 YouTube），同課程名稱的資源會自動歸組。
* **資料表**：SQLite 新增 `CourseResource` 表，由 `migrate.js` 於容器啟動時自動建表並植入「洛克霸」課程的簡報與教案種子資料。
* **內建檔案**：洛克霸簡報與教案隨映像檔佈署於 `ccmtc-portal/public/course-files/`，重建容器不會遺失。

### 4. 本地手動一鍵部署
各子專案目錄下皆備有 `./deploy_nas.sh` 自動化打包腳本，每次執行時會**自動打包、上傳、並在 NAS 大專案下精確 Rebuild 對應容器**，並於成功後**自動執行 `docker image prune -f` 清理懸空映像檔**。

### 5. 說明站統一架構與競賽專區（2026/11 新增）

競賽說明站、教材站改由**一份站台清單**統一管理：`ccmtc-portal/src/config/sites.mjs`。
導覽列、首頁快速入口、`/contests` 競賽專區、rewrite、middleware 通行碼驗證、登入頁全部從這份清單產生。

* **競賽專區**：`/contests`，依學年度列出所有說明站，標示公開／需通行碼／已封存。導覽列原本的「AI 教材站／機器人說明站／機關王說明站／資科訓練」四個連結合併為「競賽專區」。
* **通用登入頁**：`/guide-login?site=<key>`、`/api/guide-login`。舊網址 `/robot-login`、`/r4m-login`、`/squid-login` 自動轉過去，舊 API 端點保留；cookie 名稱與簽章訊息不變，使用者不必重新登入。
* **共用靜態容器**：新站一律放進 `ccmtc-guides`（compose 服務名 `guides`），詳見 `../ccmtc-guides/README.md`。第一個是 `/drone/`（115 學年度屏東縣無人機競賽，公開）。
* **單元測試**：`cd ccmtc-portal && npm test`（站台清單一致性、rewrite、前綴邊界、開放重導防護、簽章相容性）。
* **封存賽事**：清單中 `status: 'archived'`，網址保留、首頁撤卡、競賽專區標示「已封存」。

* **全部說明站公開（2026-11）**：無人機、機器人、機關王、魷來魷去 AI 教材站不再要求通行碼（`sites.mjs` 中 `auth: null`）。資科競賽訓練維持由 `ccmtc-router` 的註冊／登入保護（題目授權僅限教育用途），競賽專區標示「需註冊」。NAS `.env` 與 compose 裡的 `ROBOT_PASS`／`R4M_PASS`／`SQUID_PASS` 已不再使用，可保留或由管理者自行移除。

* **屏南區智創機器人競賽封存（2026-11-18）**：`ccmtc-competition` 容器已下線並移出 compose，`/competition/` 改由 `guides` 容器內的凍結鏡像提供（唯讀，網址不變，選手姓名遮蔽）。首頁的「競賽即時計分」「競賽資訊入口」卡片撤下，Hero 按鈕與頁尾改連競賽專區，競賽專區 114 學年度標示「已封存」。程式與資料庫保留在 NAS 的 `ccmtc-competition/`，備份在 `ccmtc-backups-safety/`。詳見 `../ccmtc-guides/README.md`「封存鏡像」。
* **競賽專區分區（2026-11-18）**：`sites.mjs` 每站加上 `role`。`host`＝中心辦理的競賽（主辦或承辦，`hostType` 決定徽章「中心主辦／中心承辦」），`team`＝中心隊伍參賽用的培訓與程式說明。`/contests` 依此分成兩區，各區再依學年度分組。目前中心辦理：屏南區智創機器人競賽（主辦，已封存）；參賽培訓與程式說明：無人機（中心雖列承辦單位之一，但非主要角色）、智創機器人、機關王 R4M、魷來魷去、資科競賽訓練。新增站台時務必填 `role`（單元測試會檢查）。
