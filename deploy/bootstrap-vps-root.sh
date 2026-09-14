#!/usr/bin/env bash

set -Eeuo pipefail
trap 'echo "Bootstrap gagal pada baris ${LINENO}. Perbaiki error di atas lalu jalankan ulang." >&2' ERR

readonly APP_DIR="/var/www/pariwisata-bulukumba"
readonly DOMAIN="pariwisatabulukumba.site"
readonly DB_BOOTSTRAP_FILE="/home/deploy/.bulukumba-db-bootstrap.sql"
readonly NGINX_SITE="/etc/nginx/sites-available/pariwisata-bulukumba"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Jalankan script ini dengan sudo." >&2
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "Direktori aplikasi tidak ditemukan: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/deploy/nginx.http.conf.example" ]]; then
  echo "Template Nginx HTTP tidak ditemukan." >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/deploy/nginx.conf.example" ]]; then
  echo "Template Nginx HTTPS tidak ditemukan." >&2
  exit 1
fi

read -r -p "Email aktif untuk notifikasi Let's Encrypt: " certbot_email
if [[ ! "${certbot_email}" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "Format email tidak valid." >&2
  exit 1
fi

echo "[1/9] Menyiapkan database dan user aplikasi..."
if [[ -s "${DB_BOOTSTRAP_FILE}" ]]; then
  mysql < "${DB_BOOTSTRAP_FILE}"
  rm -f "${DB_BOOTSTRAP_FILE}"
else
  echo "Bootstrap database sudah dijalankan; langkah ini dilewati."
fi

echo "[2/9] Memastikan direktori dan permission..."
install -d -m 755 -o deploy -g www-data "${APP_DIR}"
install -d -m 750 -o deploy -g www-data \
  /var/lib/bulukumba-tourism/uploads
install -d -m 750 -o deploy -g deploy \
  /var/backups/bulukumba-tourism
chown -R deploy:www-data "${APP_DIR}"

echo "[3/9] Mengaktifkan konfigurasi Nginx HTTP..."
install -m 644 \
  "${APP_DIR}/deploy/nginx.http.conf.example" \
  "${NGINX_SITE}"
sed -i "s/example\\.com/${DOMAIN}/g" "${NGINX_SITE}"
ln -sfn "${NGINX_SITE}" \
  /etc/nginx/sites-enabled/pariwisata-bulukumba
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "[4/9] Mengatur firewall OS..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "[5/9] Memasang Certbot bila belum tersedia..."
if ! command -v certbot >/dev/null 2>&1; then
  snap install --classic certbot
fi
ln -sfn /snap/bin/certbot /usr/local/bin/certbot

echo "[6/9] Menerbitkan sertifikat HTTPS..."
certbot certonly \
  --nginx \
  --non-interactive \
  --agree-tos \
  --keep-until-expiring \
  --email "${certbot_email}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

echo "[7/9] Mengaktifkan konfigurasi Nginx HTTPS final..."
install -m 644 \
  "${APP_DIR}/deploy/nginx.conf.example" \
  "${NGINX_SITE}"
sed -i "s/example\\.com/${DOMAIN}/g" "${NGINX_SITE}"
nginx -t
systemctl reload nginx

echo "[8/9] Menguji perpanjangan otomatis sertifikat..."
certbot renew --dry-run

echo "[9/9] Memeriksa service dan firewall..."
systemctl is-active --quiet mysql
systemctl is-active --quiet nginx
ufw status verbose

echo
echo "Bootstrap root selesai."
