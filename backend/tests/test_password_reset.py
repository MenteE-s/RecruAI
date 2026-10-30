"""P0-03 regression tests: password reset."""

from datetime import datetime

from backend.api.auth import password_reset as password_reset_module
from backend.api.auth.session import hash_refresh_token
from backend.extensions import db
from backend.models import RefreshToken, User


def _client_with_refresh_cookie(app, raw):
    client = app.test_client()
    client.set_cookie("refresh_token", raw, path="/api/auth")
    return client


def _login(client, email, password="TestPass123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def _request_code(monkeypatch, client, email):
    from backend.models import OutboxEvent

    monkeypatch.setattr(
        password_reset_module, "MIN_FORGOT_RESPONSE_SECONDS", 0
    )
    response = client.post("/api/auth/password/forgot", json={"email": email})
    assert response.status_code == 200
    # The email is queued, not sent: the worker delivers it with retries.
    event = (
        OutboxEvent.query.filter_by(type="email.send")
        .order_by(OutboxEvent.id.desc())
        .first()
    )
    assert event is not None
    assert event.payload["kind"] == "password_reset"
    assert event.payload["to_email"] == email
    code = event.payload["context"]["code"]
    assert len(code) == 6
    return code


def _password_changed_events():
    from backend.models import OutboxEvent

    return (
        OutboxEvent.query.filter_by(type="email.send")
        .filter(OutboxEvent.payload.op("->>")("kind") == "password_changed")
        .all()
    )


def test_unknown_email_gets_the_same_generic_response(
    monkeypatch, client
):
    monkeypatch.setattr(
        password_reset_module, "MIN_FORGOT_RESPONSE_SECONDS", 0
    )

    response = client.post(
        "/api/auth/password/forgot",
        json={"email": "nobody@example.com"},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == password_reset_module.GENERIC_FORGOT_MESSAGE
    assert User.query.filter_by(email="nobody@example.com").first() is None


def test_weak_password_does_not_consume_the_reset_code(
    monkeypatch, client, make_user
):
    user = make_user(email="reset@example.com")
    code = _request_code(monkeypatch, client, user.email)
    assert _password_changed_events() == []

    weak = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": code,
            "new_password": "short",
        },
    )
    assert weak.status_code == 400

    # The code is still valid after the password-strength rejection.
    good = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": code,
            "new_password": "NewPass456",
        },
    )
    assert good.status_code == 200


def test_reset_changes_password_and_revokes_every_existing_session(
    app, monkeypatch, client, make_user
):
    user = make_user(email="revoke-reset@example.com")
    login = _login(client, user.email)
    assert login.status_code == 200
    old_access = login.get_json()["access_token"]
    old_refresh = client.get_cookie("refresh_token", path="/api/auth").value
    old_version = user.token_version

    code = _request_code(monkeypatch, client, user.email)

    bad = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": "000000" if code != "000000" else "000001",
            "new_password": "NewPass456",
        },
    )
    assert bad.status_code == 400
    assert bad.get_json()["code"] == "invalid_reset_code"

    reset = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": code,
            "new_password": "NewPass456",
        },
    )
    assert reset.status_code == 200
    assert "Password reset" in reset.get_json()["message"]
    changed = _password_changed_events()
    assert len(changed) == 1
    assert changed[0].payload["to_email"] == user.email

    db.session.expire_all()
    refreshed_user = db.session.get(User, user.id)
    assert refreshed_user.check_password("NewPass456")
    assert not refreshed_user.check_password("TestPass123")
    assert refreshed_user.token_version == old_version + 1

    # Old access token is rejected by the token-version check.
    me = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_access}"}
    )
    assert me.status_code == 401

    # Old refresh token family is revoked.
    reused = _client_with_refresh_cookie(app, old_refresh).post("/api/auth/refresh")
    assert reused.status_code == 401
    assert reused.get_json()["code"] == "refresh_revoked"

    # The code is single-use.
    again = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": code,
            "new_password": "ThirdPass789",
        },
    )
    assert again.status_code == 400

    assert _login(client, user.email, "NewPass456").status_code == 200
    assert _login(client, user.email, "TestPass123").status_code == 401


def test_reset_verifies_an_unverified_account_and_clears_lockout(
    monkeypatch, client, make_user
):
    user = make_user(
        email="unverified-reset@example.com",
        verified=True,
        password="TestPass123",
    )
    for _ in range(5):
        assert _login(client, user.email, "WrongPass123").status_code == 401
    assert _login(client, user.email, "TestPass123").status_code == 423

    # Flip the flag after the lockout proof: the reset code proves mailbox
    # control and must also repair an account stuck pre-verification.
    user.email_verified = False
    user.email_verified_at = None
    db.session.commit()

    code = _request_code(monkeypatch, client, user.email)
    reset = client.post(
        "/api/auth/password/reset",
        json={
            "email": user.email,
            "code": code,
            "new_password": "NewPass456",
        },
    )
    assert reset.status_code == 200

    db.session.expire_all()
    refreshed = db.session.get(User, user.id)
    assert refreshed.email_verified is True
    assert refreshed.email_verified_at is not None
    assert refreshed.failed_login_attempts == 0
    assert refreshed.locked_until is None
    assert _login(client, user.email, "NewPass456").status_code == 200


def test_forgot_password_hides_the_resend_cooldown(
    monkeypatch, client, make_user
):
    user = make_user(email="cooldown@example.com")
    _request_code(monkeypatch, client, user.email)

    second = client.post(
        "/api/auth/password/forgot", json={"email": user.email}
    )
    assert second.status_code == 200
    assert second.get_json()["message"] == password_reset_module.GENERIC_FORGOT_MESSAGE


def test_reset_rows_are_hashed_not_stored_raw(
    monkeypatch, client, make_user
):
    user = make_user(email="hash-reset@example.com")
    code = _request_code(monkeypatch, client, user.email)
    assert (
        client.post(
            "/api/auth/password/reset",
            json={
                "email": user.email,
                "code": code,
                "new_password": "NewPass456",
            },
        ).status_code
        == 200
    )

    # OTP rows store only an HMAC, never the six digits.
    raw_rows = db.session.execute(
        db.text("SELECT code_hash FROM email_otps WHERE user_id = :uid"),
        {"uid": user.id},
    ).scalars().all()
    assert raw_rows
    assert code not in raw_rows
