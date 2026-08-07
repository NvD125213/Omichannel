#!/bin/bash
set -euo pipefail

APP_NAME="${PM2_APP_NAME:-omichannel}"

echo "=========================================="
echo " Omichannel deploy"
echo "=========================================="

echo ""
echo "[1/4] npm i"
npm i

echo ""
echo "[2/4] npm audit fix"
# Không fail deploy nếu audit không thể fix hết
npm audit fix || echo "[warn] npm audit fix có lỗi / warning — tiếp tục build"

echo ""
echo "[3/4] npm run build"
npm run build

echo ""
echo "[4/4] PM2 reload / start (${APP_NAME})"
# Có process rồi → zero-downtime reload; chưa có → start lần đầu
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  echo "→ pm2 reload ${APP_NAME}"
  pm2 reload ecosystem.config.cjs --only "${APP_NAME}" --update-env
else
  echo "→ pm2 start (lần đầu)"
  pm2 start ecosystem.config.cjs --only "${APP_NAME}"
fi

pm2 save || true
pm2 status

echo ""
echo "Container giữ sống bằng pm2-runtime logs..."
# Giữ PID 1 / container không thoát; đồng bộ với tiến trình PM2
exec pm2 logs "${APP_NAME}" --raw
