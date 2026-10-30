# RecruAI Backup and Restore

## Scope

- Database: PostgreSQL (RDS or self-hosted).
- Files: `backend/uploads` (profile images, recordings, documents).
- Configuration/secrets are not backed up by these scripts; store them in the
  secret manager used for deployment.

## RPO / RTO targets

- RPO: 24 hours for database rows, 24 hours for uploaded files.
- RTO: under 1 hour for a clean staging restore.

## Nightly schedule (production host or CI runner)

```bash
0 2 * * * /opt/recruai/scripts/backup-db.sh
0 2 * * * /opt/recruai/scripts/backup-uploads.sh
```

Set `DATABASE_URL`, `BACKUP_BUCKET`, `BACKUP_PREFIX`, and `UPLOADS_DIR` in the
cron environment. Retention is enforced by S3 lifecycle rules, not by the
scripts.

## S3 lifecycle (recommended)

- `recruai/db/`: transition to Glacier after 30 days, expire after 365 days.
- `recruai/uploads/`: transition to Glacier after 90 days, expire after 365 days.
- Keep at least 30 daily database backups available for fast restore.

## Pre-migration snapshot

Before every production migration:

```bash
./scripts/pre-migration-snapshot.sh
```

Record the printed S3 keys in the deploy ticket.

## Restore drill

1. Provision a clean staging database and empty uploads directory.
2. Restore the database:

```bash
DATABASE_URL=postgresql://... BACKUP_BUCKET=... ./scripts/restore-db.sh
```

3. Restore uploads:

```bash
UPLOADS_DIR=/app/backend/uploads BACKUP_BUCKET=... ./scripts/restore-uploads.sh
```

4. Run migrations if needed:

```bash
flask --app backend.app db upgrade
```

5. Start the backend and worker, then verify:
   - `/api/health/ready` returns 200
   - A sampled profile image resolves
   - A sampled interview recording resolves

## Restore acceptance criteria

- Application boots with restored data.
- Database row counts match the backup timestamp.
- Sampled uploaded files resolve over HTTP.
- Total restore time is under one hour.
