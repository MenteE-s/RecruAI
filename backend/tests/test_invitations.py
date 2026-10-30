"""P0-04 regression tests: organization invitations.

The key property is that an invitation is not an account. Nothing is created
for the invitee until they prove control of the mailbox, and the raw token never
touches the database.
"""

from datetime import datetime, timedelta

from backend.api.invitations import routes as invitation_routes
from backend.api.org import organizations as org_routes
from backend.extensions import db
from backend.models import OrganizationInvitation, TeamMember, User
from backend.utils.invitations import hash_invitation_token


def _capture_invitation_emails(monkeypatch):
    """Capture queued invitation emails instead of sending them."""
    captured = []

    def fake_enqueue(kind, to_email, context=None, **kwargs):
        captured.append(
            {
                "email": to_email,
                "org_name": (context or {}).get("organization_name"),
                "inviter": (context or {}).get("inviter_name"),
                "role": (context or {}).get("role"),
                "token": (context or {}).get("token"),
                "ttl": (context or {}).get("expires_days"),
            }
        )
        return None

    monkeypatch.setattr(org_routes, "enqueue_email", fake_enqueue)
    return captured


def _noop_enqueue(monkeypatch):
    """Swallow welcome-email queueing on the accept path."""
    monkeypatch.setattr(
        invitation_routes, "enqueue_email", lambda *a, **k: None
    )


def _invite(client, headers, org, email, role="Member"):
    return client.post(
        f"/api/organizations/{org.id}/invite",
        headers=headers,
        json={"email": email, "role": role},
    )


def test_invitation_does_not_create_an_account_or_store_a_raw_token(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    sent = _capture_invitation_emails(monkeypatch)
    _noop_enqueue(monkeypatch)

    response = _invite(
        client, auth_headers(admin), org, "invitee@example.com"
    )

    assert response.status_code == 201
    assert sent[0]["email"] == "invitee@example.com"
    raw_token = sent[0]["token"]

    invitation = OrganizationInvitation.query.filter_by(
        email="invitee@example.com"
    ).one()
    assert invitation.token_hash == hash_invitation_token(raw_token)
    assert invitation.token_hash != raw_token
    assert raw_token not in (invitation.token_hash or "")
    # Legacy "Member" input is stored and accepted as the canonical role.
    assert invitation.role == "Interviewer"
    assert User.query.filter_by(email="invitee@example.com").first() is None
    assert TeamMember.query.count() == 0

    public = client.get(f"/api/invitations/{raw_token}")
    assert public.status_code == 200
    body = public.get_json()
    assert body["invitation"]["organization"]["id"] == org.id
    assert body["account_exists"] is False
    assert body["requires_sign_in"] is False
    assert body["can_set_password"] is True

    accepted = client.post(
        f"/api/invitations/{raw_token}/accept",
        json={"name": "Invitee Person", "password": "NewPass456"},
    )
    assert accepted.status_code == 200
    accepted_body = accepted.get_json()
    assert accepted_body["auto_login"] is True
    assert accepted_body["created_user"] is True
    assert accepted_body["access_token"]
    assert client.get_cookie("refresh_token", path="/api/auth") is not None

    invitee = User.query.filter_by(email="invitee@example.com").one()
    assert invitee.email_verified is True
    assert invitee.organization_id == org.id
    assert invitee.check_password("NewPass456")
    assert TeamMember.query.filter_by(
        organization_id=org.id, user_id=invitee.id
    ).one().role == "Interviewer"

    db.session.refresh(invitation)
    assert invitation.accepted_by_id == invitee.id
    assert invitation.status == "accepted"

    replay = client.post(
        f"/api/invitations/{raw_token}/accept",
        json={"name": "Invitee Person", "password": "NewPass456"},
    )
    assert replay.status_code == 409
    assert replay.get_json()["code"] == "invitation_already_accepted"


def test_existing_verified_user_must_sign_in_to_accept(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    existing = make_user(email="existing@example.com", password="TestPass123")
    sent = _capture_invitation_emails(monkeypatch)
    _noop_enqueue(monkeypatch)

    assert _invite(client, auth_headers(admin), org, existing.email).status_code == 201
    token = sent[0]["token"]

    public = client.get(f"/api/invitations/{token}").get_json()
    assert public["account_exists"] is True
    assert public["requires_sign_in"] is True
    assert public["can_set_password"] is False

    # Proving mailbox control through the token is not enough to take over an
    # account that already has a password.
    no_auth = client.post(f"/api/invitations/{token}/accept", json={})
    assert no_auth.status_code == 401
    assert no_auth.get_json()["code"] == "sign_in_required"

    login = client.post(
        "/api/auth/login",
        json={"email": existing.email, "password": "TestPass123"},
    )
    assert login.status_code == 200
    access = login.get_json()["access_token"]

    accepted = client.post(
        f"/api/invitations/{token}/accept",
        headers={"Authorization": f"Bearer {access}"},
        json={},
    )
    assert accepted.status_code == 200
    body = accepted.get_json()
    assert body["created_user"] is False
    assert body["auto_login"] is False
    assert "access_token" not in body

    member = TeamMember.query.filter_by(
        organization_id=org.id, user_id=existing.id
    ).one()
    assert member.role == "Interviewer"
    db.session.refresh(existing)
    assert existing.email_verified is True
    assert existing.check_password("TestPass123")


def test_unverified_placeholder_can_reclaim_by_setting_a_password(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    placeholder = make_user(
        email="legacy@example.com",
        verified=False,
        password="OldPass123",
    )
    sent = _capture_invitation_emails(monkeypatch)
    _noop_enqueue(monkeypatch)

    assert _invite(client, auth_headers(admin), org, placeholder.email).status_code == 201
    token = sent[0]["token"]

    public = client.get(f"/api/invitations/{token}").get_json()
    assert public["account_unverified"] is True
    assert public["can_set_password"] is True

    accepted = client.post(
        f"/api/invitations/{token}/accept",
        json={"name": "Reclaimed Person", "password": "NewPass456"},
    )
    assert accepted.status_code == 200
    body = accepted.get_json()
    assert body["created_user"] is False
    assert body["auto_login"] is True
    assert body["access_token"]

    db.session.refresh(placeholder)
    assert placeholder.email_verified is True
    assert placeholder.name == "Reclaimed Person"
    assert placeholder.check_password("NewPass456")
    assert not placeholder.check_password("OldPass123")


def test_non_managers_cannot_invite_list_or_accept_someone_elses_invite(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    outsider = make_user(email="outsider@example.com")
    other = make_user(email="other@example.com", password="TestPass123")
    sent = _capture_invitation_emails(monkeypatch)

    assert _invite(client, auth_headers(outsider), org, "target@example.com").status_code == 403
    assert client.get(
        f"/api/organizations/{org.id}/invitations",
        headers=auth_headers(outsider),
    ).status_code == 403

    assert _invite(client, auth_headers(admin), org, "target@example.com").status_code == 201
    token = sent[0]["token"]

    login = client.post(
        "/api/auth/login",
        json={"email": other.email, "password": "TestPass123"},
    )
    assert login.status_code == 200
    wrong = client.post(
        f"/api/invitations/{token}/accept",
        headers={"Authorization": f"Bearer {login.get_json()['access_token']}"},
        json={},
    )
    assert wrong.status_code == 403
    assert wrong.get_json()["code"] == "wrong_account"
    assert User.query.filter_by(email="target@example.com").first() is None


def test_resend_rotates_the_token_and_invalidates_the_old_link(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    sent = _capture_invitation_emails(monkeypatch)
    _noop_enqueue(monkeypatch)

    first = _invite(client, auth_headers(admin), org, "rotate-invite@example.com")
    assert first.status_code == 201
    first_token = sent[0]["token"]
    invitation = OrganizationInvitation.query.filter_by(
        email="rotate-invite@example.com"
    ).one()

    # The cooldown is real; move the last-sent timestamp past it instead of
    # sleeping in the test.
    invitation.last_sent_at = datetime.utcnow() - timedelta(seconds=61)
    db.session.commit()

    resent = client.post(
        f"/api/organizations/{org.id}/invitations/{invitation.id}/resend",
        headers=auth_headers(admin),
    )
    assert resent.status_code == 200
    second_token = sent[1]["token"]
    assert second_token != first_token

    old_link = client.get(f"/api/invitations/{first_token}")
    assert old_link.status_code == 404
    new_link = client.get(f"/api/invitations/{second_token}")
    assert new_link.status_code == 200


def test_invitation_creation_has_a_resend_cooldown(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    _capture_invitation_emails(monkeypatch)

    assert _invite(client, auth_headers(admin), org, "cooldown-invite@example.com").status_code == 201
    second = _invite(
        client, auth_headers(admin), org, "cooldown-invite@example.com"
    )

    assert second.status_code == 429
    assert second.get_json()["retry_after"] > 0


def test_expired_invitation_is_rejected(
    monkeypatch, client, make_org, make_user, auth_headers
):
    org = make_org()
    admin = make_user(role="organization", organization_id=org.id)
    sent = _capture_invitation_emails(monkeypatch)

    assert _invite(client, auth_headers(admin), org, "expired-invite@example.com").status_code == 201
    token = sent[0]["token"]
    invitation = OrganizationInvitation.query.filter_by(
        email="expired-invite@example.com"
    ).one()
    invitation.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db.session.commit()

    response = client.get(f"/api/invitations/{token}")
    assert response.status_code == 410
    assert response.get_json()["code"] == "invitation_expired"
