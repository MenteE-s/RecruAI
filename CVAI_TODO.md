# CVAI — Feature Todo List

Derived from the feature brain-dump. Grouped by track, ordered by dependency
(what must exist before what can be built on it).

## Progress

- [x] **A1. Skill taxonomy** — `backend/utils/skill_taxonomy.py` (137 skills,
      215 aliases, 13 categories, 4 proficiency levels) + `GET /api/skills/taxonomy`
      (`?q=` typeahead) and `POST /api/skills/resolve` (free text → canonical).
      45/45 checks green. See the log at the bottom for what this unblocked and
      what it found.
- [ ] **A2. Learner skill profile** — *blocked on a decision*: needs a migration,
      and the migration chain currently has an uncommitted head. See log.
- [ ] A3. Skill-gap engine — extend the existing keyword-overlap logic in
      `recommendations/tools/supervisor.py` rather than writing a second one.
- [ ] A4. Assessment/test engine
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
- [ ] A3. Skill-gap engine — compare a profile against a target role/job to
      produce the gap list the rest of the AI consumes.
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