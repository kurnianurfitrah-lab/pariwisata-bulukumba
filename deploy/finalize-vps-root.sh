#!/usr/bin/env bash

set -Eeuo pipefail
trap 'echo "Finalisasi gagal pada baris ${LINENO}. Periksa error di atas." >&2' ERR

readonly APP_DIR="/var/www/pariwisata-bulukumba"
readonly DOMAIN="pariwisatabulukumba.site"
readonly NGINX_SITE="/etc/nginx/sites-available/pariwisata-bulukumba"
readonly PM2_SERVICE="/etc/systemd/system/pm2-deploy.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Jalankan script ini dengan sudo." >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/deploy/nginx.conf.example" ]]; then
  echo "Template Nginx HTTPS tidak ditemukan." >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/deploy/pm2-deploy.service.example" ]]; then
  echo "Template service PM2 tidak ditemukan." >&2
  exit 1
fi

if [[ ! -s "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "Sertifikat HTTPS domain tidak ditemukan." >&2
  exit 1
fi

echo "[1/5] Menerapkan konfigurasi Nginx final..."
install -m 644 \
  "${APP_DIR}/deploy/nginx.conf.example" \
  "${NGINX_SITE}"
sed -i "s/example\\.com/${DOMAIN}/g" "${NGINX_SITE}"
nginx -t
systemctl reload nginx

echo "[2/5] Memasang service startup PM2 untuk user deploy..."
install -m 644 \
  "${APP_DIR}/deploy/pm2-deploy.service.example" \
  "${PM2_SERVICE}"
systemctl daemon-reload
systemctl enable pm2-deploy

echo "[3/5] Menguji PM2 melalui systemd..."
systemctl stop pm2-deploy 2>/dev/null || true
runuser -u deploy -- \
  env PM2_HOME=/home/deploy/.pm2 \
  /usr/lib/node_modules/pm2/bin/pm2 kill >/dev/null 2>&1 || true
systemctl reset-failed pm2-deploy
systemctl start pm2-deploy
sleep 5
systemctl is-active --quiet pm2-deploy
curl --fail --silent --show-error \
  http://127.0.0.1:5000/api/health/ready >/dev/null

echo "[4/5] Memeriksa service utama..."
systemctl is-active --quiet nginx
systemctl is-active --quiet mysql
systemctl is-active --quiet ssh

echo "[5/5] Memeriksa firewall..."
ufw status verbose

echo
echo "Finalisasi root selesai."
