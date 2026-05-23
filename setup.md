# pgvector Setup Guide

This guide enables AI-powered candidate search using vector embeddings. Each developer must run these steps after pulling the latest code.

## Prerequisites

- Docker & Docker Compose installed
- Latest code pulled (`git pull`)
- Backend container running (`docker-compose ps`)

## Setup Steps

### 1. Recreate PostgreSQL with pgvector

```bash
# Stop and remove the old postgres:15 container
docker-compose down db

# Create a new one with pgvector/pgvector:0.7.0-pg15 (preserves existing data volume)
docker-compose up -d db
```

### 2. Enable the pgvector extension

```bash
docker-compose exec db psql -U recruai -d recruai -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Rebuild backend (installs pgvector Python package)

```bash
docker-compose up -d --build backend
```

### 4. Apply the database migration

```bash
docker-compose exec backend flask db upgrade --directory /app/backend/migrations
```

### 5. Restart backend

```bash
docker-compose restart backend
```

### 6. Verify it's working

```bash
# Check backend health (embedding dimension should be 384)
docker-compose exec backend curl -s http://localhost:5000/api/health

# Test pgvector cosine_distance
docker-compose exec db psql -U recruai -d recruai -c "SELECT ARRAY[1,2,3]::vector(3) <-> ARRAY[4,5,6]::vector(3) AS cosine_distance;"
```

Expected health output includes `"embedding":{"dimension":384,"healthy":true}`.

## Troubleshooting

### `extension "vector" is not available`
The old `postgres:15` container is still running. Run `docker-compose down db` then `docker-compose up -d db` again.

### `service "backend" is not running`
Kafka may have failed its health check. Run:
```bash
docker-compose restart kafka
docker-compose restart backend
```

### `column "embedding" cannot be cast automatically to type vector`
The migration drops and recreates the column. Tables are empty so this is safe. If you see this, the migration may need to be re-run after pulling the latest version file.

### Collation version mismatch warning
Harmless warning. Can be ignored:
```
WARNING: database "recruai" has a collation version mismatch
```

## What changed

| File | Change |
|------|--------|
| `docker-compose.yml` | `db` image → `pgvector/pgvector:0.7.0-pg15` |
| `backend/requirements.txt` | Added `pgvector>=0.3.0` |
| `backend/.env` | Added `EMBEDDING_DIMENSIONS=384` |
| `backend/models/*_embedding.py` | Fixed import: `pgvector.sqlalchemy` instead of `sqlalchemy.dialects.postgresql` |
| `backend/rag/models/vector_store.py` | Same import fix |
| `backend/migrations/versions/883c10d41dbd_*.py` | Migration: `TEXT` → `VECTOR(384)` |
