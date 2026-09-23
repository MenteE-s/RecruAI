#!/bin/sh
set -e

# If no real SSL certs exist, generate self-signed ones so nginx can start.
CERT_DIR="/etc/letsencrypt/live/${API_DOMAIN}"
if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  echo "[nginx-init] No SSL certs found for ${API_DOMAIN} - generating self-signed cert..."
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${API_DOMAIN}" 2>/dev/null
  echo "[nginx-init] Self-signed cert created."
fi

# Run nginx's default entrypoint with daemon off so container stays alive
exec /docker-entrypoint.sh nginx -g "daemon off;"
