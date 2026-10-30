"""Structured mentorship generation must not swallow budget refusals."""

import json

import pytest

from backend.mentorship import generator
from backend.utils.ai_budget import AIBudgetError
from backend.utils.mentorship_planner import enforce_budget, validate_proposed_steps
from backend.utils.skill_taxonomy import SKILLS


def test_propose_steps_reraises_budget_error(monkeypatch):
    class FakeService:
        def generate_response(self, *args, **kwargs):
            raise AIBudgetError("No tokens remain.", code="ai_budget_exhausted")

    monkeypatch.setattr(generator, "AIService", lambda: FakeService())
    gaps = [{
        "slug": "python",
        "name": "Python",
        "needed_level": "Intermediate",
        "state": "missing",
    }]

    with pytest.raises(AIBudgetError) as exc:
        generator.propose_steps(gaps, "AI Engineer", user=None, weekly_hours=5)

    assert exc.value.code == "ai_budget_exhausted"


def test_validate_proposed_steps_accepts_readable_gap_shape():
    gaps = [{
        "skill_slug": "python",
        "name": "Python",
        "needed_level": "Intermediate",
    }]
    proposed = [{
        "skill_slug": "python",
        "title": "Python fundamentals",
        "resource_type": "course",
        "hours_estimate": 10,
        "cost": 0,
    }]

    cleaned = validate_proposed_steps(proposed, gaps)

    assert len(cleaned) == 1
    assert cleaned[0]["skill_slug"] == "python"
    assert cleaned[0]["target_level"] == "Intermediate"


def test_propose_steps_keeps_valid_model_steps(monkeypatch):
    class FakeService:
        def generate_response(self, *args, **kwargs):
            return json.dumps({
                "steps": [{
                    "skill_slug": "python",
                    "title": "Python fundamentals",
                    "resource_type": "course",
                    "hours_estimate": 10,
                    "cost": 0,
                }]
            })

    monkeypatch.setattr(generator, "AIService", lambda: FakeService())
    gaps = [{
        "slug": "python",
        "name": "Python",
        "needed_level": "Intermediate",
        "state": "missing",
    }]

    steps = generator.propose_steps(gaps, "AI Engineer", user=None, weekly_hours=5)

    assert len(steps) == 1
    assert steps[0]["skill_slug"] == "python"
    assert steps[0]["title"] == "Python fundamentals"


def test_propose_steps_batches_large_gap_lists(monkeypatch):
    slugs = list(SKILLS.keys())[:12]
    chunks = [
        slugs[i:i + generator.STEP_BATCH_SIZE]
        for i in range(0, len(slugs), generator.STEP_BATCH_SIZE)
    ]
    responses = [
        json.dumps({
            "steps": [{
                "skill_slug": slug,
                "title": f"{SKILLS[slug]['name']} plan",
                "resource_type": "course",
                "hours_estimate": 10,
                "cost": 0,
            } for slug in chunk]
        })
        for chunk in chunks
    ]

    class FakeService:
        calls = 0

        def generate_response(self, *args, **kwargs):
            FakeService.calls += 1
            return responses.pop(0)

    monkeypatch.setattr(generator, "AIService", lambda: FakeService())
    gaps = [{
        "slug": slug,
        "name": SKILLS[slug]["name"],
        "needed_level": "Intermediate",
        "state": "missing",
    } for slug in slugs]

    steps = generator.propose_steps(gaps, "AI Engineer", user=None, weekly_hours=5)

    assert FakeService.calls == len(chunks)
    assert [step["skill_slug"] for step in steps] == slugs


def test_enforce_budget_moves_later_steps_to_full_path():
    steps = [{
        "skill_slug": f"skill-{i}",
        "title": f"Step {i}",
        "hours_estimate": 20,
        "cost": 0,
        "optional": False,
    } for i in range(1, 5)]

    kept, budget = enforce_budget(steps, 0, 5, target_weeks=12)

    assert [step["title"] for step in kept] == ["Step 1", "Step 2", "Step 3"]
    assert budget["total_hours"] == 60
    assert budget["weeks_needed"] == 12
    assert budget["dropped_count"] == 1
    assert budget["deferred_count"] == 1
    assert budget["dropped_steps"][0]["title"] == "Step 4"
    assert budget["within_time"] is True
