# RecruAI — deploy topology (authoritative)

One production path, two dev paths. Do not invent a fourth.

| File | Purpose | When to use |
|---|---|---|
| `docker-compose.aws.yml` | **Production.** API + Redis + Kafka + scheduler + outbox-worker + nginx + certbot against external RDS. Deployed by `.github/workflows/deploy.yml`. | All production deploys. |
| `docker-compose.vps.yml` | Single-VPS variant with local Postgres (Lightsail). | VPS installs per `docs/LIGHTSAIL.md`. |
| `docker-compose.yml` | Local dev (`--profile app` for API, `--profile seed` for CVAI data). | Day-to-day development only. |
| `docker-compose.prod.yml` | Legacy overlay, kept for reference. Prefer `docker-compose.aws.yml`. | Do not use for new deploys. |

Frontend images: `frontend/Dockerfile` (dev server), `frontend/Dockerfile.prod`
(production nginx build). All external images are pinned to
`tag@sha256:` digests (see `backend/tests/test_hygiene.py`, which fails the
suite if an unpinned external image is added).

Database migrations live in `backend/migrations/versions/`. The current head
is verified in CI by `scripts/check-migration-head.sh`; the audit HTML must
name the same head.
