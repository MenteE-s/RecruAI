"""The controlled beta has no self-service paid upgrade."""

from datetime import datetime, timedelta

from backend.extensions import db
from backend.models import User


def test_upgrade_is_closed_and_never_changes_the_account(
    client, make_user, auth_headers
):
    started = datetime.utcnow() - timedelta(days=60)
    user = make_user(
        email="expired-beta@example.com",
        subscription_status="expired",
        paid_plan=False,
        trial_start_date=started,
    )

    response = client.post(
        "/api/subscription/upgrade",
        json={"plan": "trial"},
        headers=auth_headers(user),
    )

    assert response.status_code == 410
    body = response.get_json()
    assert body["code"] == "billing_disabled"
    assert body["billing_enabled"] is False

    db.session.expire_all()
    unchanged = db.session.get(User, user.id)
    assert unchanged.subscription_status == "expired"
    assert unchanged.paid_plan is False
    assert unchanged.trial_start_date == started


def test_upgrade_requires_authentication(client):
    response = client.post("/api/subscription/upgrade", json={"plan": "paid"})
    assert response.status_code == 401
