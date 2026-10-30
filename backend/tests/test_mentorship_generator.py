"""Structured mentorship generation must not swallow budget refusals."""

import pytest

from backend.mentorship import generator
from backend.utils.ai_budget import AIBudgetError


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
