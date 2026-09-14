#!/usr/bin/env bash
set -Eeuo pipefail

# Meter_intro Linode 後台手動部署腳本
#
# 用途：
#   在 Linode VPS 上用一行指令完成後台更新。
#
# 預設執行方式：
#   cd /var/www/meter-intro-api
#   ./deploy.sh
#
# 可覆寫環境變數：
#   APP_DIR=/var/www/meter-intro-api
#   APP_NAME=meter-intro-api
#   BRANCH=master
#   PORT=3001
#   HEALTH_URL=http://127.0.0.1:3001/api/health
#   HEALTH_RETRY_COUNT=15
#   HEALTH_RETRY_DELAY=2

APP_DIR="${APP_DIR:-/var/www/meter-intro-api}"
APP_NAME="${APP_NAME:-meter-intro-api}"
BRANCH="${BRANCH:-master}"
PORT="${PORT:-3001}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${PORT}/api/health}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"
# PM2 重啟後 Next.js 需要短暫時間載入 production server；重試可避免服務正常
# 啟動時，腳本卻因第一次 health check 太早執行而誤判部署失敗。
HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT:-15}"
HEALTH_RETRY_DELAY="${HEALTH_RETRY_DELAY:-2}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少必要指令：$1" >&2
    exit 1
  fi
}

log "檢查必要工具"
require_command git
require_command npm
require_command pm2
require_command curl

if [ ! -d "$APP_DIR/.git" ]; then
  echo "找不到 Git 專案目錄：$APP_DIR" >&2
  echo "請先確認 meter_intro 已 clone 到 Linode：/var/www/meter-intro-api" >&2
  exit 1
fi

cd "$APP_DIR"

log "目前部署目錄：$APP_DIR"
log "目標 branch：$BRANCH"

if [ ! -f "$ENV_FILE" ]; then
  echo "找不到環境變數檔：$ENV_FILE" >&2
  echo "請先建立 .env.production.local，避免後台缺少正式設定。" >&2
  exit 1
fi

log "拉取 GitHub 最新程式碼"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "安裝 Node.js 依賴"
npm ci

log "建立 Next.js production build"
npm run build

log "確認 analytics 資料資料夾存在"
mkdir -p /var/lib/meter-intro

log "啟動或重啟 PM2 app：$APP_NAME"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT"
fi

log "保存 PM2 process list"
pm2 save

log "等待後台啟動並執行 health check：$HEALTH_URL"
attempt=1
while [ "$attempt" -le "$HEALTH_RETRY_COUNT" ]; do
  if curl -fsS "$HEALTH_URL"; then
    printf '\n'
    log "health check 成功（第 ${attempt} 次）"
    break
  fi

  if [ "$attempt" -eq "$HEALTH_RETRY_COUNT" ]; then
    echo "health check 在 ${HEALTH_RETRY_COUNT} 次嘗試後仍失敗：$HEALTH_URL" >&2
    exit 1
  fi

  log "後台尚在啟動，${HEALTH_RETRY_DELAY} 秒後重試（${attempt}/${HEALTH_RETRY_COUNT}）"
  sleep "$HEALTH_RETRY_DELAY"
  attempt=$((attempt + 1))
done

log "部署完成"
