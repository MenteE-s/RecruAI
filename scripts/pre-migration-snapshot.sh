#!/usr/bin/env bash
# =============================================================================
# RecruAI — pre-migration snapshot
# =============================================================================
# Run immediately before `flask db upgrade` in production. Takes a database
# dump and an uploads sync, then prints the backup keys for the change record.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Pre-migration snapshot ==="
./scripts/backup-db.sh
./scripts/backup-uploads.sh

echo "Snapshot complete. Record the printed S3 keys in the deploy ticket."
