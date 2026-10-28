"""Cross-worker refresh behavior for DB-backed AI provider config."""

import time

from backend.ai_providers import AIProviderManager


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
