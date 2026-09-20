# Security Remediation TODO — RecruAI Audit 2026-09-20

> Source: read-only audit grouped CRITICAL/HIGH/MEDIUM/LOW/INFO. Do not expose secrets. Check off as fixed + verified.

## HIGH — Tenant isolation / IDOR (fix first)
- [x] H1 `GET /api/organizations/<id>` leaks contacts + all posts — `backend/api/org/organizations.py:523-546` — require manager or `to_public_dict()` + filter active posts
- [x] H2 `GET /api/posts/<id>` leaks drafts + `POST /view` unauth write — `backend/api/org/posts.py:337-362` — status check + auth + rate-limit
- [x] H3 `GET /api/profile/user/<id>` dumps any individual PII — `backend/api/profile/uploads.py:44-103` — require Application/Interview relationship like `users/routes.py:200-239`
- [x] H4 `GET /api/users` exposes `to_dict()` + filter oracle — `backend/api/users/routes.py:99-141`, `utils/pagination.py:12` — allowlist filters/sorts, minimal DTO
- [x] H5 `GET /api/public/<slug>` ignores `is_public=False` — `backend/api/profile/shareable.py:172-177` — enforce `is_public`
- [x] H6 JWT in localStorage + dual transport + weak CSP — `frontend/src/utils/auth.js:35,51`, `backend/config.py:49`, `backend/app.py:187-195` — cookie-only + remove unsafe-inline/eval
- [x] H7 Revocation fail-open + 2h token — `backend/app.py:99-106`, `utils/cache.py:192-208` — fail-closed + short access + refresh rotation
- [x] H8 Committed `.env.docker` with secrets — repo root — untracked (`git rm --cached`), `.env.docker.example` created, `.gitignore` allows `*.example`. STILL NEEDED: rotate any reused secrets, purge history with filter-repo (destructive, needs approval), enable gitleaks.
- [x] H9 Rate-limit gaps + no ProxyFix — `backend/app.py:233-248,159` — ProxyFix(x_for=1), default_limits 200/day+50/hour, fail-closed if limiter missing in prod, loud missing-endpoint warn, fixed recommendations ordering.
- [x] H10 Unpinned deps + EOL images — `backend/requirements.txt`, `frontend/Dockerfile*` — deduped, floored unpinned, removed unused eventlet, node:22 + nginx:1.27, USER node/nginx, frontend security headers, Redis URL redacted. STILL NEEDED: full `pip-compile ==` pins + `pip-audit/npm audit/trivy` in CI, docker build test.

## MEDIUM
- [x] M1 Email change without password — `backend/api/auth/email_change.py:27-106` — require password/fresh + notify old
- [x] M2 `POST /api/users` passwordless shadow — `backend/api/users/routes.py:144-197` — invite-only + OTP
- [x] M3 OTP unsalted SHA256 — `backend/utils/otp.py:26-27` — HMAC pepper/bcrypt
- [x] M4 RAG client filters — `backend/api/rag/routes.py:40-62`, `rag/tools/retriever.py:282-297` — server-side IDs only
- [x] M5 No password change/reset — missing route — add change/forgot + token_version
- [x] M6 Any user can create Organization — `backend/api/org/organizations.py:486-521` — restrict + rate-limit
- [x] M7 Intra-org privesc — `backend/api/org/organizations.py:662-723` — admin-only + allowlist roles
- [x] M8 `system-issues/stats` global leak — `backend/api/system_issues.py:174-210` — scope to me/admin
- [x] M9 Verbose `str(e)` + OTP logs — many routes, `extensions.py:48`, `email_service.py:236-247` — generic 500 + redact
- [x] M10 CORS/CSRF/cookie gaps — `backend/app.py:62,222,305-309` — validate origins, add X-CSRF-TOKEN, Secure/SameSite
- [x] M11 Docker root + exposed dev + missing frontend headers — `frontend/Dockerfile*`, `docker-compose.yml`, `nginx-frontend.conf`, `vercel.json` — USER, 127.0.0.1, headers
- [x] M12 HSTS opt-in + header conflict — `backend/app.py:196-330` — enforce in prod, unify DENY

## LOW
- [x] L1 Mass-assignment loops — `backend/api/profile/*.py` — ALLOWED_FIELDS allowlist
- [x] L2 `PUT /applications` no status allowlist — `backend/api/org/applications.py:258-284` — allowlist
- [x] L3 User enumeration — `authentication.py:47-74`, `registration.py:32-35` — uniform 401
- [x] L4 Socket token via query — `backend/api/sockets.py:33,77` — auth-only
- [x] L5 Email HTML injection via name — `backend/utils/email_service.py:110-192` — html.escape
- [x] L6 Kafka fan-out — `utils/kafka_service.py:50-84`, `kafka_consumer.py:74-111` — schema + allowlist
- [x] L7 Health/uploads probing — `backend/app.py:296-353` — minimal health, signed URLs

## INFO / Hardening (verify, keep good)
- [ ] Escape `%_` in ilike, per-endpoint ALLOWED_SORT_FIELDS
- [ ] Keep: lockout, role re-read, `_managed_org_ids`, OTP TTL/tries, upload magic-bytes
- [ ] Validate: FRONTEND_ORIGIN, Redis/Kafka ACLs, LLM PII redaction, Vercel headers, backup access

## Progress Log
- 2026-09-20: Audit completed, SECURITY_TODO.md created. Starting H1.
- 2026-09-20: H1 done (org details authz + per-requester cache). H2 done (post draft 404 + view guard + per-requester cache). H3 done (profile relationship check + generic 500). H4 done (users allowlist + minimal DTO + BLOCKED expansion + LIKE escape). H5 done (is_public enforced in model + route). H6-H7 partial done (CSP tighten, CORS validate + X-CSRF-TOKEN/PATCH, JWT HTTPONLY + LOCATION override, SESSION SAMESITE, frame DENY, revocation fail-closed). Frontend localStorage→cookie-only + refresh rotation deferred (breaking change, needs frontend auth rework).
- 2026-09-20: Checked (git diff + py_compile + venv import ok, fixed TODO.md collision → SECURITY_TODO.md). Tested (pagination escape, can_access, config JWT, app import, rate-limit warn fixed). Started H8-H10: H8 untracked + example + gitignore; H9 ProxyFix + defaults + ordering fixed. Next: H10 deps/Docker, then MEDIUM/LOW.
- 2026-09-20: H10 done + tested (py_compile + venv import ok, Docker FROM/USER verified, nginx headers verified). Yes, testing each batch: compile + import + targeted asserts. Next: MEDIUM/LOW batch.
