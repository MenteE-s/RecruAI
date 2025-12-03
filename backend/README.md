# Backend setup (local PostgreSQL)

This project can run with PostgreSQL for local development by using Docker Compose.

1. Start Postgres via docker-compose:

   docker compose up -d db

2. Update `backend/.env` or export a `DATABASE_URL` in your shell, e.g.:

   Set DATABASE_URL=postgresql://recruai:recruai_pass@localhost:5432/recruai_dev

3. Activate your venv and run migrations:

   & .\venv\Scripts\Activate.ps1
   $Env:FLASK_APP = "manage.py"
   python -m flask db upgrade

4. If your local SQLite DB contains data you want to keep, export and import it manually to Postgres.

SQLite -> Postgres (quick outline):

- Stop the app that is using the sqlite DB.
- Dump SQLite data to CSV for each table (or use `sqlite3` + SQL to export).
- Create target PostgreSQL DB and apply schema:
  - Start Postgres with `docker compose up -d db`.
  - Set `DATABASE_URL` or update `backend/.env`.
  - Run `python -m flask db upgrade` to create schema.
- Import CSVs into Postgres using `psql` COPY or `pgloader`.

      # Example: using psql
      psql -h localhost -U recruai -d recruai_dev -c "\copy users FROM '/tmp/users.csv' CSV HEADER"

Tip: For complex cases use tools such as `pgloader` to directly migrate sqlite to postgres.

Tip: Make sure `psycopg2-binary` is in `backend/requirements.txt` (it is already).
