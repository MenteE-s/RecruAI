# RecruAI — deploy topology (authoritative)

One production path, two dev paths. Do not invent a fourth.

| File | Purpose | When to use |
|---|---|---|
| `docker-compose.aws.yml` | **Production.** API + Redis + Kafka + scheduler + outbox-worker + nginx + certbot against external RDS. Optional `livekit` + `egress` under `--profile video`. Deployed by `.github/workflows/deploy.yml`. | All production deploys. |
| `docker-compose.vps.yml` | Single-VPS variant with local Postgres (Lightsail). | VPS installs per `docs/LIGHTSAIL.md`. |
| `docker-compose.yml` | Local dev (`--profile app` for API, `--profile seed` for CVAI data). | Day-to-day development only. |
| `docker-compose.prod.yml` | Legacy overlay, kept for reference. Prefer `docker-compose.aws.yml`. | Do not use for new deploys. |

Frontend images: `frontend/Dockerfile` (dev server), `frontend/Dockerfile.prod`
(production nginx build). The public frontend and the platform admin are
separate Vercel projects; both bake `VITE_API_BASE_URL` /
`REACT_APP_API_BASE_URL` at build time, and `admin/vercel.json` supplies the
admin SPA rewrite. All external images are pinned to `tag@sha256:` digests
(see `backend/tests/test_hygiene.py`, which fails the suite if an unpinned
external image is added).

LiveKit and Egress are opt-in through the `video` profile and
`VIDEO_ENABLED=1`; keep them stopped until the media host, ports, keys, and
recording storage are verified. Rollback is the flag off plus
`docker compose -f docker-compose.aws.yml --profile video stop livekit egress`.

Database migrations live in `backend/migrations/versions/`. The current head
is verified in CI by `scripts/check-migration-head.sh`; the audit HTML must
name the same head.
