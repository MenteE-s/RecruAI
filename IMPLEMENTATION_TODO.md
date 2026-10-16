# Production-ready individual workflow — implementation TODO

## Goal
Any individual can sign in, browse/apply to jobs, get real recommendations, prepare for interviews (coaching + mock), build guided projects, and subscribe to unlock CVAI. Code must be production-ready: no fabricated AI scores, no silent token-free AI, committed answers, working chat, enforced gating, and a real subscribe path.

## Status
- [x] Trial changed to 30 days (1 month) of full access for every new individual — `backend/models/user.py:233`
- [x] Subscription upgrade endpoint — `POST /api/subscription/upgrade`, `GET /api/subscription/status`, `POST /api/subscription/cancel`. Verified end-to-end.
- [x] Frontend subscription UI — CvaiOverview, CvaiQuizzes, CvaiProjects, CvaiInterviews all show subscription state + upgrade button when not subscribed.
- [x] Paid content hidden from unsubscribed users — locked quizzes/projects/interviews hidden behind "Subscribe to unlock" panels with upgrade CTA; free previews remain visible.
- [x] Job recommendations wired to UI — `JobDetails.jsx` calls `/api/recommendations/jobs` instead of faked client-side filtering.
- [x] Track C launch-scale content bank — 98 questions, 10 quizzes, 7 projects.
- [x] Gating verification — `scripts/check_gating.py` forces PRODUCTION=1 and asserts 16/16: lapsed users get 403 on all genuinely-gated endpoints; free previews and paid users work correctly.
- [x] Backend AI safety fixes — analysis no longer persists fabricated zero scores; AI failures return 503 instead of fake agent speech; analysis metered against user allowance.
- [x] Mock-interview fixes — answers committed before early/finished returns; questions added to asked_questions so they don't repeat.
- [x] Practice chat UI — PracticeRoom sends/receives messages; PracticeDashboard creates/schedules a session.
- [x] Job application status check — refuses applications to non-active posts.
- [x] Public job list — relationship filters no longer 500.
- [ ] Full user journey smoke test — sign-in → browse → apply → recommendation → interview chat → mock interview → coaching plan → guided project → subscribe (smoke covers API level; browser E2E still manual).
- [ ] Commit + push, verify frontend build + backend smoke pass. ← IN PROGRESS

## Blockers
- No payment processor; upgrade endpoint is self-service/manual-grant until billing exists (documented).

## Paid vs Free (what gets hidden when not subscribed)

**Free (always available, no subscription needed):**
- Profile management (add/edit skills, job search, basic matching)
- Free-preview quizzes (javascript-essentials, web-fundamentals — try before subscribing)
- Free-preview guided projects (expense-tracker-cli — try before subscribing)
- Past interview transcripts (re-read your own history)

**Paid (requires active subscription or within 1-month free trial):**
- Skill assessments (start + submit)
- Paid quizzes (react-in-practice, sql-and-databases, delivery-and-devops, python-fundamentals, apis-and-version-control, backend-basics, devops-security, react-advanced)
- Paid guided projects (rest-api-with-auth, react-dashboard, cli-task-runner, task-api, data-summary-report, ui-component-library)
- Mock interviews (start, answer, feedback)
- Mentorship plans (create, regenerate, progress, suggestions)

**Trial:**
- Every new individual gets 30 days of full paid access automatically.
- After trial ends: lapsed → basic plan only, must subscribe to regain paid features.
- No billing processor yet; `POST /api/subscription/upgrade` is the self-service substitute.
