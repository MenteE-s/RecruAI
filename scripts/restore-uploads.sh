#!/usr/bin/env bash
# =============================================================================
# RecruAI — restore uploads volume from an S3 backup
# =============================================================================
# Usage:
#   UPLOADS_DIR=/app/backend/uploads \
#   BACKUP_BUCKET=my-bucket \
#   ./scripts/restore-uploads.sh [s3-prefix]
#
# Default prefix: s3://$BACKUP_BUCKET/recruai/uploads/<latest>/
# =============================================================================
set -euo pipefail

: "${UPLOADS_DIR:?UPLOADS_DIR is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
BACKUP_PREFIX="${BACKUP_PREFIX:-recruai}"

if [[ $# -gt 0 ]]; then
  SOURCE="$1"
else
  LATEST="$(aws s3 ls "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/uploads/" | sort | tail -n 1 | awk '{print $2}')"
  SOURCE="s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/uploads/${LATEST}"
fi

echo "=== Syncing ${SOURCE} to ${UPLOADS_DIR} ==="
aws s3 sync "${SOURCE}" "${UPLOADS_DIR}"

echo "Uploads restore complete."
