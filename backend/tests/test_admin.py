"""Admin endpoint regression tests: superadmin gate, plan management, outbox retry."""

from backend.extensions import db
from backend.models import OutboxEvent


def _superadmin(make_user):
    admin = make_user(email="root-admin@example.com")
    admin.is_superadmin = True
    db.session.commit()
    return admin


def test_admin_endpoints_require_superadmin(client, make_user, auth_headers):
    user = make_user(email="plain@example.com")
    headers = auth_headers(user)

    assert client.get("/api/admin/overview", headers=headers).status_code == 403
    assert client.get("/api/admin/users", headers=headers).status_code == 403
    assert client.get("/api/admin/organizations", headers=headers).status_code == 403
    assert client.get("/api/admin/outbox", headers=headers).status_code == 403
    assert client.patch("/api/admin/users/1", headers=headers, json={}).status_code == 403
    assert client.post("/api/admin/outbox/1/retry", headers=headers).status_code == 403
    assert client.get("/api/admin/overview").status_code == 401


def test_superadmin_can_list_and_update_plans(client, make_user, make_org, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    user = make_user(email="member@example.com")
    make_org()

    response = client.get("/api/admin/users?q=member", headers=headers)
    assert response.status_code == 200
    assert any(u["email"] == "member@example.com" for u in response.get_json()["data"])

    response = client.patch(
        f"/api/admin/users/{user.id}",
        headers=headers,
        json={"subscription_status": "active", "paid_plan": True, "token_allowance": 5000},
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["subscription_status"] == "active"
    assert body["paid_plan"] is True
    assert body["token_allowance"] == 5000

    response = client.patch(
        f"/api/admin/users/{user.id}", headers=headers, json={"token_allowance": -1}
    )
    assert response.status_code == 400

    response = client.get("/api/admin/organizations", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["pagination"]["total"] >= 1


def test_superadmin_can_manage_organization_entitlements(
    client, make_user, make_org, auth_headers
):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    org = make_org()

    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "org-pro",
            "name": "Organization Pro",
            "scope": "organization",
            "price_cents": 2000,
            "features": ["career_coaching"],
            "is_default": False,
            "is_active": True,
        },
    )
    assert response.status_code == 201

    response = client.patch(
        f"/api/admin/organizations/{org.id}",
        headers=headers,
        json={
            "plan": "org-pro",
            "feature_overrides": ["cvai_quizzes", "career_coaching"],
            "token_allowance": 7500,
        },
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["plan"] == "org-pro"
    assert body["feature_overrides"] == ["cvai_quizzes", "career_coaching"]
    assert body["token_allowance"] == 7500
    assert body["tokens_used"] == 0

    response = client.patch(
        f"/api/admin/organizations/{org.id}",
        headers=headers,
        json={"plan": "does-not-exist"},
    )
    assert response.status_code == 400

    response = client.patch(
        f"/api/admin/organizations/{org.id}",
        headers=headers,
        json={"token_allowance": -1},
    )
    assert response.status_code == 400


def test_superadmin_grant_has_self_and_last_admin_guards(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    other = make_user(email="other@example.com")

    # Cannot remove your own access.
    response = client.patch(
        f"/api/admin/users/{admin.id}", headers=headers, json={"is_superadmin": False}
    )
    assert response.status_code == 409

    # Cannot remove the only other... first grant, then last-admin blocks.
    assert client.patch(
        f"/api/admin/users/{other.id}", headers=headers, json={"is_superadmin": True}
    ).status_code == 200
    # Removing the other admin is fine (caller remains).
    assert client.patch(
        f"/api/admin/users/{other.id}", headers=headers, json={"is_superadmin": False}
    ).status_code == 200
    # Now removing yourself is still blocked (you would orphan the role).
    response = client.patch(
        f"/api/admin/users/{admin.id}", headers=headers, json={"is_superadmin": False}
    )
    assert response.status_code == 409


def test_superadmin_can_retry_dead_outbox_event(client, make_user, auth_headers, app):
    from backend.models.outbox_event import STATUS_DEAD, STATUS_PENDING
    from backend.utils import outbox as outbox_module

    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    with app.app_context():
        event = outbox_module.enqueue_email(
            outbox_module.EMAIL_OTP, "retry-me@example.com", {"code": "123456"}
        )
        event.status = STATUS_DEAD
        db.session.commit()
        event_id = event.id

    response = client.post(f"/api/admin/outbox/{event_id}/retry", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["status"] == STATUS_PENDING

    db.session.expire_all()
    assert db.session.get(OutboxEvent, event_id).status == STATUS_PENDING


def test_admin_overview_reports_counts(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    response = client.get("/api/admin/overview", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["users"]["total"] >= 1
    assert "scheduler_healthy" in body
    assert "outbox" in body


def test_plan_catalogue_is_an_editable_list_and_slug_is_scoped(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "solo",
            "name": "Solo",
            "scope": "individual",
            "price_cents": 900,
            "features": ["profile_management"],
            "is_default": True,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    individual = response.get_json()

    # The same slug is valid in the other scope; the unique key is (slug, scope).
    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "solo",
            "name": "Solo for teams",
            "scope": "organization",
            "price_cents": 1900,
            "features": ["job_posting"],
            "is_default": False,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    organization = response.get_json()
    assert individual["id"] != organization["id"]

    response = client.get("/api/admin/plans", headers=headers)
    assert response.status_code == 200
    rows = response.get_json()
    assert isinstance(rows, list)
    assert {row["slug"] for row in rows} == {"solo"}
    assert {row["scope"] for row in rows} == {"individual", "organization"}
    assert all(isinstance(row["features"], list) for row in rows)

    # A default plan cannot be deactivated or demoted without a replacement.
    response = client.patch(
        f"/api/admin/plans/{individual['id']}",
        headers=headers,
        json={"is_active": False},
    )
    assert response.status_code == 409
    response = client.patch(
        f"/api/admin/plans/{individual['id']}",
        headers=headers,
        json={"is_default": False},
    )
    assert response.status_code == 409

    # Assign the plan while it is active. Deleting it must stay refused even
    # after it is demoted and deactivated, until the account is migrated.
    response = client.patch(
        f"/api/admin/users/{admin.id}",
        headers=headers,
        json={"plan": "solo"},
    )
    assert response.status_code == 200
    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "solo-next",
            "name": "Solo next",
            "scope": "individual",
            "price_cents": 1200,
            "features": ["profile_management"],
            "is_default": True,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    response = client.patch(
        f"/api/admin/plans/{individual['id']}",
        headers=headers,
        json={"is_default": False, "is_active": False},
    )
    assert response.status_code == 200
    assert response.get_json()["is_default"] is False
    assert response.get_json()["is_active"] is False
    response = client.delete(
        f"/api/admin/plans/{individual['id']}",
        headers=headers,
    )
    assert response.status_code == 409

    # The same default guard applies to organization plans, and a default
    # plan cannot be created inactive.
    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "org-default",
            "name": "Organization default",
            "scope": "organization",
            "is_default": True,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    org_default = response.get_json()
    response = client.patch(
        f"/api/admin/plans/{org_default['id']}",
        headers=headers,
        json={"is_active": False},
    )
    assert response.status_code == 409
    response = client.post(
        "/api/admin/plans",
        headers=headers,
        json={
            "slug": "inactive-default",
            "name": "Inactive default",
            "scope": "organization",
            "is_default": True,
            "is_active": False,
        },
    )
    assert response.status_code == 400


def test_ai_provider_crud_masks_keys_and_keeps_one_active(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    secret = "groq-secret-key-123456"

    # A standby config may exist without a key; it just cannot be activated.
    response = client.post(
        "/api/admin/ai-providers",
        headers=headers,
        json={
            "kind": "llm",
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "is_active": False,
        },
    )
    assert response.status_code == 201
    standby = response.get_json()
    assert standby["has_api_key"] is False
    assert standby["api_key"] == ""

    response = client.post(
        "/api/admin/ai-providers",
        headers=headers,
        json={
            "kind": "llm",
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "is_active": True,
        },
    )
    assert response.status_code == 400

    response = client.post(
        "/api/admin/ai-providers",
        headers=headers,
        json={
            "kind": "llm",
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "api_key": secret,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    active = response.get_json()
    assert active["has_api_key"] is True
    assert active["api_key"] != secret
    assert active["api_key"].endswith(secret[-4:])

    response = client.get("/api/admin/ai-providers", headers=headers)
    assert response.status_code == 200
    rows = response.get_json()
    assert len(rows) == 2
    assert sum(1 for row in rows if row["is_active"]) == 1
    assert all(row["api_key"] != secret for row in rows)

    # Activating the standby without adding a key is rejected.
    response = client.patch(
        f"/api/admin/ai-providers/{standby['id']}",
        headers=headers,
        json={"is_active": True},
    )
    assert response.status_code == 400

    response = client.patch(
        f"/api/admin/ai-providers/{standby['id']}",
        headers=headers,
        json={"api_key": "new-secret-key", "is_active": True},
    )
    assert response.status_code == 200
    assert response.get_json()["api_key"] != "new-secret-key"

    response = client.get("/api/admin/ai-providers", headers=headers)
    rows = response.get_json()
    assert sum(1 for row in rows if row["is_active"]) == 1
    assert next(row for row in rows if row["id"] == active["id"])["is_active"] is False

    # The newly active row is protected; the now-inactive row can be deleted.
    response = client.delete(
        f"/api/admin/ai-providers/{standby['id']}", headers=headers
    )
    assert response.status_code == 409
    response = client.delete(
        f"/api/admin/ai-providers/{active['id']}", headers=headers
    )
    assert response.status_code == 200


def test_admin_ai_provider_test_endpoint_uses_active_config_info(
    client, make_user, auth_headers, monkeypatch
):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    class FakeManager:
        _initialized = False

        def get_provider_info(self):
            return {
                "llm_provider": "groq",
                "llm_model": "llama-test",
                "embedding_provider": "openai",
                "embedding_model": "text-embedding-3-small",
                "embedding_dimension": 1536,
                "rag_enabled": True,
            }

        def healthcheck(self):
            return {"llm": True, "embedding": True}

    monkeypatch.setattr(
        "backend.ai_providers.get_ai_provider_manager", lambda: FakeManager()
    )

    response = client.post("/api/admin/ai-providers/test", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["llm"] == "groq"
    assert body["llm_model"] == "llama-test"
    assert body["embedding"] == "openai"
    assert body["embedding_dimension"] == 1536
    assert body["health"] == {"llm": True, "embedding": True}
