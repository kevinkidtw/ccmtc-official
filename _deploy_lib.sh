#!/usr/bin/env bash
#
# ccmtc 三服務共用的部署函式。由各服務目錄下的 deploy_nas.sh source 進去。
#
# 2026-08-23 建立。原本四支 expect 腳本各自複製同一段流程，且都在裝了 SSH
# 金鑰之後失效 —— scp/ssh 不再出現 "assword"，expect 等不到就往下走，
# 對已關閉的連線再操作，於是 `spawn id expN not open`。檔案上傳成功、
# 容器卻從未重建，而腳本看起來只是「中途報了個怪錯」。
#
# 密碼只在 NAS 的 sudo 這一步可能用到，且只經 stdin 餵給 `sudo -S`，
# 不進本機或 NAS 的指令列（見 00_規範/01_機密資料管理規範.md）。

REMOTE_USER="kevinkid"
# NAS 位址：預設走 Tailscale（對外 22 埠刻意關閉）。在家可改走內網：
#   export NAS_HOST=192.168.68.113
REMOTE_HOST="${NAS_HOST:-100.96.102.35}"
HOST="${REMOTE_USER}@${REMOTE_HOST}"
SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=20)
DOCKER_BIN="/var/packages/ContainerManager/target/usr/bin"
COMPOSE_DIR="/volume1/docker/ccmtc-official"   # 三服務統一在這裡編排

# 密碼只從當次 session 的環境變數取得，不寫入任何檔案。
REMOTE_PASS="${NAS_PASS:-}"
NEED_SUDO_PASS=1

# 連線檢查 + 判斷這次到底需不需要密碼
ccmtc_connect_check() {
    echo
    echo "=== 連線檢查 ==="
    if ! ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$HOST" true 2>/dev/null; then
        echo "❌ 金鑰登入失敗（${HOST}）。"
        echo "   公網 22 埠已關，請確認 Tailscale 已連線，"
        echo "   或改走內網：export NAS_HOST=192.168.68.113"
        return 1
    fi
    echo "✅ 金鑰登入正常"

    # 直接測 docker 本身，而不是 `sudo -n true`：
    # sudoers 若只對 docker/docker-compose 開 NOPASSWD（建議做法），
    # `sudo -n true` 仍會要密碼，用它判斷會誤判成「需要密碼」。
    if ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$HOST" \
         "sudo -n ${DOCKER_BIN}/docker version >/dev/null 2>&1"; then
        NEED_SUDO_PASS=0
        echo "✅ NAS docker 已可免密碼 sudo，本次部署完全不需要密碼"
        return 0
    fi

    NEED_SUDO_PASS=1
    if [[ -z "$REMOTE_PASS" ]]; then
        echo "⚠️  NAS sudo 需要密碼。密碼不寫入任何檔案，只在本次執行期間留在記憶體。"
        read -rsp "   NAS 密碼（輸入不顯示）：" REMOTE_PASS < /dev/tty; echo
        [[ -n "$REMOTE_PASS" ]] || { echo "❌ 未提供密碼，中止。"; return 1; }
    fi
    return 0
}

# ccmtc_pack <輸出 tgz> [額外的 tar --exclude 參數...]
# 一律排除 node_modules/.next/.git/dev.db/data/uploads/.env。
#
# .env 刻意排除：服務端的長期機密只放在目標主機上、由人手動建立，
# 不隨每次部署從本機覆蓋過去（見 CLAUDE.md 與 00_規範/01_機密資料管理規範.md）。
# NAS 上少了它 compose 會直接失敗，所以改由 ccmtc_require_remote_env 事前檢查。
ccmtc_pack() {
    local tgz="$1"; shift
    echo
    echo "=== 打包專案 ==="
    # COPYFILE_DISABLE=1：macOS 的 tar 預設會替每個檔案多打包一個 ._ 資源分支檔，
    # 解到 NAS 上就是成千個垃圾檔（2026-11-18 清掉 3586 個）。
    COPYFILE_DISABLE=1 tar --exclude='node_modules' --exclude='.next' --exclude='.git' \
        --exclude='._*' \
        --exclude='dev.db' --exclude='data' --exclude='uploads' \
        --exclude='.env' --exclude='.env.local' \
        --exclude='.DS_Store' "$@" -czf "$tgz" .
    [[ -s "$tgz" ]] || { echo "❌ 打包失敗"; return 1; }
    echo "✅ 打包完成 -> $tgz ($(du -h "$tgz" | cut -f1))"
}

# ccmtc_require_remote_env <遠端目錄>
# 部署前先確認 NAS 上已有 .env —— 沒有的話 compose 會因 ADMIN_TOKEN 缺值而
# 整個失敗，與其等到重建容器那一刻才炸，不如在上傳前就擋下來。
# 首次建立（只需做一次，之後部署都不會動它）：
#   scp -O <本機>/.env kevinkid@<NAS>:/volume1/docker/ccmtc-official/.env
#   ssh kevinkid@<NAS> 'chmod 600 /volume1/docker/ccmtc-official/.env'
ccmtc_require_remote_env() {
    local dir="$1"
    if ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$HOST" "[ -f '$dir/.env' ]" 2>/dev/null; then
        echo "✅ NAS 上已有 .env"
        return 0
    fi
    echo "❌ NAS 上的 $dir 沒有 .env，compose 會因缺少 ADMIN_TOKEN 而失敗。"
    echo "   首次建立（只需做一次）："
    echo "     scp -O \"\$SCRIPT_DIR/.env\" $HOST:$dir/.env"
    echo "     ssh $HOST 'chmod 600 $dir/.env'"
    return 1
}

# ccmtc_upload <tgz> <遠端目錄>
ccmtc_upload() {
    local tgz="$1" dir="$2"
    echo
    echo "=== 上傳到 NAS ==="
    ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p '$dir'"
    scp -O "${SSH_OPTS[@]}" "$tgz" "$HOST:$dir/"
    echo "✅ 上傳完成"
}

# ccmtc_remote_rebuild <遠端目錄> <tgz 檔名> <compose 服務名> [need_env:yes|no]
ccmtc_remote_rebuild() {
    local dir="$1" tgzname="$2" service="$3" need_env="${4:-yes}"
    echo
    echo "=== 解壓縮並重建容器（${service}）==="

    # 需要密碼時，開頭用一次 `sudo -S -v` 讓 sudo 從 stdin 讀密碼並快取憑證，
    # 後續 sudo 就不必再問。密碼只走 stdin，不進任何指令列。
    local auth_line='true'
    (( NEED_SUDO_PASS )) && auth_line='sudo -S -v'

    local env_check=''
    [[ "$need_env" == "yes" ]] && env_check="[ -f '$COMPOSE_DIR/.env' ] || { echo '❌ NAS 上找不到 .env，compose 會缺 ADMIN_TOKEN'; exit 1; }"

    # ⚠️ 兩個踩過的坑，改動時務必保留：
    #
    # 1. 不可寫成 `sudo env DOCKER_BUILDKIT=0 .../docker-compose`。
    #    那樣 sudo 實際執行的是 `env`，不是 docker-compose，
    #    sudoers 的 NOPASSWD 規則（只列了 docker 與 docker-compose）就配不上，
    #    於是靜靜地回「a password is required」。
    #    docker-compose v1 預設本來就不走 BuildKit，這個 env 是多餘的。
    #
    # 2. `... | tail -20` 會把退出碼換成 tail 的（永遠是 0），set -e 完全失效 ——
    #    上面那個 sudo 失敗就是這樣被吞掉，腳本照樣印出「部署成功」。
    #    改成把輸出寫檔、用 `||` 判斷退出碼 —— 任何 POSIX shell 都成立。
    #    （PIPESTATUS 是 bash 專屬，而 NAS 上 kevinkid 的登入 shell 是 /bin/sh）
    local remote_script="
set -e
cd '$dir'
$auth_line
[ -f '$tgzname' ] || { echo '❌ 找不到剛上傳的壓縮檔'; exit 1; }
tar -xzf '$tgzname'
rm -f '$tgzname'
$env_check
cd '$COMPOSE_DIR'
LOG=/tmp/ccmtc-compose-$service.log
sudo ${DOCKER_BIN}/docker-compose up -d --build $service > \"\$LOG\" 2>&1 || { echo '❌ docker-compose 失敗，最後 30 行：'; tail -30 \"\$LOG\"; rm -f \"\$LOG\"; exit 1; }
tail -20 \"\$LOG\"
rm -f \"\$LOG\"
sudo ${DOCKER_BIN}/docker image prune -f
echo '=== 部署成功 ==='
"
    if (( NEED_SUDO_PASS )); then
        printf '%s\n' "$REMOTE_PASS" | ssh "${SSH_OPTS[@]}" "$HOST" "$remote_script"
    else
        ssh "${SSH_OPTS[@]}" "$HOST" "$remote_script" < /dev/null
    fi
}

# ccmtc_verify <網址> <容器名稱>
# 為什麼要重試：容器剛重建時需要一段時間啟動（如官網還要跑資料庫遷移），立刻打會拿到 502 等錯誤。
# 為什麼要 -L：部分網址（如競賽計分）會回 308 轉址到排行榜，要跟隨轉址確認最終是 200。
# 為什麼失敗一定要 return 1：部署腳本有 set -euo pipefail，如果驗證失敗但不回傳非零退出碼，
# 腳本就會無視失敗繼續跑（2026-10-07 曾發生拿到 502 卻印出 🎉 成功），因此加上 return 1 強制中斷。
ccmtc_verify() {
    local url="${1:-}"
    local container="${2:-}"
    local timeout="${VERIFY_TIMEOUT:-120}"
    local start_time
    start_time="$(date +%s)"
    local count=1
    local code
    local elapsed

    echo
    echo "=== 驗證 ==="

    while true; do
        code="$(curl -sS -L -o /dev/null -w '%{http_code}' --max-time 15 "${url}" || echo 000)"
        elapsed=$(($(date +%s) - start_time))

        if [[ "${code}" == "200" ]]; then
            echo "✅ ${url} -> HTTP 200（第 ${count} 次檢查，約 ${elapsed} 秒）"
            return 0
        fi

        if (( elapsed >= timeout )); then
            break
        fi

        echo "   等待服務啟動…第 ${count} 次：HTTP ${code}"
        sleep 5
        count=$((count + 1))
    done

    echo "❌ 驗證失敗：${url} 在 ${timeout} 秒內沒有回 200（最後一次：HTTP ${code}）"

    if [[ -n "${container}" ]]; then
        echo "--- ${container} 最後 30 行記錄 ---"
        if [[ "${NEED_SUDO_PASS:-0}" == "1" ]]; then
            echo "需要 sudo 密碼，請手動執行：sudo docker logs --tail 30 ${container}"
        else
            ssh "${SSH_OPTS[@]}" "$HOST" "sudo -n ${DOCKER_BIN}/docker logs --tail 30 ${container} 2>&1"
        fi
    fi

    return 1
}
