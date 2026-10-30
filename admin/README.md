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

## Production (Vercel)

Create a **separate Vercel project** pointing at this repo:

- Root Directory: `admin`
- Build Command: `npm run build` (or leave default)
- Output Directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://api.recruai.menteeai.org`

The production build fails with a named error when `VITE_API_BASE_URL` is
unset (`admin/scripts/check-env.js`, run as `prebuild`) instead of silently
calling the admin host for API traffic. `admin/vercel.json` adds the required
SPA rewrite so deep links such as `/users` load the React app, plus baseline
security headers and a CSP that allows API calls only to the production API
origin. Update the CSP if the API host changes.

Then wire the backend to accept it:

1. Add a GitHub secret `ADMIN_ORIGIN` with the admin's public URL
   (e.g. `https://admin.recruai.menteeai.org`). The deploy renders it into
   the credentialed CORS origin list alongside the main frontend.
2. **Prefer a same-parent-domain host** (e.g. `admin.recruai.menteeai.org`
   as a Vercel custom domain). The refresh cookie is `SameSite=Lax`, which
   browsers only send same-site — a `*.vercel.app` host would silently lose
   silent refresh after the 15-minute access token expires. Only if a
   same-site host is impossible, set the `REFRESH_COOKIE_SAMESITE` secret to
   `None` (kept `Secure`); that is a deliberate cross-site trade-off.
3. Redeploy (push to `main`) so `.env.production` picks up both values.

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
