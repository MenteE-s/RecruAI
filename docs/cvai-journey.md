# CVAI — user journeys & workflows

How the product actually works, end to end. Written so you can read this while
work continues; the implementation lives behind each arrow.

**CVAI** is our internal name for the *individual-profile capability set*: skill
taxonomy, assessments, quizzes, mentorship. It ships inside RecruAI, on
individual accounts, and switches on when an individual subscribes. A lapsed
individual keeps profile, job search and basic matching, and loses CVAI.

Legend: ✅ built and verified · 🟡 built, unverified end-to-end (no browser pass yet) · ⛔ not built

---

## 1. The states an account can be in

Every path below runs through these, so they come first.

| State | How you get there | What you can do |
|---|---|---|
| **Trial** | sign up | everything, for 7 days |
| **Paid** | admin runs `grant_subscription.py --grant` | everything |
| **Lapsed** | trial ends, or `--revoke` | basics only → CVAI endpoints return 403 |
| **AI allowance spent** | 50,000 tokens used up | AI-backed features stop; assessments/quizzes are unaffected |

```
sign up → TRIAL (7d) ──day 8──> LAPSED ──admin grant──> PAID
             │                                            │
             └── AI allowance spent ── top up (--tokens N) ┘
```

Two things follow from this, and they are the only two hard stops a user will
hit today:

1. **Day 8 everyone loses CVAI.** No billing exists yet, so nothing renews a
   trial. This is deliberate for MVP, not an oversight.
2. **50k tokens covers roughly 25–100 chat turns.** Only LLM-backed features
   spend them — mentorship plans, skill suggestions. **Taxonomy, gap analysis,
   assessments and quizzes cost nothing**, so they stay available to anyone.

---

## 2. The individual learner — the main path

```
1. Sign up
      → trial starts, CVAI unlocked immediately
      → status: TRIAL ✅

2. Add skills on your profile
      → typed names resolve to canonical slugs
        "Postgres" → postgresql · "ReactJS" → react
      → stored as self-declared, NOT verified ✅

3. Open a job you are interested in
      → we compute your gap against its requirements
      → matched / missing / held-but-too-junior, per skill 🟡
      ⛔ no employer-side view of this yet

4. Take a skill assessment
      → POST /api/skills/assessments
      → questions served WITHOUT their answers ✅
      → you answer, submit ✅

5. You are graded on the server
      → correct_index never reaches your browser before you submit ✅
      → score → level (90+ Expert, 70+ Advanced, 50+ Intermediate) ✅

6. Your result lands on your profile as EVIDENCE
      → measured level REPLACES what you claimed ✅
      → Verified badge appears ✅
      → provenance stored (which assessment, what score) ✅

7. Build a mentorship plan
      → POST /api/mentorship/plans ✅
      → you give a goal and two budgets: hours/week + money 🟡
      → the model proposes steps ✅
      → THE SERVER ENFORCES THE BUDGET, not the model ✅
        money → optional steps dropped, dearest first
        hours → reported ("this is 9 weeks, not 6"), never silently enforced
      → you get an ordered plan with target dates ✅

8. Work the steps
      → mark each done / in progress / skipped ✅
      → a hand-edited level cannot overwrite a measured one ✅

9. See how you are doing
      → GET /api/mentorship/plans/<id>/progress ✅
      → % done vs % of time elapsed, projected finish date, overdue steps ✅
      → verdict: on track / behind / well behind / not started ✅

10. Ask "what next?"
      → GET /api/mentorship/suggestions ✅
      → ranked: urgent → high → normal → low ✅
      → EVERY suggestion states its reason ✅
        "you are 32 points behind the plan you started"
      → never a model guess — only what is already recorded 🟡

11. Come back weeks later and retake an assessment
      → level trend appears: improving / flat / declining ✅
      → trends compare first-to-last, so one bad afternoon is not a decline ✅
      → a genuine Advanced → Beginner regression IS reported ✅

12. Your gaps close
      → the plan reports itself stale and names the skill ✅
      → regenerate rebuilds it against current evidence ✅

13. Go quiet for 7 days
      → you are nudged once, with an opt-out 🟡
      → surface: currently shown in the suggestions payload
      → notification: written and tested, but NOT SENDING (scheduler disabled) ⛔

14. Find a job
      → your profile shows measured, verified skills
      → employer searches → matches on skills, not keywords 🟡
      ⛔ employer-side matching view not built
```

### The two branches worth knowing

**Free preview.** A lapsed individual can still take quizzes marked
`is_free_preview`. Being able to try one is the only way to decide whether to
subscribe — and a free preview never writes to your profile, so "free" costs
nothing measurable. ✅

**AI allowance runs out mid-plan.** Assessments, quizzes, progress tracking and
suggestions keep working, because none of them call the model. Only regenerating
or creating a plan needs tokens. ✅

---

## 3. Employer / recruiter

```
1. Employer creates a company page
      → individual account, admins it, page URL fixed at creation ✅

2. Page admin writes the job post with requirements
      → free text, e.g. "Strong Kubernetes and Terraform experience" ✅

3. Candidates are matched to the post
      → gap engine: taxonomy-aware, not keyword overlap ✅
      → level-aware: Advanced skill vs "Expert X" = a gap, not a pass ✅
      → free-text descriptions no longer count as evidence ✅
      ⛔ no employer-facing matching UI beyond existing pages

4. Employer views a candidate against a job
      → POST /api/recommendations/compare ✅
      → matched / missing / level gaps, each with its reason ✅
      → warns when job requirements could not be classified ✅

5. Employer contacts / interviews
      → existing interview flow (AI interviewer exists) 🟡
      ⛔ no question bank; questions are LLM-generated live from a prompt
```

## 4. Content author (page admin)

```
1. Author questions into the shared bank
      → POST /api/skills/questions ✅
      → each question tagged with a skill + the level it tests ✅
      → must explain itself — an explanation is expected ✅

2. Assemble a quiz from bank questions
      → ordered selection, pass mark, skills covered ✅
      → retired questions drop out of live quizzes ✅

3. Everything else is automatic
      → scoring, level mapping, profile write-back ✅
```

## 5. Support / admin

```
1. See an account's whole state
      → grant_subscription.py --email x@com ✅

2. Make someone a subscriber
      → --grant  (sets status AND paid_plan together) ✅

3. Give more AI budget
      → --tokens 200000 ✅

4. Unblock someone who hit the allowance
      → --reset-tokens  (keeps the usage history) ✅

5. Inspect expiry
      → scheduler job runs hourly ✅ but scheduler is DISABLED ⛔
```

---

## What is not built

| Gap | Consequence |
|---|---|
| **No billing** | Day 8, CVAI locks for everyone. Grants are manual. |
| **Scheduler disabled** | Stale-plan nudges never send; trial expiry never runs. |
| **No quiz authoring UI** | Quizzes are seeded by script or via the API. |
| **No browser pass** | Every endpoint is verified by script, but no page has been rendered end to end. |
| **Employer-side matching UI** | The gap engine is built and exposed; no employer screen uses it yet. |
| **Mock interviews (C3)** | An AI interviewer exists, but with no question bank and no phase state machine. |
| **Guided projects (C2)** | Nothing built. |
| **Plan editing (B1.4)** | Steps editable; budgets deliberately not — they shaped the steps. |

---

## The rules the code enforces

These are not conventions, they are invariants with tests:

- **The model never does arithmetic.** It proposes; the server disposes. Hours
  and costs are clamped, then summed in Python.
- **The model never invents a skill.** Only catalogued, in-scope skills survive.
- **The model never invents a URL.** No catalogue yet, so steps name their
  resource instead.
- **A measurement replaces a claim.** Retaking an assessment can lower a level.
- **A retake is history, not an overwrite.** Attempts are append-only.
- **Correct answers never reach the browser before you submit.**
- **Grading uses what was served**, not what the question row says now.
- **No invented slugs.** Uncatalogued text keeps its name and gets no slug.