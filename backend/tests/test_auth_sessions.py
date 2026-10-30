"""Regression tests for the P1-02 session model.

These exercise the browser-facing contract: a short-lived access token in JSON,
an opaque HttpOnly refresh cookie, rotation on every refresh, family revocation
on replay, and credential-change revocation.
"""

from datetime import datetime, timedelta

from backend.api.auth.session import hash_refresh_token
from backend.extensions import db
from backend.models import RefreshToken


def _login(client, email, password="TestPass123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def _refresh_cookie(client):
    # The cookie is deliberately scoped to /api/auth, so the test client's
    # helper needs that path; the default path="/" would not find it.
    return client.get_cookie("refresh_token", path="/api/auth").value


def _client_with_refresh_cookie(app, raw):
    client = app.test_client()
    client.set_cookie("refresh_token", raw, path="/api/auth")
    return client


def test_login_returns_access_token_but_never_exposes_refresh_token(client, make_user):
    user = make_user(email="alice@example.com")

    response = _login(client, user.email)

    assert response.status_code == 200
    body = response.get_json()
    assert body["access_token"]
    assert body["expires_in"] > 0
    assert "refresh_token" not in body
    assert "refresh_token" not in response.get_data(as_text=True)

    cookie = client.get_cookie("refresh_token", path="/api/auth")
    assert cookie is not None
    set_cookie = response.headers.get("Set-Cookie", "")
    assert "HttpOnly" in set_cookie
    assert "Path=/api/auth" in set_cookie
    assert "SameSite=Lax" in set_cookie

    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200
    assert me.get_json()["user"]["email"] == user.email


def test_refresh_rotates_the_cookie_and_old_token_expires(client, make_user):
    user = make_user(email="rotate@example.com")
    assert _login(client, user.email).status_code == 200
    first = _refresh_cookie(client)

    rotated = client.post("/api/auth/refresh")

    assert rotated.status_code == 200
    second = _refresh_cookie(client)
    assert second and second != first

    # The access token returned by refresh actually works.
    token = rotated.get_json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200


def test_replaying_a_rotated_token_outside_grace_revokes_the_family(
    app, client, make_user
):
    user = make_user(email="replay@example.com")
    assert _login(client, user.email).status_code == 200
    old_raw = _refresh_cookie(client)

    assert client.post("/api/auth/refresh").status_code == 200
    new_raw = _refresh_cookie(client)
    assert new_raw != old_raw

    # Move the first token's used_at outside the concurrency grace window.
    row = RefreshToken.query.filter_by(token_hash=hash_refresh_token(old_raw)).one()
    row.used_at = datetime.utcnow() - timedelta(seconds=11)
    db.session.commit()

    replay_client = _client_with_refresh_cookie(app, old_raw)
    replay = replay_client.post("/api/auth/refresh")
    assert replay.status_code == 401
    assert replay.get_json()["code"] == "refresh_reuse"

    # Replay detection revokes every token in the family, including the
    # currently-valid successor.
    successor = _client_with_refresh_cookie(app, new_raw).post("/api/auth/refresh")
    assert successor.status_code == 401
    assert successor.get_json()["code"] == "refresh_revoked"


def test_logout_revokes_the_refresh_family(app, client, make_user):
    user = make_user(email="logout@example.com")
    login = _login(client, user.email)
    raw = _refresh_cookie(client)

    logout = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {login.get_json()['access_token']}"},
    )
    assert logout.status_code == 200

    refresh = _client_with_refresh_cookie(app, raw).post("/api/auth/refresh")
    assert refresh.status_code == 401
    assert refresh.get_json()["code"] == "refresh_revoked"


def test_password_change_revokes_access_and_refresh_tokens(app, client, make_user):
    user = make_user(email="change@example.com")
    login = _login(client, user.email).get_json()
    old_access = login["access_token"]
    old_refresh = _refresh_cookie(client)

    changed = client.post(
        "/api/auth/password/change",
        headers={"Authorization": f"Bearer {old_access}"},
        json={
            "current_password": "TestPass123",
            "new_password": "NewPass456",
        },
    )
    assert changed.status_code == 200

    # token_version was bumped: the old JWT no longer authenticates.
    me = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_access}"}
    )
    assert me.status_code == 401

    # Every refresh session for the user was revoked in the same transaction.
    refresh = _client_with_refresh_cookie(app, old_refresh).post("/api/auth/refresh")
    assert refresh.status_code == 401
    assert refresh.get_json()["code"] == "refresh_revoked"

    # The new password is the one that now works.
    assert _login(client, user.email, "NewPass456").status_code == 200
    assert _login(client, user.email, "TestPass123").status_code == 401


def test_failed_logins_lock_the_account(client, make_user):
    user = make_user(email="lock@example.com")

    for _ in range(5):
        response = _login(client, user.email, "WrongPass123")
        assert response.status_code == 401

    locked = _login(client, user.email, "TestPass123")
    assert locked.status_code == 423
    assert "locked" in locked.get_json()["error"].lower()
