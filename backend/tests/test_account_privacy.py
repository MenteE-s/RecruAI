"""P1-03 regression tests: account export, deletion, and purge.

The important properties are:

* re-authentication is required for both export and deletion;
* deletion is blocked while the caller is the last admin of an organization;
* the grace-period row is retained for support but the account stops working
  immediately;
* the hard purge removes every FK that points at the user and keeps only the
  non-PII audit row.
"""

from datetime import datetime, timedelta

from backend.extensions import db
from backend.models import (
    AccountDeletion,
    Interview,
    InterviewDecisionHistory,
    MentorshipPlan,
    MentorshipStep,
    Notification,
    RefreshToken,
    Skill,
    User,
)
from backend.utils.account_deletion import purge_account, purge_due_accounts


def _export(client, headers, password="TestPass123"):
    return client.post(
        "/api/users/me/export",
        headers=headers,
        json={"password": password},
    )


def _delete(client, headers, password="TestPass123", reason="test"):
    return client.delete(
        "/api/users/me",
        headers=headers,
        json={"password": password, "reason": reason},
    )


def test_export_requires_the_current_password_and_never_includes_secrets(
    client, make_user, auth_headers
):
    user = make_user(email="export@example.com")
    headers = auth_headers(user)

    rejected = _export(client, headers, password="WrongPass123")
    assert rejected.status_code == 403
    assert rejected.get_json()["code"] == "invalid_password"

    response = _export(client, headers)
    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"
    assert "attachment" in response.headers["Content-Disposition"]

    body = response.get_json()
    assert body["export_version"] == 1
    assert body["account"]["email"] == "export@example.com"
    assert "data" in body

    serialized = response.get_data(as_text=True).lower()
    for forbidden in (
        "password_hash",
        "token_hash",
        "code_hash",
        "refresh_token_hash",
        "token_version",
        "failed_login_attempts",
    ):
        assert forbidden not in serialized


def test_export_includes_rows_linked_through_plans_and_interviews(
    client, make_user, auth_headers
):
    user = make_user(email="indirect-export@example.com")
    interview = Interview(
        user_id=user.id,
        title="Export interview",
        scheduled_at=datetime.utcnow(),
        duration_minutes=60,
        status="completed",
    )
    plan = MentorshipPlan(user_id=user.id, goal="Become a data engineer")
    db.session.add_all([interview, plan])
    db.session.flush()
    db.session.add_all([
        InterviewDecisionHistory(
            interview_id=interview.id,
            round_number=1,
            decision="passed",
            feedback="Strong evidence",
        ),
        MentorshipStep(
            plan_id=plan.id,
            order_index=0,
            title="Build an ingestion pipeline",
        ),
    ])
    db.session.commit()

    response = _export(client, auth_headers(user))
    assert response.status_code == 200
    data = response.get_json()["data"]

    assert data["mentorship_steps"][0]["title"] == "Build an ingestion pipeline"
    assert data["interview_decision_history"][0]["decision"] == "passed"


def test_deletion_blocks_the_last_organization_admin(
    client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    response = _delete(client, auth_headers(admin))

    assert response.status_code == 409
    body = response.get_json()
    assert body["code"] == "last_org_admin"
    assert body["organizations"][0]["id"] == org.id

    db.session.expire_all()
    assert db.session.get(User, admin.id).deleted_at is None


def test_deletion_requires_password_and_revokes_sessions(
    client, make_user, auth_headers
):
    user = make_user(email="delete-me@example.com")
    headers = auth_headers(user)
    old_version = user.token_version

    refused = _delete(client, headers, password="WrongPass123")
    assert refused.status_code == 403

    # A real refresh session, so the test proves the deletion revoked it rather
    # than only bumping the access-token version.
    login = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "TestPass123"},
    )
    assert login.status_code == 200
    token = RefreshToken.query.filter_by(user_id=user.id).one()
    assert token.revoked_at is None

    response = _delete(client, headers)
    assert response.status_code == 202
    assert response.get_json()["code"] == "deletion_scheduled"

    db.session.expire_all()
    deleted = db.session.get(User, user.id)
    assert deleted.deleted_at is not None
    assert deleted.deletion_scheduled_for > datetime.utcnow()
    assert deleted.token_version == old_version + 1
    assert db.session.get(RefreshToken, token.id).revoked_at is not None

    # Every access token issued before the request is dead immediately.
    after = _export(client, headers)
    assert after.status_code == 401


def test_hard_purge_removes_owned_rows_and_keeps_the_audit(
    client, make_user
):
    user = make_user(email="purge-me@example.com")
    user_id = user.id
    db.session.add_all([
        Skill(user_id=user_id, name="Python"),
        Notification(
            user_id=user_id,
            type="account",
            title="Hello",
            message="A notification",
        ),
        Interview(
            user_id=user_id,
            title="Test interview",
            scheduled_at=datetime.utcnow() - timedelta(hours=3),
            duration_minutes=60,
            status="completed",
        ),
        RefreshToken(
            user_id=user_id,
            family_id="family",
            token_hash="a" * 64,
            expires_at=datetime.utcnow() + timedelta(days=1),
        ),
    ])
    db.session.commit()

    assert purge_account(user_id, force=True) == "purged"
    db.session.expunge_all()

    assert db.session.get(User, user_id) is None
    assert Skill.query.filter_by(user_id=user_id).count() == 0
    assert Notification.query.filter_by(user_id=user_id).count() == 0
    assert Interview.query.filter_by(user_id=user_id).count() == 0
    assert RefreshToken.query.filter_by(user_id=user_id).count() == 0

    audit = AccountDeletion.query.filter_by(user_id=user_id).one()
    assert audit.status == "purged"
    assert audit.purged_at is not None


def test_purge_due_accounts_only_takes_accounts_past_the_grace_period(
    make_user,
):
    due = make_user(email="due@example.com")
    due_id = due.id
    due.deleted_at = datetime.utcnow() - timedelta(days=31)
    due.deletion_scheduled_for = datetime.utcnow() - timedelta(days=1)
    not_due = make_user(email="not-due@example.com")
    not_due_id = not_due.id
    not_due.deleted_at = datetime.utcnow()
    not_due.deletion_scheduled_for = datetime.utcnow() + timedelta(days=30)
    db.session.commit()

    assert purge_due_accounts(batch_size=10) == 1
    db.session.expunge_all()
    assert db.session.get(User, due_id) is None
    assert db.session.get(User, not_due_id) is not None
