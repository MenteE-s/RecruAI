"""Verify subscription gating returns 403 for lapsed users in production mode.

Run with PRODUCTION=1 so entitlement checks are real (not dev-bypassed):

    set PRODUCTION=1
    python scripts/check_gating.py

Creates throwaway users, exercises the gated CVAI endpoints, and asserts:
- lapsed individual -> 403 on start/submit/review/list for each CVAI feature
- paid individual -> not 403 (gating passed)
"""
import os
import sys

# Force production BEFORE importing the app/config so IS_PRODUCTION is real.
os.environ["PRODUCTION"] = "1"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

from backend.app import create_app
from backend.extensions import db
from backend.models import User

# (feature, calls, expect_lapsed_blocked)
GATED = [
    ("cvai_skill_assessment", [("POST", "/api/skills/assessments",
                                {"skill_slug": "python"})], True),
    ("cvai_quizzes", [("POST", "/api/quizzes/react-in-practice/attempts",
                       None)], True),
    ("cvai_projects", [("POST", "/api/guided-projects/rest-api-with-auth/attempts",
                        None)], True),
    ("cvai_mentorship", [("POST", "/api/mentorship/plans",
                          {"goal": "x", "budget_amount": 0, "weekly_hours": 5})],
     True),
    ("cvai_mock_interview", [("POST", "/api/mock-interviews",
                              {"target_role": "python backend"})], True),
]
# Intentionally open to lapsed users: free previews and option metadata.
OPEN = [
    ("cvai_quizzes_free_preview",
     [("POST", "/api/quizzes/javascript-essentials/attempts", None)], False),
    ("cvai_projects_free_preview",
     [("POST", "/api/guided-projects/expense-tracker-cli/attempts", None)],
     False),
    ("cvai_mentorship_options_ungated",
     [("GET", "/api/mentorship/plans/options", None)], False),
]

results = []


def make_user(email, paid):
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(
            name="Gate Check",
            email=email,
            password_hash=generate_password_hash("x-only"),
            role="individual",
            organization_id=None,
            is_discoverable=False,
            email_verified=True,
            subscription_status="active" if paid else "expired",
            paid_plan=paid,
        )
        db.session.add(user)
        db.session.commit()
    else:
        user.subscription_status = "active" if paid else "expired"
        user.paid_plan = paid
        db.session.commit()
    return user.id, user.email


def main():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Seed the content needed for the endpoint calls.
        from backend.models import SkillQuiz, GuidedProject
        if SkillQuiz.query.filter_by(slug="javascript-essentials").first() is None:
            print("Seed content missing; run scripts/seed_quizzes.py and "
                  "scripts/seed_guided_projects.py first.")
            return 1
        if GuidedProject.query.filter_by(slug="expense-tracker-cli").first() is None:
            print("Seed content missing; run scripts/seed_guided_projects.py first.")
            return 1

        lapsed_id, _ = make_user("gating-lapsed@example.invalid", paid=False)
        paid_id, _ = make_user("gating-paid@example.invalid", paid=True)

        def headers_for(user_id):
            # Talisman force_https in production redirects plain HTTP; nginx sets
            # this header, so send it so the gating logic (not the redirect) is
            # what we are testing.
            return {
                "Authorization": "Bearer " + create_access_token(
                    identity=str(user_id)),
                "X-Forwarded-Proto": "https",
            }

        failures = 0
        for feature, calls, expect_blocked in GATED + OPEN:
            for method, path, body in calls:
                # Lapsed user -> 403 if gated, else not-403
                resp = getattr(client, method.lower())(
                    path,
                    headers=headers_for(lapsed_id),
                    json=body if body is not None else {},
                )
                lapsed_ok = (resp.status_code == 403) if expect_blocked \
                    else (resp.status_code != 403)
                results.append((f"lapsed {feature} {method} {path}",
                                lapsed_ok, f"got {resp.status_code}"))
                if not lapsed_ok:
                    failures += 1

                # Paid user -> expect NOT 403 (gating passed)
                resp2 = getattr(client, method.lower())(
                    path,
                    headers=headers_for(paid_id),
                    json=body if body is not None else {},
                )
                ok2 = resp2.status_code != 403
                results.append((f"paid {feature} {method} {path}",
                                ok2, f"got {resp2.status_code}"))
                if not ok2:
                    failures += 1

        # Cleanup dependent rows before deleting users.
        from backend.models import QuizAttempt, SkillAssessment, GuidedProjectAttempt, MockInterview, Skill
        for uid in (lapsed_id, paid_id):
            QuizAttempt.query.filter_by(user_id=uid).delete()
            SkillAssessment.query.filter_by(user_id=uid).delete()
            GuidedProjectAttempt.query.filter_by(user_id=uid).delete()
            MockInterview.query.filter_by(user_id=uid).delete()
            Skill.query.filter_by(user_id=uid).delete()
        User.query.filter_by(email="gating-lapsed@example.invalid").delete()
        User.query.filter_by(email="gating-paid@example.invalid").delete()
        db.session.commit()

    for label, ok, detail in results:
        print(f"  {'ok ' if ok else 'FAIL'} {label} ({detail})")
    print(f"\n{len(results)-failures}/{len(results)} gating checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
