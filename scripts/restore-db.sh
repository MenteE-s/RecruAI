#!/usr/bin/env bash
# =============================================================================
# RecruAI — restore database from an S3 backup
# =============================================================================
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/db \
#   BACKUP_BUCKET=my-bucket \
#   ./scripts/restore-db.sh [s3-key-or-local-file]
#
# If no argument is given, the most recent backup in
# s3://$BACKUP_BUCKET/recruai/db/ is used.
# =============================================================================
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
BACKUP_PREFIX="${BACKUP_PREFIX:-recruai}"

if [[ $# -gt 0 ]]; then
  SOURCE="$1"
else
  echo "=== Finding latest backup ==="
  SOURCE="s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/db/$(aws s3 ls "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/db/" | sort | tail -n 1 | awk '{print $4}')"
fi

TMP_FILE="/tmp/recruai-restore.dump.gz"
echo "=== Downloading ${SOURCE} ==="
if [[ "${SOURCE}" == s3://* ]]; then
  aws s3 cp "${SOURCE}" "${TMP_FILE}"
else
  cp "${SOURCE}" "${TMP_FILE}"
fi

echo "=== Restoring (this drops and recreates objects) ==="
gunzip -c "${TMP_FILE}" | pg_restore \
  --dbname="${DATABASE_URL}" \
  --clean --if-exists \
  --no-owner --no-privileges \
  --exit-on-error

echo "Restore complete."
echo "Run migrations if needed: flask --app backend.app db upgrade"
