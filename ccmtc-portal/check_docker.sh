#!/usr/bin/env bash
#
# 查 NAS 上的容器狀態。2026-08-23 從 expect 改寫為 bash（同 deploy_nas.sh 的理由）。

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_deploy_lib.sh"

ccmtc_connect_check

REMOTE_SCRIPT="
$( (( NEED_SUDO_PASS )) && echo 'sudo -S -v' || echo 'true' )
sudo ${DOCKER_BIN}/docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"
if (( NEED_SUDO_PASS )); then
    printf '%s\n' "$REMOTE_PASS" | ssh "${SSH_OPTS[@]}" "$HOST" "$REMOTE_SCRIPT"
else
    ssh "${SSH_OPTS[@]}" "$HOST" "$REMOTE_SCRIPT" < /dev/null
fi
