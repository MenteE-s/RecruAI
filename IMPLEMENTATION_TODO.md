# Production-ready individual workflow — implementation TODO

## Goal
Any individual can sign in, browse/apply to jobs, get real recommendations, prepare for interviews (coaching + mock), build guided projects, and subscribe to unlock CVAI. Code must be production-ready: no fabricated AI scores, no silent token-free AI, committed answers, working chat, enforced gating, and a real subscribe path.

## Status
- [x] Subscription upgrade endpoint — `POST /api/subscription/upgrade` (self-service paid/trial grant), plus status/cancel. Verified end-to-end.
- [x] Frontend subscription UI — CvaiOverview shows subscription state + upgrade button when not subscribed.
- [x] Job recommendations wired to UI — `JobDetails.jsx` calls `/api/recommendations/jobs` instead of faked client-side filtering.
- [x] Track C launch-scale content bank — 98 questions, 10 quizzes, 7 projects.
- [x] Gating verification — `scripts/check_gating.py` forces PRODUCTION=1 and asserts 16/16: lapsed users get 403 on all genuinely-gated endpoints (assessments, paid quizzes, paid projects, mentorship plans, mock interviews); free previews and paid users work correctly.
- [x] Backend AI safety fixes — analysis no longer persists fabricated zero scores; AI failures return 503 instead of fake agent speech; analysis metered against user allowance.
- [x] Mock-interview fixes — answers committed before early/finished returns; questions added to asked_questions so they don't repeat.
- [x] Practice chat UI — PracticeRoom sends/receives messages; PracticeDashboard creates/schedules a session.
- [x] Job application status check — refuses applications to non-active posts.
- [x] Public job list — relationship filters no longer 500.
- [ ] Full user journey smoke test — sign-in → browse → apply → recommendation → interview chat → mock interview → coaching plan → guided project → subscribe (smoke covers API level; browser E2E still manual).
- [ ] Commit + push, verify frontend build + backend smoke pass.

## Blockers
- No payment processor; upgrade endpoint is self-service/manual-grant until billing exists (documented).
