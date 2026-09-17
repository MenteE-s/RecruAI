# RecruAI Lightsail MVP runbook (pitch deployment)

Frontend lives on Vercel: **https://recruai.menteeai.org**
This box runs: API (gunicorn) + Postgres+pgvector + Redis + Kafka + nginx/TLS.

## 1. Instance

- **Pick: Medium-4GB — 2 vCPU / 4 GB RAM / 80 GB SSD — $24/mo.**
  Kafka idles ~1 GB; Postgres ~0.5 GB; backend ~0.5–0.8 GB; OS+Docker ~0.5 GB.
  Tight-fit alternative: Small-2GB ($12/mo) **only** with `KAFKA_ENABLED=0`
  and kafka stopped (see §7).
- OS: Ubuntu 22.04 LTS blueprint. Attach a static IP. Open firewall ports
  **22 (SSH, ideally your IP only), 80, 443** — nothing else (no 5432/6379/9092).

## 2. DNS (menteeai.org zone)

| Host | Target |
|---|---|
| `recruai.menteeai.org` | Vercel project (already live) |
| `api.menteeai.org` (or your chosen API host) | Lightsail static IP (A record) |

The API host below is `API_DOMAIN`. Replace `api.menteeai.org` everywhere if different.

## 3. First deploy

```bash
# on the instance
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker   # re-login after
git clone <repo-url> RecruAI && cd RecruAI
git checkout underdev   # or main once merged

# secrets — generate real values, never commit this file
cp backend/.env.vps.example backend/.env.vps
python3 -c "import secrets; print(secrets.token_urlsafe(48))"  # x2 -> SECRET_KEY, JWT_SECRET_KEY
# edit backend/.env.vps: DB_PASSWORD + DATABASE_URL must match,
# FRONTEND_ORIGIN=https://recruai.menteeai.org, API_BASE_URL=https://api.menteeai.org

# host env for compose variable interpolation
export DB_PASSWORD='<same-as-in-env-file>' API_DOMAIN='api.menteeai.org'

# TLS first issue (nginx must be down so certbot can bind :80)
docker compose -f docker-compose.vps.yml up -d db redis kafka backend
docker run --rm -p 80:80 \
  -v recruai_letsencrypt:/etc/letsencrypt -v recruai_certbot_www:/var/www/certbot \
  certbot/certbot certonly --standalone -d api.menteeai.org \
  --agree-tos -m you@menteeai.org --no-eff-email
docker compose -f docker-compose.vps.yml up -d nginx

# database + health
docker compose -f docker-compose.vps.yml exec backend flask db upgrade --directory /app/backend/migrations
curl -f https://api.menteeai.org/api/health
```

Renewal cron (monthly is plenty; certbot renews <30d):
```cron
0 3 1 * * docker stop recruai_nginx; docker run --rm -p 80:80 -v recruai_letsencrypt:/etc/letsencrypt certbot/certbot renew -q; docker start recruai_nginx
```

## 4. Vercel (frontend rebuild — vars are baked at build time)

Set in the Vercel project → redeploy:
- `REACT_APP_API_BASE_URL=https://api.menteeai.org`
- `REACT_APP_SOCKET_URL=https://api.menteeai.org`

## 5. Kafka toggle (no code changes)

- Off (save ~1 GB): `KAFKA_ENABLED=0` in `backend/.env.vps`, then
  `docker compose -f docker-compose.vps.yml stop kafka kafka-init`
  and `docker compose -f docker-compose.vps.yml up -d backend` to reload.
- On: `KAFKA_ENABLED=1`, `up -d kafka kafka-init backend`.

## 6. Backups before pitch day

- Lightsail **snapshot** of the instance (console → Snapshots → create).
- DB dump: `docker compose -f docker-compose.vps.yml exec db pg_dump -U recruai recruai | gzip > recruai-$(date +%F).sql.gz`
  and copy off the box. Restore: `gunzip -c file | docker compose exec -T db psql -U recruai recruai`.
- Rollback = restore snapshot, or `git checkout <previous-sha>` + `up -d --build backend`.

## 7. Known MVP limits (accepted, not fixed)

- Interviews need one working LLM key (`GROQ_API_KEY` or OpenAI); chat has a
  generic fallback reply if the provider 403s/timeouts — verify before demo.
- Vector-based recommendations (`/candidates/<job>`, `/agents/<job>`, `/embed/*`)
  still need stored embeddings; Hire search + job recommendations + `/search`
  are tsvector and need nothing.
- Rate limits are per-process in-memory unless `RATELIMIT_STORAGE_URL` points
  at Redis (template already does).
- Demo seeds refuse to run unless `ALLOW_DEMO_SEED=1` (template keeps `0`).
