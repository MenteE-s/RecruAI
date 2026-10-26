# RecruAI Deployment Runbook

## Pipeline

```text
PR -> validate (tests + build) -> manual approval -> deploy to EC2
```

- `validate` job runs backend tests, frontend tests, production audit, and build.
- `deploy` job requires the `production` environment (manual approval), runs
  on `main` after `validate` passes.

## Deploy order

1. SSH to EC2; bootstrap Docker/Compose/buildx if missing.
2. `scripts/render-production-env.sh` writes `backend/.env.production` on the
   runner with `printf` (secret characters like `$` and backticks survive).
3. `rsync` ships the repo and `.env.production` to `/opt/recruai`.
4. `Start infra` brings up redis/kafka.
5. `Record previous backend image id` stores the current `recruai_backend:latest`
   image id for rollback.
6. `Pre-migration snapshot` runs `scripts/backup-db.sh` on the EC2 host if
   `BACKUP_BUCKET` is configured. Skips if unset (RDS automated snapshots remain).
7. `Build backend image` creates a new `recruai_backend:latest` and tags it
   with the commit SHA (`recruai_backend:<sha>`).
8. `Run DB migrations` applies `flask db upgrade`.
9. `Start backend, scheduler, and outbox worker` brings up the app.
10. `Issue TLS cert on first boot` (skips if a cert already exists).
11. `Start nginx + certbot` renders the nginx template and reloads.
12. `Wait for public HTTPS health` polls `https://api.recruai.menteeai.org/api/health`
    for up to 5 minutes.
13. On failure: `Rollback on failed deploy` restores the previous image tag and
    restarts the app containers.
14. On success: `Clean up old Docker images`.

## Required GitHub secrets

| Secret | Purpose |
|---|---|
| `EC2_HOST` | Production EC2 public hostname |
| `EC2_SSH_PRIVATE_KEY` | SSH private key for `ec2-user` |
| `RDS_DATABASE_URL` | `postgresql://...` URL (psycopg2 driver auto-normalized) |
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `RESEND_API_KEY` | Transactional email |
| `GROQ_API_KEY` | AI provider (optional) |
| `OPENAI_API_KEY` | AI provider (optional) |
| `BACKUP_BUCKET` | Optional: S3 bucket for pre-migration snapshot. Leave unset to skip. |
| `BACKUP_PREFIX` | Optional: S3 prefix (default `recruai`) |

## Staging (not yet provisioned)

A staging environment with the same compose topology is recommended before the
next launch. Provisioning requires an EC2 instance + RDS (shared or separate).
Once available, add a `staging` environment and `deploy-staging.yml` reusing
the same steps against `EC2_STAGING_HOST`. Until then, the manual approval
gate on the `production` environment is the only gate between `validate` and
a live deploy.

## Manual rollback

If the automatic rollback fails or a migration is bad:

```bash
# SSH to the EC2 host
cd /opt/recruai

# App-only rollback (previous image id from the failed deploy log):
PREVIOUS_IMAGE_ID=<id> API_DOMAIN=api.recruai.menteeai.org ./scripts/rollback-deploy.sh

# If the migration broke the schema, restore the database:
source backend/.env.production
./scripts/restore-db.sh

# Restart and verify:
docker compose -f docker-compose.aws.yml up -d backend scheduler outbox-worker nginx
curl -f https://api.recruai.menteeai.org/api/health
```

## Rollback rehearsal

Quarterly, in a non-peak window:

1. Deploy a deliberately broken (test) change to a staging branch or
   feature-branch deploy.
2. Observe the `Wait for public HTTPS health` step fail.
3. Confirm the `Rollback on failed deploy` step restores the previous image
   and `api/health` returns 200 within 5 minutes.
4. If the change included a migration, restore the pre-migration snapshot and
   confirm the app boots.

## Migration compatibility policy

Every migration must be backward-compatible for one release
(expand/contract):

1. **Release 1 (expand):** add new columns/tables with defaults or nullable.
   Old code reads new schema without error.
2. **Release 2 (contract):** drop old columns/tables.
   Deploy only after release 1 is stable.

Never drop or rename a column in the same release that starts reading it.

## Related scripts

- `scripts/backup-db.sh` - dumps the database to S3.
- `scripts/backup-uploads.sh` - syncs uploads to S3.
- `scripts/restore-db.sh` - restores the database from the latest S3 dump.
- `scripts/pre-migration-snapshot.sh` - db + uploads snapshot wrapper.
- `scripts/rollback-deploy.sh` - restores the previous backend image tag.
- `scripts/render-production-env.sh` - writes `.env.production` on the runner.

