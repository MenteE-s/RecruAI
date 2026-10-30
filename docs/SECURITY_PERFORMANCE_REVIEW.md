# RecruAI — focused security & performance review

**Date:** 30 Oct 2026  
**Scope:** current `underdev` source tree; Flask API, React frontend, admin, uploads, search, CVAI plan path, deployment config.  
**Method:** source review plus local static/automated checks. No production probing, no external account access, no load test. This is not a full penetration test or a six-phase audit artifact run.

## Result

The existing 58/100 report is directionally right, but incomplete. The free beta is still viable with video off; **do not enable video until FR-01 is fixed**. Fix FR-02 through FR-04 before opening the beta beyond a trusted cohort.

Automated checks passed:

- `npm audit --omit=dev --audit-level=high` — frontend: **0 vulnerabilities**
- `npm audit --omit=dev --audit-level=high` — admin: **0 vulnerabilities**
- `pip-audit -r backend/requirements.txt --strict`: **no known vulnerabilities**
- Frontend Jest: **42 passed**
- Focused backend plan/provider/path tests: **15 passed**
- Frontend production build: **successful**
- Migration head: `c3d4e5f6a7b8`

## Findings

### FR-01 — Public upload route exposes interview recordings (High, conditional on video)

**Evidence**

- `backend/utils/livekit_service.py` writes recordings to
  `/recordings/recruai-interview-<id>.mp4`.
- `backend/api/interviews/video.py` stores the webhook result as
  `/uploads/recordings/<filename>`.
- `backend/app.py` serves **every** file under `backend/uploads` through
  `/uploads/<path:filename>` without authentication:

```python
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    resp = send_from_directory(os.path.join(here, 'uploads'), filename)
```

- `frontend/src/pages/InterviewDetail.jsx` loads `interview.recording_url`
  directly in a `<video>` element.

**Impact**

Anyone who knows or guesses
`/uploads/recordings/recruai-interview-<interview_id>.mp4` can download an
interview recording without signing in. The filename is deterministic from the
interview id, not an unguessable token.

**Why it is conditional**

`VIDEO_ENABLED=0` is the current default and the media profile is not active.
There may be no recording files yet. The exposure becomes live the moment video
and Egress are enabled.

**Smallest effective fix**

1. Immediately deny `recordings/` in the public `/uploads` route, or restrict
   that route to the known public image directories only.
2. Add an authenticated recording route (`JWT` + interview/org permission), or
   issue a short-lived signed URL after permission checks.
3. Update the frontend to fetch the recording through that route rather than
   placing the public path directly in `<video src>`.
4. Add tests: anonymous request → 401/404; unrelated user → 403; candidate/org
   manager → 200/206.

**Do not activate video until this is closed.**

---

### FR-02 — Public job/company payloads leak plan and subscription state (Medium)

**Evidence**

`Organization.to_public_dict()` is built by calling `to_dict()` and removing
only `contact_email` and `contact_name`:

```python
def to_public_dict(self):
    d = self.to_dict()
    d.pop("contact_email", None)
    d.pop("contact_name", None)
    return d
```

`Organization.to_dict()` still includes:

- `subscription_status` (including plan, trial dates, token/interview usage,
  remaining interviews, and accessible feature set)
- `plan`
- `feature_overrides`
- `created_at`
- `is_public`
- `show_public_stats`

`Post.to_dict()` exposes this as `organization_details`, and public job feeds
use it (`GET /api/posts`, post detail, organization page).

**Impact**

Any visitor can read a company’s plan, trial/subscription state, usage
counters, and feature override list from a public job post. This contradicts
the product rule that public surfaces must not expose plan or subscription
state. It is also commercial information a customer did not choose to publish.

**Fix**

Build a public-safe dict explicitly rather than removing two fields from the
internal dict. Remove at least `subscription_status`, `plan`,
`feature_overrides`, and internal counters. Add a regression test asserting the
public job/company payload excludes them.

---

### FR-03 — Private organization job posts remain publicly reachable (Medium)

**Evidence**

`search/routes.py` correctly filters jobs by `Organization.is_public`. The
public posts API does not:

- `backend/api/org/posts.py:list_posts()` filters only `Post.status == 'active'`.
- `list_posts_for_org()` returns active posts for any org id.
- `get_post()` / `get_post_by_slug()` do not reject a post whose organization
  is private.

**Impact**

Setting an organization page to private hides the company directory entry but
does not hide its open jobs. Anyone with an org id, slug, or job slug can still
read the job content and `organization_details`. This is inconsistent with the
search route and with the privacy expectation behind `is_public`.

**Fix**

For anonymous and non-manager callers, join/filter `Organization.is_public` in
the public posts list, org posts list, post detail, and by-slug route. Managers
retain access to their own private org. Add tests for private-org posts across
all four routes.

---

### FR-04 — Legacy shareable profile exposes organization ownership (Medium/Low privacy)

**Evidence**

- `User.to_public_dict()` includes `"organization": self.organization.name`.
- `GET /api/public/<slug>` returns `user.to_public_dict()`.
- `frontend/src/pages/PublicProfile.jsx` displays `user.organization`.

The newer `/in/:slug` route correctly omits organization ownership, but the
legacy `/:slug` shareable-profile path still leaks it.

**Impact**

A public shareable profile reveals which organization a person belongs to,
which the product explicitly says public profiles must not expose.

**Fix**

Remove `organization` from `User.to_public_dict()` or build the legacy public
payload from the same explicit allowlist as `slug_routes._public_user_payload`.
Add a test against `/api/public/<slug>`.

---

### FR-05 — URL fields accept non-HTTP schemes (Hardening; needs browser validation)

**Evidence**

`sanitize_input()` removes HTML tags but preserves arbitrary URL schemes:

```text
'javascript:alert(document.domain)' -> 'javascript:alert(document.domain)'
```

Several fields accept URLs without scheme validation:

- user `website` / `linkedin`
- project `github_url` / `demo_url`
- publication `publication_url`
- social-media `url`
- organization `website` / social links
- interview `meeting_link`

Several frontend components place these values directly in `href` (for example
`PublicProfile.jsx`, `UserProfile.jsx`, `TeamMemberProfile.jsx`, organization
`Profile.jsx`, `InterviewDetail.jsx`).

**Why this is labeled hardening, not confirmed XSS**

The production frontend has a strict CSP in `frontend/vercel.json` and
`frontend/nginx-frontend.conf` with `script-src 'self'`. That should block
`javascript:` execution in production. The CSP must be verified in a browser,
and any alternate frontend host without the CSP would reopen the issue.

**Fix**

- Backend: add `sanitize_url()` that allows only `http://` and `https://` (and
  deliberately selected `mailto:` where needed), then apply it to every
  user-controlled URL field.
- Frontend: add a single `safeExternalUrl()` helper and use it for all
  cross-user links; it should return `null` for non-http(s) values.
- Add regression tests for `javascript:`, `data:`, and protocol-relative URLs.

---

### FR-06 — Search has no trigram/full-text index strategy for 1M rows (Performance P1)

**Evidence**

- People/company search uses `%term%` `ILIKE` across name, headline, position,
  company, location, industry. No `pg_trgm` indexes exist in the migrations.
- Job search computes `to_tsvector(...)` and `ts_rank(...)` inline on every
  request; there is no generated `search_vector` column, GIN index, or
  `pg_trgm` index.
- `GET /api/posts?search=` does the same inline full-text calculation.

At small row counts this is invisible. At 1M users/posts it becomes a full scan
or a CPU-heavy expression evaluation on every search.

**Fix**

Add a migration for:

- `CREATE EXTENSION IF NOT EXISTS pg_trgm`
- GIN trigram indexes for the people/company `ILIKE` columns
- a maintained `posts.search_vector` (generated column or trigger) with a GIN
  index, and query that column instead of rebuilding `to_tsvector` inline

Validate with `EXPLAIN (ANALYZE, BUFFERS)` on a production-sized snapshot.

---

### FR-07 — Two N+1 paths in list endpoints (Performance P2)

**Search jobs**

`backend/api/search/routes.py` joins `Organization` but then accesses
`p.organization.name` / `p.organization.profile_image` per result without eager
loading the relationship. Up to 20 extra queries per search.

**Mentorship**

`MentorshipPlan.to_dict()` iterates `self.steps` for completion and hours.
`list_mentorship_plans`, `get_learner_progress`, and `get_mentorship_suggestions`
call it for up to 20–50 plans without `selectinload(MentorshipPlan.steps)`.
That is one or more queries per plan.

**Fix**

- Add `joinedload(Post.organization)` or `contains_eager` to the search query.
- Add `selectinload(MentorshipPlan.steps)` to the three mentorship queries.
- Add query-count regression tests using the existing
  `backend/tests/test_query_counts.py` harness.

---

### FR-08 — Public-profile analytics stores and shows raw visitor IPs (Privacy observation)

`GET /api/public/<slug>` writes raw `ip_address`, `user_agent`, and `referrer`
to `profile_analytics`. `GET /api/profiles/<slug>/analytics` returns those
fields, including the raw IP, to the profile owner. No retention purge for
`profile_analytics` was found in the scheduler.

Confirm this is covered by the privacy policy and consent model. If not, hash
or truncate the IP, avoid returning raw IP/UA to owners, and add a retention
job. This is a privacy/compliance risk, not a demonstrated cross-tenant access
bug.

### FR-09 — Bypassable sanitizer utility is unused (Low/informational)

`frontend/src/utils/performance.js:sanitizeHtml()` parses HTML into a detached
div, removes a small blacklist of tags/attributes, and returns `innerHTML`. It
allows many event attributes and is not a safe sanitizer. It currently has no
call sites. Remove it, or replace it with DOMPurify if rich HTML is ever needed.

## What already looks strong

- CORS is an explicit allow-list with credentials; wildcard is rejected.
- JWT access tokens are memory-only; refresh cookies are HttpOnly and rotation/
  replay tests pass.
- Admin routes re-read `is_superadmin`; no self-grant endpoint.
- AI provider keys are masked in API responses; resolver now constructs all
  supported providers; reasoning-model truncation is handled.
- Public slug profiles use an explicit allowlist and eager loading.
- Uploads use magic-byte validation and safe filenames for images.
- Security headers, CSP, HSTS, and edge rate limits are present in the deployed
  paths.
- Dependency audits are clean.

## Recommended fix order

1. **FR-01** before enabling video.
2. **FR-02, FR-03, FR-04** before broad beta invitations.
3. **FR-06, FR-07** before the 1M launch or any meaningful traffic test.
4. **FR-05** as hardening before the next frontend release.
5. **FR-09** whenever the unused utility is touched.

## Not verified here

- Live browser CSP behavior for `javascript:` links.
- Production Vercel/Nginx header behavior.
- S3/RDS backup restoration.
- Real 1M-row `EXPLAIN ANALYZE` plans.
- Live LiveKit recording access with a produced file.
- Full six-phase security-audit artifacts or external penetration test.
