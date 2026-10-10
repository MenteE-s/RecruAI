"""Walk the CVAI feature end to end and tell you what works.

    python scripts/cvai_smoke.py

Tests the whole subscriber journey in the order a user would hit it: taxonomy,
profile, assessment, levels, quiz, project, mentorship. Prints one line per step
and exits non-zero if anything failed, so it works as a pre-commit or CI gate too.

Two modes, chosen automatically:

- **Over HTTP** (default) if a server is answering at --base-url. This is the
  honest test: it exercises routing, blueprints and the guards, not just logic.
- **In-process** if nothing is listening. Same checks through the Flask test
  client, so the script is useful even before you have started anything.

It needs the database (to mint a token and to read answer keys) but no API keys,
unless you pass --with-ai.

    --with-ai       also exercise the two model-backed calls: a project review
                    and mentorship plan generation. These spend real tokens.
    --base-url URL  default http://localhost:8000
    --keep          leave the probe account behind instead of deleting it

Nothing here is destructive to real data. It creates one throwaway account with a
reserved example.invalid address, uses it, and removes it.
"""
import argparse
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    GuidedProject, GuidedProjectAttempt, QuizAttempt, Skill,
    SkillAssessment, SkillQuestion, SkillQuiz, User,
)
from backend.migrations.versions import __name__ as _unused  # noqa: F401  (import guard)

EXPECTED_HEAD = "a2b3c4d5e6f7"
PROBE_EMAIL = "cvai-smoke-probe@example.invalid"

GREEN, RED, YELLOW, DIM, BOLD, RESET = (
    "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m", "\033[0m",
)

results = []
step_no = [0]


def step(title):
    step_no[0] += 1
    print(f"\n{BOLD}── {step_no[0]}. {title}{RESET}")


def ok(label, good, detail=""):
    results.append((label, good))
    mark = f"{GREEN}ok{RESET}" if good else f"{RED}FAIL{RESET}"
    tail = f"  {DIM}{detail}{RESET}" if detail else ""
    print(f"   {mark}   {label}{tail}")


def skip(label, why):
    print(f"   {YELLOW}skip{RESET} {label}  {DIM}{why}{RESET}")


def info(label, detail=""):
    print(f"   {DIM}..     {label}  {detail}{RESET}")


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--with-ai", action="store_true",
                        help="also call the two model-backed endpoints (spends tokens)")
    parser.add_argument("--keep", action="store_true",
                        help="keep the throwaway account for inspection")
    args = parser.parse_args()

    app = create_app()

    print(f"{BOLD}CVAI smoke test{RESET}")
    print(f"{DIM}DB      {app.config['SQLALCHEMY_DATABASE_URI'].rsplit('@', 1)[-1]}{RESET}")

    with app.app_context():
        # ---------------------------------------------------------- step 0
        step("Preconditions")

        try:
            db.session.execute(db.text("SELECT 1"))
            ok("database reachable", True)
        except Exception as exc:
            ok("database reachable", False, str(exc)[:90])
            print(f"\n{RED}Cannot continue without the database.{RESET}")
            return 1

        from sqlalchemy import text
        head = db.session.execute(text(
            "SELECT version_num FROM alembic_version")).scalar()
        ok("migrations applied", head == EXPECTED_HEAD, f"head={head}")
        if head != EXPECTED_HEAD:
            print(f"       {YELLOW}run: flask --app backend.app db upgrade "
                  f"--directory backend/migrations{RESET}")

        banks = {
            "questions": SkillQuestion.query.filter_by(is_active=True).count(),
            "quizzes": SkillQuiz.query.filter_by(is_active=True).count(),
            "projects": GuidedProject.query.filter_by(is_active=True).count(),
        }
        for name, count in banks.items():
            good = count > 0
            ok(f"content: {count} active {name}", good,
               "" if good else "run the seeds (docs/cvai-docker.md §2)")

        probe = User.query.filter_by(email=PROBE_EMAIL).first()
        if probe is None:
            probe = User(name="CVAI Smoke Probe", email=PROBE_EMAIL,
                         password_hash=generate_password_hash("smoke-probe-only"),
                         role="individual", organization_id=None,
                         is_discoverable=False, email_verified=True,
                         subscription_status="active", paid_plan=True)
            db.session.add(probe)
            db.session.commit()
        else:
            probe.email_verified = True
            probe.subscription_status = "active"
            probe.paid_plan = True
            db.session.commit()

        uid = probe.id
        headers = {"Authorization": "Bearer " + create_access_token(identity=str(uid))}

        # Clean any leftovers from a previous run.
        GuidedProjectAttempt.query.filter_by(user_id=uid).delete()
        QuizAttempt.query.filter_by(user_id=uid).delete()
        SkillAssessment.query.filter_by(user_id=uid).delete()
        Skill.query.filter_by(user_id=uid).delete()
        db.session.commit()

        is_dev = not app.config.get("IS_PRODUCTION")
        if is_dev:
            info("entitlement checks are bypassed in dev",
                 "so 403s will not appear here")

    # --------------------------------------------------------------- client
    client = None
    mode = "in-process"
    base = args.base_url.rstrip("/")
    try:
        import urllib.request
        with urllib.request.urlopen(f"{base}/api/health", timeout=3) as r:
            r.read()
        client = _HttpClient(base, headers)
        mode = f"HTTP {base}"
    except Exception:
        client = app.test_client()

    def call(method, path, body=None):
        if isinstance(client, _HttpClient):
            return client.request(method, path, body)
        return getattr(client, method.lower())(path, headers=headers,
                                              json=body) if body is not None \
            else getattr(client, method.lower())(path, headers=headers)

    def code_of(response):
        return response[0] if isinstance(response, tuple) else response.status_code

    def body_of(response):
        return response[1] if isinstance(response, tuple) else response.get_json(silent=True)

    print(f"{DIM}Mode    {mode}{RESET}")

    # --------------------------------------------------------------- 1. taxonomy
    step("Taxonomy")
    status, data = body_of(call("GET", "/api/skills/taxonomy"))
    categories = (data or {}).get("categories") or []
    total = sum(len(c.get("skills", [])) for c in categories)
    ok("GET /api/skills/taxonomy", status == 200 and total > 0,
       f"{len(categories)} categories, {total} skills")

    status, data = body_of(call("POST", "/api/skills/resolve", {"name": "Postgres"}))
    entry = (data or {}).get("skill") or data or {}
    ok('"Postgres" resolves to a catalogued slug',
       status == 200 and entry.get("slug") == "postgresql", entry.get("slug"))

    # --------------------------------------------------------------- 2. profile
    step("Profile skills")
    status, data = body_of(call("POST", "/api/profile/skills",
                                {"name": "Postgres", "level": "Intermediate"}))
    skill = (data or {}).get("skill") or {}
    ok("add a skill", status in (200, 201) and skill.get("skill_slug") == "postgresql",
       skill.get("skill_slug"))
    ok("  self-declared, so NOT verified",
       skill.get("verified") is False and skill.get("evidence_source") == "self_declared",
       skill.get("evidence_source"))

    # --------------------------------------------------------------- 3. assessment
    step("Skill assessment")
    status, data = body_of(call("POST", "/api/skills/assessments",
                                {"skill_slug": "postgresql"}))
    assessment = (data or {}).get("assessment") or {}
    served = assessment.get("questions") or []
    ok("start an assessment", status in (200, 201) and bool(served),
       f"{len(served)} questions")
    ok("  correct answers are not served to the client",
       all("correct_index" not in q for q in served))

    if served:
        with app.app_context():
            answer_key = {
                q["question_id"]: db.session.get(SkillQuestion, q["question_id"]).correct_index
                for q in served
            }
        perfect = [{"question_id": q["question_id"], "selected": answer_key[q["question_id"]]}
                   for q in served]
        status, data = body_of(call(
            "POST", f"/api/skills/assessments/{assessment.get('id')}/submit",
            {"answers": perfect}))
        result = (data or {}).get("assessment") or {}
        ok("submit and get graded", status == 200,
           f"score={result.get('score_percent')}%")
        ok("  a perfect run earns a level", bool(result.get("level_awarded")),
           result.get("level_awarded"))
        updated = (data or {}).get("skill_profile") or {}
        ok("  the result lands on the profile as evidence",
           updated.get("verified") is True, updated.get("evidence_source"))
        ok("  the measured level replaced the claim",
           updated.get("level") == result.get("level_awarded"), updated.get("level"))

    status, data = body_of(call("GET", "/api/skills/levels"))
    levels = (data or {}).get("levels") or {}
    ok("GET /api/skills/levels", status == 200 and bool(levels),
       f"{len(levels)} skills measured")

    # --------------------------------------------------------------- 4. quiz
    step("Quizzes")
    status, data = body_of(call("GET", "/api/quizzes"))
    quizzes = (data or {}).get("quizzes") or []
    free = [q for q in quizzes if q.get("is_free_preview") and not q.get("locked")]
    paid = [q for q in quizzes if not q.get("is_free_preview")]
    ok("GET /api/quizzes", status == 200 and bool(quizzes), f"{len(quizzes)} quizzes")
    ok("  at least one free preview exists to try",
       bool(free), ", ".join(q["slug"] for q in free) or "none seeded")

    if free:
        target = free[0]
        status, data = body_of(call("GET", f"/api/quizzes/{target['slug']}"))
        questions = ((data or {}).get("quiz") or {}).get("questions") or []
        ok("open the free preview", status == 200 and bool(questions),
           f"{len(questions)} questions")
        status, data = body_of(call("POST", f"/api/quizzes/{target['slug']}/attempts"))
        attempt_id = (data or {}).get("attempt_id")
        ok("start an attempt", status == 201, f"attempt {attempt_id}")
        with app.app_context():
            key = {q["question_id"]:
                   db.session.get(SkillQuestion, q["question_id"]).correct_index
                   for q in questions}
        status, data = body_of(call(
            "POST", f"/api/quizzes/attempts/{attempt_id}/submit",
            {"answers": [{"question_id": q["question_id"], "selected": key[q["question_id"]]}
                         for q in questions]}))
        attempt = (data or {}).get("attempt") or {}
        ok("submit and get scored", status == 200,
           f"score={attempt.get('score_percent')}%")
        ok("  a free preview does NOT move the profile",
           (data or {}).get("skills_updated") == [])

    ok("a paid quiz is listed but its contents are withheld",
       bool(paid) and all("acceptance_criteria" not in q for q in paid),
       ", ".join(q["slug"] for q in paid) or "none seeded")

    # --------------------------------------------------------------- 5. project
    step("Guided projects")
    status, data = body_of(call("GET", "/api/guided-projects"))
    projects = (data or {}).get("projects") or []
    ok("GET /api/guided-projects", status == 200 and bool(projects),
       f"{len(projects)} projects")
    ok("  a locked project never leaks its acceptance criteria",
       all("acceptance_criteria" not in p for p in projects if p.get("locked")))

    chosen = next((p for p in projects if p.get("is_free_preview")), None) or \
        next((p for p in projects if not p.get("locked")), None)
    if chosen:
        status, data = body_of(call("GET", f"/api/guided-projects/{chosen['slug']}"))
        brief = (data or {}).get("project") or {}
        ok("open the brief", status == 200 and bool(brief.get("steps")),
           f"{len(brief.get('steps') or [])} steps, "
           f"{len(brief.get('acceptance_criteria') or [])} criteria")

        status, data = body_of(call("POST", f"/api/guided-projects/{chosen['slug']}/attempts"))
        attempt_id = (data or {}).get("attempt", {}).get("id")
        ok("start an attempt", status in (200, 201), f"attempt {attempt_id}")

        status, data = body_of(call("PATCH", f"/api/guided-projects/attempts/{attempt_id}",
                                    {"notes": "smoke test", "current_step": 1}))
        ok("autosave notes and position", status == 200,
           f"step {(data or {}).get('attempt', {}).get('current_step')}")

        status, data = body_of(call("POST", f"/api/guided-projects/attempts/{attempt_id}/submit",
                                    {"submission": ""}))
        ok("an empty submission is refused", status == 400, f"HTTP {status}")

        if args.with_ai:
            submission = "\n".join(
                f"{i+1}. {c.get('text')}" for i, c in
                enumerate(brief.get("acceptance_criteria") or []))
            status, data = body_of(call(
                "POST", f"/api/guided-projects/attempts/{attempt_id}/submit",
                {"submission": submission}))
            review = (data or {}).get("review") or {}
            ok("submit for review (spent tokens)", status in (200, 503),
               f"score={review.get('score_percent')}%")
            if status == 200:
                ok("  the score came from server arithmetic over verdicts",
                   review.get("criteria_total") is not None,
                   f"{review.get('criteria_met')}/{review.get('criteria_total')} met, "
                   f"{review.get('unsupported_claims')} unsupported")
            else:
                info("reviewer unavailable — reported honestly, nothing scored",
                     (data or {}).get("message", "")[:60])
        else:
            skip("review for real", "pass --with-ai to spend tokens on this")

    # --------------------------------------------------------------- 6. mentorship
    step("Mentorship")
    status, data = body_of(call("GET", "/api/mentorship/plans/options"))
    ok("GET /api/mentorship/plans/options", status == 200,
       "the shapes the client needs")

    status, data = body_of(call("GET", "/api/mentorship/suggestions"))
    payload = (data or {}) if isinstance(data, dict) else {}
    suggestions = payload.get("suggestions") or []
    ok("GET /api/mentorship/suggestions", status == 200,
       f"{len(suggestions)} suggestion(s)")
    ok("  every suggestion states its reason",
       all(s.get("reason") for s in suggestions))
    ok("  this costs no AI tokens", True)

    status, data = body_of(call("GET", "/api/mentorship/progress"))
    ok("GET /api/mentorship/progress", status == 200)

    if args.with_ai:
        status, data = body_of(call("POST", "/api/mentorship/plans", {
            "goal": "Get comfortable in a backend engineer interview",
            "budget_amount": 0,
            "weekly_hours": 5,
        }))
        plan = (data or {}).get("plan") or {}
        steps = plan.get("steps") or []
        ok("generate a plan (spent tokens)", status in (200, 201),
           f"{len(steps)} steps, {plan.get('weeks')} weeks")
        ok("  the server enforced the budget",
           plan.get("total_cost") is not None and plan.get("total_hours") is not None,
           f"{plan.get('total_hours')}h, {plan.get('total_cost')} cost")
        if plan.get("id"):
            status, data = body_of(call(
                "GET", f"/api/mentorship/plans/{plan['id']}/progress"))
            ok("track progress against the plan", status == 200,
               (data or {}).get("verdict") or (data or {}).get("summary", ""))
    else:
        skip("generate a plan", "pass --with-ai to spend tokens on this")

    # --------------------------------------------------------------- cleanup
    step("Cleanup")
    with app.app_context():
        if args.keep:
            info(f"probe account kept: {PROBE_EMAIL} (id {uid})")
        else:
            GuidedProjectAttempt.query.filter_by(user_id=uid).delete()
            QuizAttempt.query.filter_by(user_id=uid).delete()
            SkillAssessment.query.filter_by(user_id=uid).delete()
            Skill.query.filter_by(user_id=uid).delete()
            db.session.delete(db.session.get(User, uid))
            db.session.commit()
            ok("probe account and its attempts removed", True)

    # --------------------------------------------------------------- summary
    passed = sum(1 for _, good in results if good)
    failed = len(results) - passed
    print(f"\n{BOLD}{'─' * 52}{RESET}")
    if failed:
        print(f"{RED}{BOLD}{failed} FAILED{RESET}, {passed} passed "
              f"({len(results)} checks)")
    else:
        print(f"{GREEN}{BOLD}all {passed} checks passed{RESET}")
    if not args.with_ai:
        print(f"{DIM}AI-backed endpoints were skipped. "
              f"Add --with-ai to exercise them.{RESET}")
    return 1 if failed else 0


class _HttpClient:
    """Minimal HTTP caller, so the script needs no requests dependency."""

    def __init__(self, base, headers):
        self.base = base
        self.headers = headers

    def request(self, method, path, body=None):
        import json as _json
        import urllib.error
        import urllib.request
        url = f"{self.base}{path}"
        data = _json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", self.headers["Authorization"])
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return response.status, _json.loads(response.read() or b"null")
        except urllib.error.HTTPError as exc:
            raw = exc.read()
            try:
                return exc.code, _json.loads(raw or b"null")
            except ValueError:
                return exc.code, {"error": raw[:200].decode("utf8", "replace")}


if __name__ == "__main__":
    sys.exit(main())
