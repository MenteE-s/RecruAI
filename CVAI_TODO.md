# CVAI — Feature Todo List

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
- [ ] **A2. Learner skill profile** — *blocked on a decision*: needs a migration,
      and the migration chain currently has an uncommitted head. See log.
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
- [ ] C4. Subscription gating + entitlements for C1–C3 (and B).
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
  employer-supplied? Changes C1.1/C2.1 ownership.
- Is CVAI a rename of RecruAI or a separate product? Affects whether Track D
  reuses the existing page/people/job models.
- **A2 blocker:** commit or revert the untracked migration
  `backend/migrations/versions/48e75664236e_new_change.py` before adding any
  migration of ours.

---

## Progress log

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