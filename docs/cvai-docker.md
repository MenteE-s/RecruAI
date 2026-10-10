# Running CVAI in Docker

Everything CVAI needs — migrations, question bank, quizzes, projects, and the
grant path that replaces billing — runs inside the backend image. Nothing here
requires SSHing into a box or hand-running a script against a live database.

All commands are run from the repository root. Use the compose file for wherever
the stack actually runs:

| Stack | File | Database |
|---|---|---|
| Local dev | `docker-compose.yml` | `db` service (pgvector) |
| Single VPS (Lightsail) | `docker-compose.vps.yml` | `db` service |
| AWS | `docker-compose.aws.yml` | RDS, no `db` service |

---

## 1. Migrations

There is a one-shot `migrate` service. `backend` will not start until it
completes successfully.

```bash
# let compose do it as part of a deploy
docker compose --profile app up -d backend          # dev
docker compose -f docker-compose.vps.yml up -d      # vps

# or run it on its own
docker compose --profile app run --rm migrate
docker compose -f docker-compose.vps.yml run --rm migrate
docker compose -f docker-compose.aws.yml run --rm migrate
```

Why a separate service rather than an entrypoint inside `backend`: with more than
one replica every container would run `db upgrade` simultaneously, and a
half-applied schema is far worse than a boot that refuses to start. As wired, a
failed migration stops the deploy instead of serving traffic against a schema the
code does not expect.

Check where the schema is:

```bash
docker compose --profile app logs migrate | tail -5
docker compose exec db psql -U recruai -d recruai -c "SELECT version_num FROM alembic_version;"
```

Current head is `a2b3c4d5e6f7`. The chain is linear and must stay that way — CI
enforces a single head.

## 2. CVAI content

The question bank, the quizzes and the guided projects are all idempotent seed
scripts. Re-running them is safe; they report `created 0, skipped N` once the
content exists.

```bash
docker compose --profile seed run --rm cvai-seed
docker compose -f docker-compose.vps.yml --profile seed run --rm cvai-seed
docker compose -f docker-compose.aws.yml --profile seed run --rm cvai-seed
```

It runs, in order: `seed_skill_questions.py` → `seed_quizzes.py` →
`seed_guided_projects.py`. Behind a compose profile, so it never fires
unattended on `up`.

To seed only one, drop into the running container:

```bash
docker compose exec backend python scripts/seed_quizzes.py
```

## 3. Subscriptions — the stand-in for billing

Billing is deliberately out of MVP scope, so `grant_subscription.py` is the only
way an account becomes a paid subscriber. It ships in the image for that reason.

```bash
# see every account and its state
docker compose exec backend python scripts/grant_subscription.py --list

# make someone a subscriber (sets status AND paid_plan together)
docker compose exec backend python scripts/grant_subscription.py --email someone@example.com --grant

# more AI budget, for someone who ran out
docker compose exec backend python scripts/grant_subscription.py --email someone@example.com --tokens 200000

# reset usage without losing the history
docker compose exec backend python scripts/grant_subscription.py --email someone@example.com --reset-tokens

# take access away again
docker compose exec backend python scripts/grant_subscription.py --email someone@example.com --revoke

# on a deploy host, prefix with the compose file:
docker compose -f docker-compose.vps.yml exec backend python scripts/grant_subscription.py --list
```

The seed scripts and the grant script all import `backend.app`, so they need the
same environment the API has. Through `compose exec` they get it for free.

## 4. Local development

The usual loop still runs the API on the host from `backend/.venv`, which is
faster to reload and easier to step through. `docker-compose.yml` keeps that
default — `backend` and `migrate` are behind the `app` profile, so a plain
`docker compose up -d` still brings up only the infrastructure.

To run the API in Docker as well:

```bash
docker compose --profile app up -d --build backend
```

`DATABASE_URL`, `REDIS_URL` and the Kafka address are set explicitly on the
service. They must be: `backend/.env` points at `127.0.0.1`, which is the host
from the app's point of view but the container's own loopback from inside.

## 5. Health

```bash
docker compose ps                       # 'healthy' per service
curl -H 'X-Forwarded-Proto: https' http://localhost:8000/api/health
```

Returns `200 {"database":"healthy","status":"ok"}` or `503` when the database is
unreachable. The header matters: Flask-Talisman runs with `force_https` in
production and redirects requests it believes are plain HTTP, so without it
`/api/health` answers `302`, and `curl -f` counts a redirect as success. The
healthcheck would then report "healthy" without the app or the database ever
answering. Sending the header that nginx already sets makes the in-container
check behave like the public one, and the gate becomes real.

## 6. Notes and gotchas

- **`docker stack deploy` ignores `depends_on`.** If you deploy
  `docker-compose.prod.yml` as a swarm stack, the `migrate` service will not run
  first. Run it explicitly before deploying the API.
- **The image no longer builds from `./backend`.** The context is the repository
  root so that `scripts/` ships inside it. The root `.dockerignore` excludes
  everything by default and re-includes only `backend/` and `scripts/`; it also
  keeps `backend/.env`, `backend/.venv` and `node_modules` out. If you add a new
  top-level directory that the image needs, add a rule for it there.
- **`backend/.dockerignore` is dead.** Docker only reads the one at the context
  root. It is kept with a comment saying so rather than deleted.
- **Kafka noise in logs** means `KAFKA_BOOTSTRAP_SERVERS` is unset, not that
  Kafka is down. The client falls back to `localhost:9092`, which inside the
  container is itself.
- **`create_app()` validates secrets at import time in production.** Any container
  that imports the app — including `migrate` and `cvai-seed` — needs
  `SECRET_KEY`, `JWT_SECRET_KEY` and a provider key (`GROQ_API_KEY`), or it will
  refuse to start. That is intentional, and `env_file` supplies them.
