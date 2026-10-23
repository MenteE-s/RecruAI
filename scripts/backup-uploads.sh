#!/usr/bin/env bash
# =============================================================================
# RecruAI — uploads volume backup to S3
# =============================================================================
# Usage:
#   UPLOADS_DIR=/app/backend/uploads \
#   BACKUP_BUCKET=my-bucket BACKUP_PREFIX=recruai \
#   ./scripts/backup-uploads.sh
# =============================================================================
set -euo pipefail

: "${UPLOADS_DIR:?UPLOADS_DIR is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
BACKUP_PREFIX="${BACKUP_PREFIX:-recruai}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/uploads/${TIMESTAMP}/"

echo "=== Syncing uploads to ${DEST} ==="
aws s3 sync "${UPLOADS_DIR}" "${DEST}" \
  --storage-class STANDARD_IA \
  --exclude "*.tmp"

echo "Uploads backup complete: ${DEST}"
