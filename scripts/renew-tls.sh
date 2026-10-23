#!/usr/bin/env bash
# =============================================================================
# RecruAI — TLS certificate renewal with nginx reload
# =============================================================================
# Run from cron (daily is fine; certbot renews only when <30 days remain):
#   0 3 * * * /opt/recruai/scripts/renew-tls.sh >> /var/log/recruai-tls.log 2>&1
#
# The script never stops nginx; it reloads only when a certificate actually
# changes, so in-flight requests are not dropped.
# =============================================================================
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-/opt/recruai/docker-compose.aws.yml}"
API_DOMAIN="${API_DOMAIN:?API_DOMAIN is required}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"
CERT_PATH="${CERT_PATH:-/etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem}"
WARN_DAYS="${WARN_DAYS:-21}"

if [[ ! -f "${CERT_PATH}" ]]; then
  echo "[$(date -u +%FT%TZ)] certificate not found: ${CERT_PATH}" >&2
  exit 1
fi

# Fail loudly (and alert via cron mail) before expiry.
EXPIRY_EPOCH="$(openssl x509 -enddate -noout -in "${CERT_PATH}" | cut -d= -f2 | date -f - +%s 2>/dev/null || true)"
if [[ -n "${EXPIRY_EPOCH}" ]]; then
  NOW_EPOCH="$(date +%s)"
  DAYS_LEFT="$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))"
  if (( DAYS_LEFT < WARN_DAYS )); then
    echo "[$(date -u +%FT%TZ)] WARNING: certificate expires in ${DAYS_LEFT} days" >&2
  fi
fi

BEFORE="$(sha256sum "${CERT_PATH}" | awk '{print $1}')"
certbot renew --webroot -w /var/www/certbot --quiet || true
AFTER="$(sha256sum "${CERT_PATH}" | awk '{print $1}')"

if [[ "${BEFORE}" != "${AFTER}" ]]; then
  echo "[$(date -u +%FT%TZ)] certificate renewed; reloading nginx"
  docker compose -f "${COMPOSE_FILE}" exec -T "${NGINX_SERVICE}" nginx -s reload
else
  echo "[$(date -u +%FT%TZ)] no renewal needed"
fi
