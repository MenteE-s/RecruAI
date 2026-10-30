"""P1-06 regression tests: organization roles are enforced by the API."""

from backend.extensions import db
from backend.models import TeamMember

ROLES = ("Admin", "HR", "Manager", "Interviewer", "Viewer", "Employee")


def _membership(org, user, role):
    member = TeamMember(organization_id=org.id, user_id=user.id, role=role)
    db.session.add(member)
    db.session.commit()
    return member


def test_viewer_cannot_edit_org_or_invite(client, make_org, make_user, auth_headers):
    org = make_org()
    owner = make_user(role="organization", organization_id=org.id)
    viewer_user = make_user()
    _membership(org, viewer_user, "Viewer")
    headers = auth_headers(viewer_user)

    response = client.put(
        f"/api/organizations/{org.id}",
        headers=headers,
        json={"name": "Renamed Org"},
    )
    assert response.status_code == 403
    assert response.get_json()["code"] == "org_permission_denied"

    response = client.post(
        f"/api/organizations/{org.id}/invite",
        headers=headers,
        json={"email": "new@example.com", "role": "Viewer"},
    )
    assert response.status_code == 403


def test_admin_can_invite_and_edit_org(client, make_org, make_user, auth_headers):
    org = make_org()
    admin_user = make_user()
    _membership(org, admin_user, "Admin")
    headers = auth_headers(admin_user)

    response = client.put(
        f"/api/organizations/{org.id}",
        headers=headers,
        json={"description": "Updated description"},
    )
    assert response.status_code == 200

    response = client.post(
        f"/api/organizations/{org.id}/invite",
        headers=headers,
        json={"email": "new@example.com", "role": "Viewer"},
    )
    assert response.status_code in (200, 201, 502)


def test_last_admin_cannot_be_demoted_or_removed(client, make_org, make_user, auth_headers):
    org = make_org()
    admin_user = make_user()
    member = _membership(org, admin_user, "Admin")
    headers = auth_headers(admin_user)

    response = client.put(
        f"/api/organizations/{org.id}/team-members/{member.id}",
        headers=headers,
        json={"role": "Viewer"},
    )
    assert response.status_code == 409
    assert response.get_json()["code"] == "last_admin"

    response = client.delete(
        f"/api/organizations/{org.id}/team-members/{member.id}",
        headers=headers,
    )
    assert response.status_code == 409
    assert response.get_json()["code"] == "last_admin"


def test_hiring_roles_can_create_jobs_but_viewers_cannot(
    client, make_org, make_user, auth_headers
):
    org = make_org()

    for role in ("Admin", "HR", "Manager"):
        user = make_user()
        _membership(org, user, role)
        headers = auth_headers(user)
        response = client.post(
            "/api/posts",
            headers=headers,
            json={"organization_id": org.id, "title": f"Job for {role}"},
        )
        assert response.status_code == 201, (role, response.get_json())

    for role in ("Interviewer", "Viewer", "Employee"):
        user = make_user()
        _membership(org, user, role)
        headers = auth_headers(user)
        response = client.post(
            "/api/posts",
            headers=headers,
            json={"organization_id": org.id, "title": f"Job for {role}"},
        )
        assert response.status_code == 403, (role, response.get_json())


def test_viewer_cannot_manage_org_billing(client, make_org, make_user, auth_headers):
    org = make_org()
    viewer_user = make_user()
    _membership(org, viewer_user, "Viewer")
    headers = auth_headers(viewer_user)

    response = client.post(
        "/api/payment-methods",
        headers=headers,
        json={
            "organization_id": org.id,
            "brand": "Visa",
            "last4": "4242",
            "cardholder_name": "Viewer User",
            "exp_month": 12,
            "exp_year": 2030,
        },
    )
    assert response.status_code == 403


def test_viewer_can_read_analytics(client, make_org, make_user, auth_headers):
    org = make_org()
    viewer_user = make_user()
    _membership(org, viewer_user, "Viewer")
    headers = auth_headers(viewer_user)

    response = client.get(f"/api/analytics/overview?organization_id={org.id}", headers=headers)
    # analytics/overview is scoped by JWT caller, not query param; expect 200
    assert response.status_code == 200