#!/usr/bin/env bash
# =============================================================================
# RecruAI — PostgreSQL backup to S3
# =============================================================================
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/db \
#   BACKUP_BUCKET=my-bucket BACKUP_PREFIX=recruai \
#   ./scripts/backup-db.sh [optional-output-file]
#
# The script writes a timestamped, gzip-compressed custom-format dump and
# uploads it to s3://$BACKUP_BUCKET/$BACKUP_PREFIX/db/. Retention is enforced
# by an S3 lifecycle rule (see docs/BACKUP_RESTORE.md), not by this script.
# =============================================================================
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
BACKUP_PREFIX="${BACKUP_PREFIX:-recruai}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${1:-/tmp/recruai-db-${TIMESTAMP}.dump.gz}"

echo "=== Dumping database ==="
pg_dump "${DATABASE_URL}" --format=custom --no-owner --no-privileges \
  | gzip -9 > "${OUT_FILE}"

echo "=== Uploading to S3 ==="
aws s3 cp "${OUT_FILE}" \
  "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/db/recruai-db-${TIMESTAMP}.dump.gz" \
  --storage-class STANDARD_IA

echo "Backup complete: s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/db/recruai-db-${TIMESTAMP}.dump.gz"
echo "Local file: ${OUT_FILE}"
