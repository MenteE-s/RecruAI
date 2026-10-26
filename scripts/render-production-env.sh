#!/usr/bin/env bash
# =============================================================================
# RecruAI — render backend/.env.production for deploys
# =============================================================================
# Runs on the GitHub Actions runner (not the production host) so secrets are
# written with printf instead of being re-parsed by a remote heredoc. A
# password containing $ or backticks is copied literally.
# =============================================================================
set -euo pipefail

OUT="${1:-backend/.env.production}"

: "${RDS_DATABASE_URL:?RDS_DATABASE_URL is required}"
: "${API_DOMAIN:?API_DOMAIN is required}"
: "${FRONTEND_ORIGIN:?FRONTEND_ORIGIN is required}"
: "${SECRET_KEY:?SECRET_KEY is required}"
: "${JWT_SECRET_KEY:?JWT_SECRET_KEY is required}"
: "${RESEND_API_KEY:?RESEND_API_KEY is required}"

# This codebase uses psycopg2. RDS secrets are sometimes returned as
# postgresql+psycopg:// (v3), which crashes backend boot with "No module named
# 'psycopg'". Normalize to the installed driver.
URL="${RDS_DATABASE_URL}"
URL="${URL/postgresql+psycopg:\/\//postgresql+psycopg2://}"

DB_USER="$(printf '%s' "$URL" | sed -E 's|.*://([^:]+):.*|\1|')"
DB_PASS="$(printf '%s' "$URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')"
DB_HOST="$(printf '%s' "$URL" | sed -E 's|.*@([^:/]+).*|\1|')"
DB_PORT="$(printf '%s' "$URL" | sed -E 's|.*@[^:/]+:?([0-9]*)/.*|\1|')"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="$(printf '%s' "$URL" | sed -E 's|.*/([^/?]+).*|\1|')"

# Never echo secrets. Print the normalized scheme only.
printf 'DB scheme after normalizing: %s\n' "$(printf '%s' "$URL" | sed -E 's#://.*#://***#')"

mkdir -p "$(dirname "$OUT")"

{
  printf 'IS_PRODUCTION=1\n'
  printf 'FLASK_ENV=production\n'
  printf 'FLASK_DEBUG=0\n'
  printf 'PORT=8000\n'
  printf 'API_DOMAIN=%s\n' "$API_DOMAIN"
  printf 'FRONTEND_ORIGIN=%s\n' "$FRONTEND_ORIGIN"
  printf 'DATABASE_URL=%s\n' "$URL"
  printf 'VECTOR_DB_HOST=%s\n' "$DB_HOST"
  printf 'VECTOR_DB_PORT=%s\n' "$DB_PORT"
  printf 'VECTOR_DB_NAME=%s\n' "$DB_NAME"
  printf 'VECTOR_DB_USER=%s\n' "$DB_USER"
  printf 'VECTOR_DB_PASSWORD=%s\n' "$DB_PASS"
  printf 'SECRET_KEY=%s\n' "$SECRET_KEY"
  printf 'JWT_SECRET_KEY=%s\n' "$JWT_SECRET_KEY"
  printf 'GROQ_API_KEY=%s\n' "${GROQ_API_KEY:-}"
  printf 'OPENAI_API_KEY=%s\n' "${OPENAI_API_KEY:-}"
  printf 'RESEND_API_KEY=%s\n' "$RESEND_API_KEY"
  printf 'REDIS_URL=redis://redis:6379/0\n'
  printf 'REDIS_ENABLED=1\n'
  printf 'RATELIMIT_STORAGE_URL=redis://redis:6379/0\n'
  printf 'KAFKA_BOOTSTRAP_SERVERS=kafka:29092\n'
  printf 'KAFKA_ENABLED=1\n'
  printf 'KAFKA_DEFAULT_TOPIC=recruai_events\n'
  printf 'RAG_ENABLED=1\n'
  printf 'EMBEDDING_PROVIDER=huggingface\n'
  printf 'EMBEDDING_DIMENSIONS=384\n'
  printf 'AI_PROVIDER=groq\n'
  printf 'AI_MODEL=%s\n' "${AI_MODEL:-qwen/qwen3.8-27b}"
  printf 'GROQ_MODEL=%s\n' "${GROQ_MODEL:-qwen/qwen3.8-27b}"
  printf 'JWT_TOKEN_LOCATION=headers\n'
  printf 'JWT_COOKIE_SECURE=1\n'
  printf 'JWT_COOKIE_SAMESITE=None\n'
  printf 'JWT_COOKIE_CSRF_PROTECT=1\n'
  printf 'JWT_ACCESS_TOKEN_EXPIRES_MINUTES=15\n'
  printf 'REFRESH_TOKEN_TTL_DAYS=30\n'
  printf 'REFRESH_COOKIE_SECURE=1\n'
  printf 'REFRESH_COOKIE_SAMESITE=Lax\n'
  printf 'SESSION_COOKIE_SECURE=1\n'
  printf 'ENABLE_HSTS=1\n'
  printf 'ENABLE_AUDIT_LOG=1\n'
} > "$OUT"

chmod 600 "$OUT"
echo "Wrote ${OUT}"
