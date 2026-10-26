"""P1-13 regression tests: no duplicate config, fail-fast production config."""

import pytest

from backend.config import Config, validate_production_config


def _prod_env(**overrides):
    env = {
        "SECRET_KEY": "test-secret",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "DATABASE_URL": "postgresql+psycopg2://u:p@h:5432/db",
        "RESEND_API_KEY": "re_test",
        "OPS_TOKEN": "test-ops-token",
        "GROQ_API_KEY": "gsk_test",
        "REDIS_ENABLED": True,
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


def test_production_validation_requires_shared_redis():
    with pytest.raises(RuntimeError, match="REDIS_ENABLED"):
        validate_production_config(_prod_env(REDIS_ENABLED=False))


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


def test_production_boot_fails_closed_without_redis():
    """IS_PRODUCTION + unreachable Redis must raise at boot, not warn."""
    from backend import create_app

    class ProdWithoutRedis:
        TESTING = True
        IS_PRODUCTION = True
        SECRET_KEY = "test-secret-key"
        JWT_SECRET_KEY = "test-jwt-secret"
        SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://u:p@h:5432/db"
        RESEND_API_KEY = "re_test"
        GROQ_API_KEY = "gsk_test"
        OPS_TOKEN = "test-ops-token"
        REDIS_ENABLED = True
        REDIS_URL = "redis://127.0.0.1:6390/0"
        RATELIMIT_ENABLED = False

    with pytest.raises(RuntimeError, match="Redis is required"):
        create_app(ProdWithoutRedis)


def test_nginx_template_has_edge_limits():
    from pathlib import Path

    template = (
        Path(__file__).resolve().parents[2] / "nginx" / "nginx.vps.conf.template"
    ).read_text(encoding="utf-8")
    for directive in (
        "limit_req_zone",
        "limit_conn_zone",
        "limit_req_status 429",
        "limit_conn_status 429",
        "limit_req zone=auth",
        "limit_req zone=ai",
        "client_max_body_size",
    ):
        assert directive in template, f"missing edge directive: {directive}"


def test_socketio_uses_redis_queue_when_enabled():
    """Cross-worker fan-out requires the Redis message queue (P2-09)."""
    from backend import create_app
    from backend.extensions import socketio

    class NoRedis:
        TESTING = True
        IS_PRODUCTION = False
        REDIS_ENABLED = False
        SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://u:p@h:5432/db"

    class WithRedis:
        TESTING = True
        IS_PRODUCTION = False
        REDIS_ENABLED = True
        REDIS_URL = "redis://127.0.0.1:6390/0"
        SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://u:p@h:5432/db"

    create_app(NoRedis)
    assert type(socketio.server.manager).__name__ == "Manager"
    create_app(WithRedis)
    assert type(socketio.server.manager).__name__ == "RedisManager"


def test_detailed_health_requires_ops_token(client):
    assert client.get("/api/health/detailed").status_code == 403
    assert (
        client.get(
            "/api/health/detailed", headers={"X-Ops-Token": "wrong"}
        ).status_code
        == 403
    )
    assert (
        client.get("/api/health").status_code == 200
    )  # liveness stays public
