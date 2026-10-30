#!/usr/bin/env bash
# =============================================================================
# RecruAI — app-level rollback for a failed deploy
# =============================================================================
# Run this on the EC2 host (the deploy workflow runs it automatically when a
# public HTTPS health check fails after the app was updated).
#
#   PREVIOUS_IMAGE_ID=<image id> DEPLOY_DIR=/opt/recruai \
#     API_DOMAIN=api.recruai.menteeai.org ./scripts/rollback-deploy.sh
#
# Rollback scope:
#   - restores the previous backend image tag and restarts app/scheduler/nginx
#   - does NOT roll the database back; a failed migration needs
#     scripts/restore-db.sh against the pre-migration snapshot.
# =============================================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/recruai}"
COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_DIR}/docker-compose.aws.yml}"
PREVIOUS_IMAGE_ID="${PREVIOUS_IMAGE_ID:?PREVIOUS_IMAGE_ID is required}"
API_DOMAIN="${API_DOMAIN:?API_DOMAIN is required}"
HEALTH_URL="https://${API_DOMAIN}/api/health"

cd "$DEPLOY_DIR"

echo "=== Restoring previous backend image ${PREVIOUS_IMAGE_ID} ==="
docker tag "${PREVIOUS_IMAGE_ID}" recruai_backend:latest

echo "=== Restarting backend, scheduler, outbox worker, nginx ==="
docker compose -f "$COMPOSE_FILE" up -d --no-build backend scheduler outbox-worker
docker compose -f "$COMPOSE_FILE" restart nginx

echo "=== Waiting for rollback to become healthy ==="
STATUS="000"
for _ in $(seq 1 30); do
  STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo 000)"
  if [[ "$STATUS" == "200" ]]; then
    echo "Rollback complete; ${HEALTH_URL} returned 200."
    exit 0
  fi
  sleep 10
done

echo "Rollback did not become healthy (last status ${STATUS})."
echo "Inspect with: docker compose -f ${COMPOSE_FILE} logs --tail=200 backend scheduler outbox-worker nginx"
echo "If the migration broke things, restore the database:"
echo "  ${DEPLOY_DIR}/scripts/restore-db.sh"
exit 1
