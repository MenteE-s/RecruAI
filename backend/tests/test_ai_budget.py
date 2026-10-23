"""P1-05 regression tests: atomic AI budget enforcement.

No provider is called over the network. The wrapper is exercised with a fake
provider so the reservation, actual-usage reconciliation, organization
attribution, and refusal path are all deterministic.
"""

from datetime import datetime

import pytest

from backend.ai_providers import BudgetedLLMProvider
from backend.extensions import db
from backend.models import Organization, TokenUsage, User
from backend.utils.ai_budget import (
    AIBudgetError,
    reset_token_usage,
    reserve_budget,
)


class FakeProvider:
    """Minimal LLM provider with a controllable reported token count."""

    default_params = {"max_tokens": 100}

    def __init__(self, tokens=123):
        self.model = "fake-model"
        self.tokens = tokens
        self.calls = 0
        self.last_params = None

    def chat(self, messages, params=None):
        self.calls += 1
        self.last_params = dict(params or {})
        return "fake answer"

    def generate(self, prompt, context=None, params=None):
        self.calls += 1
        self.last_params = dict(params or {})
        return "fake generation"

    def get_last_token_usage(self):
        return self.tokens

    def healthcheck(self):
        return True


def _wrapper(tokens=123):
    return BudgetedLLMProvider(FakeProvider(tokens=tokens))


def test_budget_reservation_is_atomic_per_account(make_user):
    user = make_user(email="budget-atomic@example.com")
    user.token_allowance = 100
    db.session.commit()

    first = reserve_budget(user, 60)
    assert first["reserved"] == 60

    with pytest.raises(AIBudgetError):
        reserve_budget(user, 60)

    db.session.expire_all()
    assert db.session.get(User, user.id).tokens_used == 60

    reset_token_usage(user)
    db.session.expire_all()
    assert db.session.get(User, user.id).tokens_used == 0


def test_wrapper_records_actual_usage_not_the_estimate(make_user):
    user = make_user(email="budget-actual@example.com")
    wrapper = _wrapper(tokens=123)

    result = wrapper.chat(
        [{"role": "user", "content": "hello"}],
        actor=user,
        operation_type="unit_test_chat",
    )

    assert result == "fake answer"
    assert wrapper.get_last_token_usage() == 123
    db.session.expire_all()
    assert db.session.get(User, user.id).tokens_used == 123

    usage = TokenUsage.query.filter_by(user_id=user.id).one()
    assert usage.tokens_used == 123
    assert usage.organization_id is None
    assert usage.operation_type == "unit_test_chat"


def test_organization_member_is_charged_to_the_organization(
    make_org, make_user
):
    org = make_org()
    user = make_user(role="organization", organization_id=org.id)
    wrapper = _wrapper(tokens=77)

    wrapper.chat(
        [{"role": "user", "content": "hello"}],
        actor=user,
        operation_type="unit_test_org",
    )

    db.session.expire_all()
    assert db.session.get(Organization, org.id).tokens_used == 77
    assert db.session.get(User, user.id).tokens_used == 0

    usage = TokenUsage.query.filter_by(organization_id=org.id).one()
    assert usage.user_id == user.id
    assert usage.tokens_used == 77


def test_exhausted_account_is_refused_before_the_provider_is_called(
    make_user,
):
    user = make_user(email="budget-exhausted@example.com")
    user.token_allowance = 5
    db.session.commit()
    provider = FakeProvider()
    wrapper = BudgetedLLMProvider(provider)

    with pytest.raises(AIBudgetError) as exc:
        wrapper.chat(
            [{"role": "user", "content": "a prompt that cannot fit"}],
            actor=user,
        )

    assert exc.value.code == "ai_budget_exhausted"
    assert provider.calls == 0
    assert TokenUsage.query.filter_by(user_id=user.id).count() == 0


def test_unattributed_call_fails_closed(monkeypatch):
    monkeypatch.setenv("AI_BUDGET_ENABLED", "1")
    wrapper = _wrapper()

    with pytest.raises(AIBudgetError) as exc:
        wrapper.chat([{"role": "user", "content": "hello"}])

    assert exc.value.code == "ai_unattributed"


def test_release_restores_the_reservation(make_user):
    user = make_user(email="budget-release@example.com")
    user.token_allowance = 1000
    db.session.commit()

    reservation = reserve_budget(user, 200)
    db.session.expire_all()
    assert db.session.get(User, user.id).tokens_used == 200

    from backend.utils.ai_budget import release_budget

    release_budget(user, reservation)
    db.session.expire_all()
    assert db.session.get(User, user.id).tokens_used == 0


def test_ai_service_re_raises_instead_of_returning_a_friendly_string(make_user):
    from backend.ai_service import AIService

    user = make_user(email="budget-service@example.com")
    user.token_allowance = 5
    db.session.commit()
    provider = FakeProvider()
    service = AIService()
    service.llm_provider = BudgetedLLMProvider(provider)

    with pytest.raises(AIBudgetError) as exc:
        service.generate_response(
            "You are a test assistant.", "a prompt too large for five tokens",
            user=user,
        )

    assert exc.value.code == "ai_budget_exhausted"
    assert provider.calls == 0


def test_budget_error_handler_returns_a_stable_402(
    app, client, monkeypatch
):
    rule = next(
        rule for rule in app.url_map.iter_rules()
        if rule.rule == "/api/users/me/export"
    )

    def raise_budget():
        raise AIBudgetError("No tokens remain.", code="ai_budget_exhausted")

    monkeypatch.setitem(app.view_functions, rule.endpoint, raise_budget)
    response = client.post("/api/users/me/export", json={})

    assert response.status_code == 402
    assert response.get_json() == {
        "error": "No tokens remain.",
        "code": "ai_budget_exhausted",
    }
