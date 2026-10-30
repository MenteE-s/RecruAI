"""Mentorship plan route behavior at the API boundary."""

from backend.api.mentorship import routes as mentorship_routes


def _step(slug="python"):
    return {
        "skill_slug": slug,
        "title": "Python fundamentals",
        "description": "Build a foundation.",
        "target_level": "Intermediate",
        "resource_type": "course",
        "resource_name": "freeCodeCamp Python",
        "resource_url": None,
        "hours_estimate": 10,
        "cost": 0,
        "optional": False,
    }


def test_create_plan_persists_valid_steps(client, make_user, auth_headers, monkeypatch):
    user = make_user(email="planner@example.com")
    monkeypatch.setattr(
        mentorship_routes, "propose_targets", lambda *args, **kwargs: (["python"], True)
    )
    monkeypatch.setattr(
        mentorship_routes, "propose_steps", lambda *args, **kwargs: [_step()]
    )

    response = client.post(
        "/api/mentorship/plans",
        headers=auth_headers(user),
        json={"goal": "AI Engineer", "weekly_hours": 5},
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["plan"]["goal"] == "AI Engineer"
    assert body["plan"]["steps"][0]["skill_slug"] == "python"


def test_create_plan_reports_provider_failure_as_502(
    client, make_user, auth_headers, monkeypatch
):
    user = make_user(email="planner-fail@example.com")
    monkeypatch.setattr(
        mentorship_routes, "propose_targets", lambda *args, **kwargs: ([], False)
    )

    response = client.post(
        "/api/mentorship/plans",
        headers=auth_headers(user),
        json={"goal": "AI Engineer", "weekly_hours": 5},
    )

    assert response.status_code == 502
    body = response.get_json()
    assert body["error"] == "Could not identify the skills for this goal"
    assert body["ai_available"] is False
