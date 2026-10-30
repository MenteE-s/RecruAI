"""Cross-worker refresh behavior for DB-backed AI provider config."""

import time
from types import SimpleNamespace

import pytest

from backend.ai_providers import (
    AIProviderManager,
    GroqLLMProvider,
    OpenAILLMProvider,
    OpenRouterLLMProvider,
)
from backend.utils import ai_provider_resolver


def test_manager_refreshes_after_ttl(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER_REFRESH_SECONDS", "60")
    manager = AIProviderManager()
    manager._initialized = True
    manager._initialized_at = time.monotonic() - 61

    manager._refresh_if_stale()

    assert manager._initialized is False


def test_manager_keeps_a_fresh_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER_REFRESH_SECONDS", "60")
    manager = AIProviderManager()
    manager._initialized = True
    manager._initialized_at = time.monotonic()

    manager._refresh_if_stale()

    assert manager._initialized is True


@pytest.mark.parametrize(
    ("provider", "expected"),
    [
        ("groq", GroqLLMProvider),
        ("openai", OpenAILLMProvider),
        ("openrouter", OpenRouterLLMProvider),
    ],
)
def test_resolver_constructs_every_supported_llm(monkeypatch, provider, expected):
    """The resolver imports all provider classes up front.

    A missing OpenRouterLLMProvider used to make every DB-backed LLM fail with
    ImportError, even when the active row was a Groq config. Constructing each
    supported provider here keeps that regression out of production.
    """
    cfg = SimpleNamespace(
        id=1,
        provider=provider,
        model="test-model",
        get_api_key=lambda: "test-key",
    )
    monkeypatch.setattr(ai_provider_resolver, "active_config", lambda kind: cfg)

    resolved = ai_provider_resolver.resolve_llm_provider()

    assert isinstance(resolved, expected)


def test_manager_builds_openrouter_from_env(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openrouter")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "test-model")
    manager = AIProviderManager()

    provider = manager._create_llm_provider()

    assert isinstance(provider, OpenRouterLLMProvider)
    assert provider.model == "test-model"


def test_openrouter_chat_parses_openai_compatible_response(monkeypatch):
    seen = {}

    class FakeResponse:
        ok = True

        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [{"message": {"content": "  hello  "}}],
                "usage": {"total_tokens": 42},
            }

    def fake_post(url, json, headers, timeout):
        seen.update(url=url, json=json, headers=headers, timeout=timeout)
        return FakeResponse()

    monkeypatch.setattr("backend.ai_providers.requests.post", fake_post)
    provider = OpenRouterLLMProvider("test-key", "test-model", timeout=7)

    result = provider.chat([{"role": "user", "content": "hi"}])

    assert result == "hello"
    assert seen["url"] == provider.API_URL
    assert seen["json"]["model"] == "test-model"
    assert seen["json"]["messages"] == [{"role": "user", "content": "hi"}]
    assert seen["json"]["reasoning"] == {"enabled": False}
    assert seen["headers"]["Authorization"] == "Bearer test-key"
    assert seen["timeout"] == 7
    assert provider.get_last_token_usage() == 42
