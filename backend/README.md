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

---

## Deploying the Backend on Railway

Railway is a platform that makes it easy to deploy applications. Follow these steps to deploy just the backend:

### Prerequisites

1. A [Railway](https://railway.app/) account
2. Railway CLI installed (optional, but recommended): `npm install -g @railway/cli`

### Deployment Steps

#### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Create a new project** on [Railway Dashboard](https://railway.app/dashboard)

2. **Add a PostgreSQL database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

3. **Deploy the backend**:
   - Click "New" → "GitHub Repo"
   - Select the RecruAI repository
   - In the service settings, set:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT "backend.app:create_app()"`

4. **Set environment variables** in the Railway dashboard:
   ```
   SECRET_KEY=<your-secure-secret-key>
   JWT_SECRET_KEY=<your-secure-jwt-secret>
   FRONTEND_ORIGIN=<your-frontend-url>
   GROQ_API_KEY=<your-groq-api-key>          # Optional: for AI features
   OPENAI_API_KEY=<your-openai-api-key>      # Optional: for AI features
   ```

5. **Run database migrations**:
   - Open the Railway shell for your service
   - Run: `python -m flask db upgrade`

#### Option 2: Deploy via Railway CLI

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Initialize and link project**:
   ```bash
   cd backend
   railway init
   railway link
   ```

3. **Add PostgreSQL**:
   ```bash
   railway add --plugin postgresql
   ```

4. **Set environment variables**:
   ```bash
   railway variables set SECRET_KEY=<your-secret>
   railway variables set JWT_SECRET_KEY=<your-jwt-secret>
   railway variables set FRONTEND_ORIGIN=<your-frontend-url>
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Run migrations**:
   ```bash
   railway run python -m flask db upgrade
   ```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway) | Yes (auto) |
| `SECRET_KEY` | Flask secret key for sessions | Yes |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Yes |
| `FRONTEND_ORIGIN` | Frontend URL for CORS (e.g., `https://your-frontend.com`) | Yes |
| `GROQ_API_KEY` | Groq API key for AI features | Optional |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `ENABLE_HSTS` | Set to `1` to enable HSTS headers | Optional |
| `SESSION_COOKIE_SECURE` | Set to `1` for HTTPS cookie security | Recommended |

### Files Created for Railway Deployment

- `railway.toml` - Railway-specific configuration
- `Procfile` - Process file defining how to start the application
- `gunicorn` added to `requirements.txt` - Production WSGI server

### Post-Deployment

1. **Verify the deployment** by visiting your Railway-provided URL
2. **Check the health endpoint** at `GET /` - should return `{"status": "ok", "message": "RecruAI backend running"}`
3. **Test the API** at `GET /api/health` for API health check
