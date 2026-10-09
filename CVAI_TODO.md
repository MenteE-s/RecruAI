# CVAI — Feature Todo List

> **What "CVAI" means here:** it is *our internal name for the individual-profile
> capability set* — skill taxonomy, assessments, quizzes, guided projects, mock
> interviews. It is **not a separate product or service**. All of it ships inside
> RecruAI, on individual accounts, and it is switched on when an individual
> **subscribes**. A lapsed individual keeps the basics (profile, job search,
> basic matching) and loses CVAI.

Derived from the feature brain-dump. Grouped by track, ordered by dependency
(what must exist before what can be built on it).

## Progress

- [x] **A1. Skill taxonomy** — `backend/utils/skill_taxonomy.py` (137 skills,
      215 aliases, 13 categories, 4 proficiency levels) + `GET /api/skills/taxonomy`
      (`?q=` typeahead) and `POST /api/skills/resolve` (free text → canonical).
      45/45 checks green.
- [x] **A3. Skill-gap engine** — `backend/utils/skill_gap.py`, wired into
      `compare_candidate_with_job()` and the candidate-ranking rerank. Replaced
      three ways the keyword matcher inflated scores. 28/28 checks green.
- [x] **A2. Learner skill profile** — `skills` gains `skill_slug`, `evidence_source`,
      `evidence_detail`, `verified`, `last_assessed_at` (migration
      `c8d9e0f1a2b3`), backfilled from the taxonomy and normalized to Title-Case
      levels. Assessment results now write themselves onto the profile.
      See log.
- [x] **A4. Assessment/test engine** — `SkillQuestion` bank + `SkillAssessment`
      attempts, migration `a4b5c6d7e8f9`, endpoints for authoring, taking,
      grading and level history, plus `scripts/seed_skill_questions.py`
      (16 questions across 9 skills). 40/40 checks green, and the whole
      migration chain verified from an empty database.
- [ ] A5. Data consent + retention rules for assessment results and learner data.

---

## Track A — Data foundation (blocks Tracks B and C)

Everything downstream needs one honest answer to "what can this person already
do?" before any AI can plan, track, or recommend anything.

- [ ] **A1. Skill taxonomy** — ~~canonical skill list + levels, shared by people,
      jobs, courses, quizzes, projects~~ **DONE.** Shipped as a Python module
      rather than a table so it needs no migration (see log).
- [ ] A2. Learner skill profile — user's current skillset, self-declared and
      evidence-backed (from assessments, projects, experience).
- [ ] A3. Skill-gap engine — ~~compare a profile against a target role/job to
      produce the gap list the rest of the AI consumes~~ **DONE.**
      `backend/utils/skill_gap.py`, taxonomy-aware, wired into both existing
      call sites. See log for the three scoring bugs it removed.
- [ ] A4. Assessment/test engine — the diagnostic test that measures skill
      levels. This is the single biggest signal in the product; A2/A3 and all
      progress tracking are downstream of it.
- [ ] A5. Data consent + retention rules for assessment results and learner data.

## Track B — AI mentorship

The three sub-items from the dump. B2 is the product; B1/B3 are what make it
credible week to week.

- [ ] **B1. Planning** — given a goal role + current skillset + assessment
      results, produce a plan.
  - [ ] B1.1. Resource selection — which courses/docs/projects to assign.
  - [ ] B1.2. **Resource budget** — the plan must account for cost/time of the
            resources it recommends (free vs paid, hours per week, total to goal).
  - [ ] B1.3. Plan sequencing — order the steps, set target dates.
  - [ ] B1.4. Plan editing — user can override/re-plan, not a one-shot answer.
- [ ] **B2. Progress tracking** — measure movement against the plan.
  - [ ] B2.1. Milestone completion per plan step.
  - [ ] B2.2. Re-measure skill levels over time (same assessment, re-taken).
  - [ ] B2.3. Plan-vs-actual view; detect falling behind.
- [ ] **B3. Suggestions** — the "what should I do next" layer.
  - [ ] B3.1. Next-best-action from current gap + progress.
  - [ ] B3.2. Nudges/reminders when a plan goes stale.
  - [ ] B3.3. Suggestions must cite *why* (which gap, which evidence).

## Track C — Subscriber content (the paid tier)

Gated by subscription. Each item needs both the authoring/publishing pipeline
and the learner-facing experience — content without a way to create and maintain
it is the usual reason this track stalls.

- [ ] **C1. Quizzes**
  - [ ] C1.1. Question bank + authoring UI (who writes and maintains these).
  - [ ] C1.2. Skill tagging per question → feeds the gap engine (A3).
  - [ ] C1.3. Scoring + explanation feedback; results write to the skill profile.
- [ ] **C2. Guided projects**
  - [ ] C2.1. Project templates with steps, deliverables, and pass criteria.
  - [ ] C2.2. Submission + review/feedback loop.
  - [ ] C2.3. Completed projects as proof on the profile (feeds employer track D).
- [ ] **C3. Mock interviews**
  - [ ] C3.1. Interview format/steps (see `TODO.md` — greeting → role discussion →
        stack/experience/skills vs the job post → questions → goodbye).
  - [ ] C3.2. AI interviewer conduct + adaptive follow-ups.
  - [ ] C3.3. Post-interview feedback/scoring → writes to skill profile.
- [x] **E1b. Grant path + AI budget** (billing deliberately deferred) —
      `scripts/grant_subscription.py` and `backend/utils/ai_budget.py`.
      See log.
- [x] **E1c. 50k AI allowance for every account** — migration
      `b7c8d9e0f1a2` adds `users.token_allowance` (default 50000, existing rows
      backfilled), replacing the daily tier ceiling.
- [ ] **C4. Subscription gating** — the entitlement keys exist and the five
      assessment endpoints are gated. Still to do: gate the C-track content
      (quizzes/projects/mock interviews) when those land.
- [ ] C5. Content quality bar: minimum viable bank before launch for each of C1–C3.

## Track D — Real employer access

Independent track; benefits most from A (skill signal) and C2.3 (proof of work).

- [ ] D1. Employer/career-page onboarding for real companies (recruitAI pages exist;
      this is the "real" tier — verified, real openings).
- [ ] D2. Candidate↔job matching driven by the skill profile + assessments, not
      just keywords.
- [ ] D3. Applications/introductions through the platform.
- [ ] D4. Employer verification badge/trust signals.
- [ ] D5. Track outcomes: who got hired/interviewed — feeds back into the recommender.

## Track E — Cross-cutting (do these early, they get expensive later)

- [ ] E1. Billing/subscription integration (gates Track C).
- [ ] E2. AI cost control — mentorship, quizzes and mock interviews all consume
      LLM calls per user per session; per-tier budgets and rate limits.
- [ ] E3. Analytics: activation, plan completion, quiz→interview conversion.
- [ ] E4. Moderation/review for AI-generated plans and mock-interview feedback
      (wrong advice is worse than none).

---

## Suggested build order

1. **A1 → A4** (taxonomy, profile, gap, assessment) — nothing else is credible without it.
2. **B1** (planning, incl. resource budget) → **B2** (tracking) → **B3** (suggestions).
3. **C4 + E1** (gating/billing) then **C1 quizzes** — cheapest subscriber content,
   reuses A3/A4 scoring immediately.
4. **C2 guided projects**, then **C3 mock interviews** (both heavier on content + AI cost).
5. **D** once real skill evidence exists — employers pay for signal, not promises.

**MVP cut:** A1–A4 + B1 + B3 + C1 + C4 + E1/E2. That is: assess a user, produce a
budgeted plan, recommend the next action, let subscribers take quizzes, and keep
the LLM spend bounded.

---

## Open questions

- "Resource budget" — budget of the learner's *time/money*, or the AI compute
  budget per plan? Assumed both; needs a decision.
- Who authors the quiz bank, projects and interview scripts — in-house, or
  employer-supplied? Changes C1.1/C2.1 ownership. (Interim answer: authoring is
  gated to accounts that administer a page.)
- **A2 blocker:** commit or revert the untracked migration
  `backend/migrations/versions/48e75664236e_new_change.py` before adding any
  migration of ours.

---

## Progress log

### A2 — learner skill profile (done)

Migration `c8d9e0f1a2b3` adds to `skills`: `skill_slug`, `evidence_source`,
`evidence_detail`, `verified`, `last_assessed_at`. Then backfills in Python,
because mapping historical free text to canonical slugs cannot be done in SQL:

- `skill_slug` resolved through the taxonomy
- `level` normalized to canonical Title-Case (rows stored `expert`, `BEGINNER`, …)

The backfill was verified for real, not assumed: the dev DB had **zero** skill
rows, so the migration ran over an empty set. Reverted it, inserted five
legacy-shaped rows (`ReactJS`/`expert`, `node.js`/`advanced`, `Postgres`/
`intermediate`, `K8s`/`BEGINNER`, `Figma tokens`/no level), re-applied, and
confirmed 4/4 mappable skills resolved and normalized while `Figma tokens` kept
its name and was given **no invented slug and no invented level**. Refusing to
guess is the point — a wrong slug is worse than none.

**The payoff: an assessment now writes itself onto the profile.** Submitting an
attempt upserts the `skills` row — level, `evidence_source='assessment'`,
`verified`, `last_assessed_at`, and provenance JSON
(`assessment_id`, `score_percent`, `correct_count`, `total_questions`). That is
what finally connects A4 → A3 → B1: an assessment that only lived in
`/api/skills/levels` informed nothing.

- **The measured level replaces the claimed one.** Someone who claimed "Expert"
  and scores 55% now sees Intermediate; a retake is a fresh measurement, not a
  ratchet.
- **Upsert, not append** — one row per (user, slug), no duplicates.
- **A mixed assessment writes nothing back.** Its level applies to the whole
  paper, so attributing it to each skill covered would be a lie.

**Two security holes closed while adding the fields:**

1. `update_skill` was a mass-assign loop with `hasattr(skill, key)`. Adding the
   evidence columns would have let a client PUT `verified: true` and mark their
   own skill "verified by assessment" without sitting a test. Now an explicit
   allowlist (`CLIENT_SETTABLE_SKILL_FIELDS`), and the evidence fields are
   server-written only.
2. **A verified assessment level can no longer be hand-edited** (409). Retaking
   the assessment is the only way to change it.

**One pre-existing bug fixed:** neither `Skill` nor `SkillAssessment` cascaded on
user delete, so deleting an account with skills or attempts made SQLAlchemy null
out a NOT NULL foreign key and the delete died with an `IntegrityError`. Both now
`cascade="all, delete-orphan"`. Found by the test's own cleanup, which is a decent
argument for deleting your fixtures.

**Frontend:** `UserProfile.jsx` compared `skill.level === "expert"` (lowercase)
while the model comment said Title-Case — so normalizing levels would have made
every bar render grey. Now a `LEVEL_BAR_CLASS` map with a case-insensitive
lookup, plus a "Verified" badge driven by the new flag.

202 checks green across seven suites; frontend build compiles; full migration
chain re-verified on an empty database (49 tables at `c8d9e0f1a2b3`).

**Still open:** B1 (planning) is now unblocked — it can read real skill evidence.

### E1c — 50k AI allowance for every account

Migration `b7c8d9e0f1a2` adds `users.token_allowance` (integer, NOT NULL,
`server_default 50000`). Two halves, both needed:

- **the column default** → every account created from now on gets 50k
- **an explicit `UPDATE users`** → every existing account gets it too

The `UPDATE` is redundant on PostgreSQL (it backfills from the default) but is
stated explicitly rather than relying on that behaviour, and it keeps this
correct on backends that don't. Verified: 7/7 dev accounts at exactly 50000,
zero nulls, and the full chain on an empty database ends at
`b7c8d9e0f1a2` with the column default present.

**This replaced the daily tier ceiling from E1b**, not added alongside it. Two
ceilings would have been confusing to support ("daily limit" vs "allowance"),
and with no way to become a real paid subscriber the tier differences were
theoretical anyway. Enforcement is now simply `tokens_used < token_allowance`,
measured against the cumulative counter `User.track_token_usage` already
maintains — no per-call aggregate query.

The counter is read **fresh from the database** on every check, deliberately:
`track_token_usage` bumps it with raw SQL "to avoid session-mismatch issues",
which leaves an already-loaded ORM attribute stale. Trusting the in-memory
value would let one account blow through its whole allowance inside a single
session. There's a check for exactly that.

**No refill on a schedule.** `grant_subscription.py --tokens N` tops up;
`--reset-tokens` zeroes the counter and deliberately keeps the `token_usage`
rows, because those rows are the record of what was actually spent and deleting
them to unblock someone destroys the history that explains the block.

**What 50k actually buys:** the CVAI features built so far cost **zero**
tokens — taxonomy, gap engine and assessments are deterministic code, no LLM.
Only LLM-backed features spend: roughly 500–2,500 tokens per chat turn, so 50k
is about 25–100 short turns, or one to a few full mock interviews. Plenty for
testing everything currently built; thin for heavy mock-interview testing.
Bump it per account when someone runs out.

176 checks green across six suites.

### E1b — grant path + AI budget (billing deferred)

Billing is out of scope for the MVP, which does **not** make cost control
optional. Two pieces, both shipped.

**1. `scripts/grant_subscription.py`** — the only way to put an account into the
paid state, since `SubscriptionManager.upgrade_to_paid()` has no caller.
`--grant`, `--trial [--days N]`, `--revoke`, `--status` (bare `--email`),
`--list`, `--reset-ai-usage`. Prints before/after including the AI budget.

It is a script and not an endpoint on purpose: the model has **no admin role**
(`role` is only 'individual' or 'organization'), so an admin endpoint would
require inventing a role — a bigger decision than the MVP deserves. Worth
revisiting if staff need to grant from the app.

Both fields are always set together, because `is_subscription_active()` needs
`subscription_status == "active"` **and** `paid_plan is True`. Setting only one
produces an account that looks paid and gets 403'd everywhere, which reads as a
bug rather than a config error.

**2. `backend/utils/ai_budget.py`** — daily per-account token ceiling, checked in
`AIService.generate_response` **before** the provider call, so a refused turn
costs nothing.

Why this was not hypothetical: `User.can_schedule_interview()` applies **no
count limit to individuals** (organizations cap trial usage at 5). So a single
trial account could drive unbounded LLM traffic through interview chat. That is
a live exposure, not a future one.

- Limits by tier (paid 2M / trial 250k / default 50k tokens per UTC day), each
  overridable by `AI_DAILY_TOKEN_LIMIT_<TIER>`; `0` means unlimited.
- `AI_BUDGET_ENABLED=0` disables enforcement.
- Measured from the `token_usage` rows the AI service already writes — **no new
  column, no migration**.
- Org usage is charged to the org, not the individual admin, so one admin cannot
  exhaust a colleague's allowance.
- Enforced even outside `IS_PRODUCTION`, unlike the entitlement gate. An
  entitlement is a product decision; this is a bill.

Known limit, fine for MVP: a call already in flight can overshoot by one turn.

**What "no billing" actually means:** there is still no way for a user to become
a subscriber, so in practice every individual is trial-or-lapsed, and the 7-day
trial means CVAI locks everyone out on day 8 until someone runs the grant script.
That is a deliberate MVP shape, not an oversight.

24/24 checks green, including the grant script driven as a subprocess against a
throwaway account. 172 checks green across six suites.

### Entitlements — "subscribe to get CVAI" is now a real rule

`backend/utils/subscription.py` now defines the feature keys and the basic tier
in one place: `CVAI_SKILL_ASSESSMENT`, `CVAI_QUIZZES`, `CVAI_PROJECTS`,
`CVAI_MOCK_INTERVIEW`, and `BASIC_INDIVIDUAL_FEATURES`. `User.can_access_feature`
reads that list instead of its own hardcoded copy.

The rule: **paid unlocks everything, an unexpired trial unlocks everything (a
trial exists to demonstrate the paid thing), a lapsed account keeps the basics.**
No CVAI key is in the basic list — that is what makes "subscribe to get CVAI"
true rather than aspirational.

Gated: the five assessment endpoints. Deliberately **not** gated: the taxonomy
and resolve endpoints, because a lapsed user still has to be able to render and
edit the skill list on their profile. Question authoring keeps its separate
page-admin gate — it is not an individual-side feature.

Two things worth knowing, both learned the hard way:

- **`require_subscription` routes org admins through the ORGANISATION's
  entitlement.** User 30 owns a page, so testing "does an individual get CVAI"
  against that account silently tests the org. Any future entitlement test must
  use an account with `organization_id IS NULL` and no team membership.
- **The decorator is a no-op outside `IS_PRODUCTION`** (unchanged, deliberately
  left alone). So the gate is invisible in ordinary dev use — the checks flip
  `Config.IS_PRODUCTION` on to exercise the real path, and assert the bypass
  separately so it stays a known behaviour rather than an accident.

14/14 entitlement checks green, alongside 134 from the four feature suites.

**Still no way to become a subscriber.** There is no payment processor;
`SubscriptionManager.upgrade_to_paid()` is never called by any route. Until one
exists, "active + paid_plan" can only be set manually, so the paid path is
tested but unreachable in the product. That is the gap between "gated" and
"sellable".

### A4 — assessment engine (done)

**Shipped:** `skill_questions` + `skill_assessments` tables
(migration `a4b5c6d7e8f9`), `backend/api/profile/assessments.py`,
`scripts/seed_skill_questions.py`.

Endpoints: `POST/PUT/DELETE /api/skills/questions`, `POST /api/skills/assessments`,
`POST /api/skills/assessments/<id>/submit`, `GET /api/skills/assessments`,
`GET /api/skills/assessments/<id>`, `GET /api/skills/levels`.

Integrity properties, each pinned by a check:

- **`correct_index` never leaves the server before submit**, so a score cannot be
  forged client-side.
- **The attempt snapshots the graded content** — prompt, options, correct index,
  explanation. Ids alone were not enough: grading against the live row meant a
  question edited mid-attempt marked an answer wrong for content the user never
  saw. This was caught by the test suite, not by review.
- **Attempts are append-only.** B2.2 re-measures over time, which needs history.
- **Re-submitting is refused (409)**, not re-graded — otherwise a second payload
  could overwrite a recorded score.
- **Deleting a question retires it** (`is_active=False`) instead of removing the
  row, so ids in in-flight snapshots stay resolvable.
- **Other users cannot read an attempt** (403).

**Level scoring:** `level_for_score()` in `skill_taxonomy.py` — 90+ Expert,
70+ Advanced, 50+ Intermediate, else Beginner. The top band deliberately stops
short of requiring perfection so a small wrong-answer count doesn't read as
Expert and then disagree with the next retake. Below 50% is Beginner (evidence
the user cannot do this), **not** "unknown" — only a missing assessment is
unknown.

**Authoring is gated to accounts that administer a page**, provisional pending
the open product question about who authors content. Note this admits team
members of any org, not just the page owner.

**Not built, deliberately:** an attempt left `in_progress` forever accumulates.
`backend/scheduler.py` is the natural home for a job that abandons stale
attempts, and B2 will want it.

### Production-readiness pass (A1/A3/A4)

- Rate limits on all six new views, using the `api.<view_function>` convention;
  verified no "rate-limit target missing" warnings at startup.
- Input caps: `q` truncated to 80 chars, each resolved name to 120, 100 names per
  call — the resolver runs a ~350-alternative phrase matcher, so unbounded text
  was a DoS vector. Measured 0.2 ms on a 5000-char input.
- `search()` and `resolve()` precompute their lookup tables at import instead of
  rebuilding 137 entries per keystroke.
- **A latent fresh-database failure found and fixed:** committing
  `48e75664236e` exposed that it used a bare `DROP TABLE` on three tables the
  initial migration never created. On any fresh database (i.e. CI's
  from-scratch `flask db upgrade`) the chain died with `UndefinedTable`. Now
  `DROP TABLE IF EXISTS`. Verified by applying the whole chain to an empty
  database: 49 tables, stamped at head.
- Gotcha worth remembering: `config.py` calls `load_dotenv(..., override=True)`,
  so `backend/.env` beats an exported `DATABASE_URL`. Pointing a migration run
  at another database requires setting `Config.SQLALCHEMY_DATABASE_URI` after
  import, not the environment variable.

**Regression status:** 134 checks green across four suites (taxonomy 45, skill
gap 28, search 21, assessments 40).

### A3 — skill-gap engine (done)

**Shipped:** `backend/utils/skill_gap.py` (pure logic, no Flask/DB), wired into
`RecommendationSupervisor.compare_candidate_with_job()` and into the candidate
ranking rerank. Existing response keys are unchanged, so the frontend keeps
working; the response gains `level_gaps`, `missing_skill_details`,
`matched_skill_details`, `unclassified_requirements` and `candidate_skills`.

**Three scoring bugs it removed** — all inflated a candidate's score:

1. `if not req_keywords: matched.append(req)` — a requirement that produced no
   keywords was counted as **matched**. "Experience with R" passed for everyone.
2. `len(w) > 2` dropped short tokens, so `Go`, `R`, `C` and `C#` could never
   match anything.
3. `rs in cs or cs in rs` in the ranking rerank scored **"Go" as held for anyone
   listing "Google Cloud", "Django" or "MongoDB"**.

Plus a fourth: a compound requirement matched on a *single* keyword, so
"Kubernetes and Terraform" passed for someone who had only used Terraform.
Requirements are now split into one demand per skill, so partial credit shows
up as a partial gap rather than a pass.

**Two design calls worth knowing:**

- **Free-text descriptions no longer count as evidence.** Project and experience
  descriptions used to be added to the keyword bag, so writing "migrated off
  jQuery" in a paragraph registered as having jQuery. Only structured fields
  count now: skill rows, project technology lists, certification names, job
  titles, fields of study.
- **Unclassifiable requirements are excluded from the ratio and reported
  separately** instead of being silently counted as passes. "Must be a team
  player" cannot be scored, so it does not inflate anyone's match.

**New behaviour to be aware of:** a skill held below the demanded level is a
`level_gap`, not a `missing` — and not a match either. Someone with React at
*Advanced* against "Expert React" is now correctly short. **Scores will drop for
candidates who previously benefited from the substring and single-keyword
matches.** That is the point, but it will look like a regression in the UI.

`match_required_skills()` was extracted out of the ranking function so it could
be tested directly; the checks for it live with the rest in `test_skillgap.py`.

**Still open:** `recommend_candidates_for_job()` cannot be exercised end-to-end
without an embedded job (`JobEmbedding`) — the route returns 400 "embed the job
first" for any new posting. That path is verified at unit level only.

### A1 — skill taxonomy (done)

**Shipped:** `backend/utils/skill_taxonomy.py`, `backend/api/profile/skills_taxonomy.py`
(registered in `backend/api/profile/__init__.py`). No migration.

Decisions worth remembering:

- **Module, not a table.** It is reference data that changes with a release, not
  per-user data, and the migration chain is currently the riskiest part of this
  repo (see blocker below). `resolve()` still accepts free text, so nothing that
  ingests resumes or job posts is forced to use the catalog.
- **Levels are Title-Case**, matching `Language.proficiency_level`, the only
  existing scale. `Skill.level` is a dead column whose one consumer
  (`UserProfile.jsx`) compares *lowercase*, so `normalize_level()` accepts either
  and A2 should backfill stored rows through it.
- **`level_rank()` starts at 1, and 0 means "unknown"** — not "knows nothing".
  Those are different states and the gap engine must not confuse them.

**Three real bugs the invariant checks caught** (worth keeping in any future
taxonomy edit):

1. `github-actions` was an alias of `ci-cd` *and* its own skill, so
   `resolve("github actions")` returned the wrong skill.
2. `accounting` was an alias of `finance` *and* its own skill — same bug.
3. `tailwind` was an alias of both `tailwind-css` and `css-frameworks`. It
   resolved correctly only because the dict happened to be ordered that way.
   The suite now asserts no alias shadows another skill's slug, round-trips, or
   is claimed twice — the last one was order-dependent luck, not correctness.

**What already exists that changes the plan:**

- **A3 has a partial implementation to build on:** `compare_candidate_with_job()`
  in `backend/recommendations/tools/supervisor.py` already returns
  `missing_skills` and `skill_match_ratio`, but via loose keyword overlap against
  free-text `Post.requirements` — it matches on a single shared keyword. Read it
  before writing anything; `resolve()` is the natural upgrade path.
- `/in/coaching` (`CareerCoaching.jsx`) is a 100% hardcoded mockup with zero API
  calls. B replaces it wholesale, but keep its information architecture and the
  `"pro"` sidebar section.
- **The AI interviewer already works** (`POST /api/interviews/<id>/chat`) but
  generates questions live from a system prompt — there is no question bank
  (C1.1/C3.1 are the gap), and no interview-phase state machine, so the 5-step
  flow in `TODO.md` is still unbuilt.
- **No payment processor exists.** `SubscriptionManager.upgrade_to_paid()` is
  never called by any route; `@require_subscription()` is a no-op outside
  `IS_PRODUCTION`. C4/E1 has no seam that works today.
- **No test framework exists** — no `tests/`, no pytest, no CI test job. The
  checks for A1 are a runnable script (`test_taxonomy.py`), consistent with how
  this session has verified everything else. Establishing pytest is a separate
  call.

**Blocker for A2 (and any later track that needs a table):** migrations form a
strictly linear chain and CI enforces a single head. The current head is
`48e75664236e` — the untracked migration that drops the orphaned `job_alerts`,
`resumes` and `cv_optimizations` tables. A new migration has to point at it. So
that file must be committed (or downgraded and deleted) before A2, otherwise the
chain forks or CI fails.