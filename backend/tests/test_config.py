"""P1-13 regression tests: no duplicate config, fail-fast production config."""

import pytest

from backend.config import Config, validate_production_config


def _prod_env(**overrides):
    env = {
        "SECRET_KEY": "test-secret",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "DATABASE_URL": "postgresql+psycopg2://u:p@h:5432/db",
        "RESEND_API_KEY": "re_test",
        "GROQ_API_KEY": "gsk_test",
        "VIDEO_ENABLED": "0",
    }
    env.update(overrides)
    return env


def test_embedding_model_has_a_single_fallback_chain(monkeypatch):
    monkeypatch.setenv("AI_EMBEDDING_MODEL", "model-a")
    monkeypatch.delenv("EMBEDDING_MODEL", raising=False)
    assert Config().EMBEDDING_MODEL == "model-a"

    monkeypatch.delenv("AI_EMBEDDING_MODEL", raising=False)
    monkeypatch.setenv("EMBEDDING_MODEL", "model-b")
    assert Config().EMBEDDING_MODEL == "model-b"


def test_production_validation_passes_with_full_config():
    assert validate_production_config(_prod_env()) == []


def test_production_validation_rejects_dev_secrets():
    env = _prod_env(SECRET_KEY="dev-secret-change-in-production")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        validate_production_config(env)


def test_production_validation_requires_resend_and_an_ai_key():
    with pytest.raises(RuntimeError, match="RESEND_API_KEY"):
        validate_production_config(_prod_env(RESEND_API_KEY=""))
    with pytest.raises(RuntimeError, match="AI provider key"):
        validate_production_config(_prod_env(GROQ_API_KEY=""))


def test_production_validation_requires_livekit_only_when_video_enabled():
    warnings = validate_production_config(_prod_env())
    assert any("LIVEKIT" in w for w in warnings)

    with pytest.raises(RuntimeError, match="LIVEKIT_URL"):
        validate_production_config(_prod_env(VIDEO_ENABLED="1"))

    ok = _prod_env(
        VIDEO_ENABLED="1",
        LIVEKIT_URL="ws://livekit:7880",
        LIVEKIT_API_KEY="key",
        LIVEKIT_API_SECRET="secret",
    )
    assert validate_production_config(ok) == []
