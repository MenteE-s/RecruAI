"""Mentorship plan route behavior at the API boundary."""

from backend.api.mentorship import routes as mentorship_routes


def _step(slug="python", title="Python fundamentals", hours=10):
    return {
        "skill_slug": slug,
        "title": title,
        "description": "Build a foundation.",
        "target_level": "Intermediate",
        "resource_type": "course",
        "resource_name": "freeCodeCamp Python",
        "resource_url": None,
        "hours_estimate": hours,
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
    assert body["plan"]["target_weeks"] == 12
    assert body["plan"]["steps"][0]["skill_slug"] == "python"


def test_create_plan_defers_steps_beyond_the_starter_horizon(
    client, make_user, auth_headers, monkeypatch
):
    user = make_user(email="planner-horizon@example.com")
    monkeypatch.setattr(
        mentorship_routes, "propose_targets", lambda *args, **kwargs: (["python"], True)
    )
    monkeypatch.setattr(
        mentorship_routes,
        "propose_steps",
        lambda *args, **kwargs: [
            _step("python", "Python", 20),
            _step("sql", "SQL", 20),
            _step("docker", "Docker", 20),
            _step("aws", "AWS", 20),
        ],
    )

    response = client.post(
        "/api/mentorship/plans",
        headers=auth_headers(user),
        json={"goal": "AI Engineer", "weekly_hours": 5},
    )

    assert response.status_code == 201
    plan = response.get_json()["plan"]
    assert plan["target_weeks"] == 12
    assert plan["step_count"] == 3
    assert plan["deferred_step_count"] == 1
    assert plan["total_hours"] == 60
    assert plan["weeks"] == 12
    assert plan["full_total_hours"] == 80
    assert plan["full_weeks"] == 16
    assert plan["deferred_steps"][0]["title"] == "AWS"


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
