from flask import current_app, jsonify

from .. import api_bp
from ...ai_providers import get_ai_provider_manager
from ...utils.kafka_service import KafkaService


def _check_database():
    try:
        from sqlalchemy import text
        from ...extensions import db

        db.session.execute(text("SELECT 1"))
        return {"healthy": True}
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


def _check_redis():
    if not current_app.config.get("REDIS_ENABLED", False):
        return {"healthy": True, "enabled": False}
    client = current_app.extensions.get("redis_client")
    if client is None:
        return {"healthy": False, "enabled": True, "error": "client not initialized"}
    try:
        client.ping()
        return {"healthy": True, "enabled": True}
    except Exception as exc:
        return {"healthy": False, "enabled": True, "error": str(exc)}


def _check_kafka():
    try:
        kafka = KafkaService()
        if kafka.producer is None:
            return {"healthy": False, "error": "producer not initialized"}
        metadata = kafka.producer.list_topics(timeout=2.0)
        return {
            "healthy": True,
            "brokers": len(getattr(metadata, "brokers", {}) or {}),
        }
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


def _check_ai_providers():
    try:
        manager = get_ai_provider_manager()
        health = manager.healthcheck()
        info = manager.get_provider_info()
        return {
            "healthy": bool(health.get("llm") or health.get("embedding")),
            "llm": {"provider": info.get("llm_provider"), "healthy": health.get("llm", False)},
            "embedding": {
                "provider": info.get("embedding_provider"),
                "healthy": health.get("embedding", False),
                "dimension": info.get("embedding_dimension"),
            },
            "rag_enabled": info.get("rag_enabled", False),
        }
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


def _check_scheduler():
    try:
        from ...scheduler import scheduler_health

        health = scheduler_health(current_app._get_current_object())
        return {"healthy": bool(health.get("healthy")), "jobs": health.get("jobs", {})}
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


def _overall(checks):
    # Database is required. Kafka/Redis/AI are reported but do not by themselves
    # make the process unready; scheduler is informational for the web process.
    return bool(checks.get("database", {}).get("healthy", False))


@api_bp.route("/health/scheduler", methods=["GET"])
def health_scheduler():
    """Fail when the dedicated scheduler worker has missed two cycles."""
    from ...scheduler import scheduler_health

    try:
        health = scheduler_health(current_app._get_current_object())
    except Exception as exc:
        current_app.logger.exception("scheduler health check failed")
        return jsonify({"healthy": False, "error": str(exc)}), 503
    return jsonify(health), (200 if health["healthy"] else 503)


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Liveness: the process can serve and reach the database."""
    database = _check_database()
    status_code = 200 if database["healthy"] else 503
    return jsonify({
        "status": "ok" if database["healthy"] else "degraded",
        "database": "healthy" if database["healthy"] else "unhealthy",
        "error": database.get("error"),
    }), status_code


@api_bp.route("/health/ready", methods=["GET"])
def health_ready():
    """Readiness: required dependencies are available."""
    checks = {
        "database": _check_database(),
        "redis": _check_redis(),
        "kafka": _check_kafka(),
        "ai_providers": _check_ai_providers(),
        "scheduler": _check_scheduler(),
    }
    healthy = _overall(checks)
    return jsonify({
        "status": "ok" if healthy else "degraded",
        "checks": checks,
    }), (200 if healthy else 503)


@api_bp.route("/health/detailed", methods=["GET"])
def health_detailed():
    checks = {
        "database": _check_database(),
        "redis": _check_redis(),
        "kafka": _check_kafka(),
        "ai_providers": _check_ai_providers(),
        "scheduler": _check_scheduler(),
    }
    healthy = _overall(checks)
    return jsonify({
        "status": "ok" if healthy else "degraded",
        "service": "RecruAI backend",
        "checks": checks,
    }), (200 if healthy else 503)