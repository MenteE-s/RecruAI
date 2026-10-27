# RecruAI Admin — platform control plane

Separate Vite + React app, **same backend** (`/api`). For platform operators
with `users.is_superadmin = true` — not org admins, not regular users.

## Run locally

```bash
cd admin
npm install
npm run dev        # http://localhost:5173, /api proxied to 127.0.0.1:8000
```

The dev server proxies `/api` to the Flask backend, so no CORS setup is
needed locally. The backend must be running (`backend/.venv` + Postgres).

## Configure

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend origin in production (e.g. `https://api.recruai.menteeai.org`) | same-origin (Vite proxy in dev) |
| `VITE_DEV_API_PROXY` | Dev proxy target for `/api` | `http://127.0.0.1:8000` |

## Production

Build to static files and host anywhere (separate Vercel project recommended):

```bash
cd admin
VITE_API_BASE_URL=https://api.recruai.menteeai.org npm run build   # -> dist/
```

Add the admin origin to the backend's `FRONTEND_ORIGIN` (comma-separated)
so credentialed CORS + Socket.IO accept it. The login uses the same
`/api/auth/login` session as the main app; every admin route re-checks
`is_superadmin` from the database.

## First superadmin

No endpoint can self-grant. Bootstrap from the backend host:

```bash
python scripts/grant_superadmin.py --email you@example.com --grant
```

After that, superadmins manage each other from People → Manage.

## What it manages

- **Overview** — people/org counts, paid vs trial, outbox backlog, scheduler health.
- **People** — search, plan status, paid flag, AI allowance, superadmin grant/revoke (last-admin guarded).
- **Organizations** — search, visibility, plan status, paid flag.
- **Plans** — free vs premium catalogue (mirrors `backend/utils/subscription.py`) plus live subscriber counts. Stripe itself is not wired yet — changes here apply immediately.
- **Outbox & retries** — dead-letter triage with one-click retry.
- **Content banks** — counts for quizzes, projects, skills, mock questions, agents; flags empty banks that need the `cvai_seed` profile.
