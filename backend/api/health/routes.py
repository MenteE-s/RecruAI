from flask import current_app, jsonify, request

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


# Cache for the provider healthcheck (slow / cost-bearing): 60s TTL.
_AI_HEALTH_CACHE = {"at": 0.0, "value": None}


def _check_ai_providers():
    # Provider healthchecks can be slow or cost-bearing; cache for 60s so a
    # monitoring scrape storm does not fan out to vendors.
    import time

    now = time.monotonic()
    cached = _AI_HEALTH_CACHE.get("value")
    if cached is not None and now - _AI_HEALTH_CACHE.get("at", 0) < 60:
        return cached
    try:
        manager = get_ai_provider_manager()
        health = manager.healthcheck()
        info = manager.get_provider_info()
        result = {
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
        result = {"healthy": False, "error": str(exc)}
    _AI_HEALTH_CACHE["value"] = result
    _AI_HEALTH_CACHE["at"] = now
    return result


def _require_ops_token():
    """Gate non-liveness health endpoints.

    Accepts either the shared ``X-Ops-Token`` (monitoring, scripts) or a
    superadmin JWT (admin dashboard — no shared secret in the browser).
    Detailed output stays out of anonymous reach either way. Fail closed in
    production when no OPS_TOKEN is configured; allow in dev/test.
    """
    import hmac

    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
    from ...extensions import db as _db
    from ...models import User as _User

    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
    except Exception:
        uid = None
    if uid is not None:
        try:
            user = _db.session.get(_User, int(uid))
            if user is not None and user.is_superadmin:
                return None
        except (TypeError, ValueError):
            pass

    expected = current_app.config.get("OPS_TOKEN") or ""
    if not expected:
        if current_app.config.get("IS_PRODUCTION"):
            return jsonify({"error": "ops token not configured", "code": "ops_token_required"}), 503
        return None
    provided = request.headers.get("X-Ops-Token", "")
    if not provided or not hmac.compare_digest(provided, expected):
        return jsonify({"error": "forbidden", "code": "ops_token_required"}), 403
    return None


def _check_scheduler():
    try:
        from ...scheduler import scheduler_health

        health = scheduler_health(current_app._get_current_object())
        return {"healthy": bool(health.get("healthy")), "jobs": health.get("jobs", {})}
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


def _check_outbox():
    """Outbox backlog for alerting. Informational: a lagging worker must page,
    but it must not mark the API itself unhealthy."""
    try:
        from datetime import datetime

        from sqlalchemy import func

        from ...extensions import db
        from ...models.outbox_event import (
            STATUS_DEAD,
            STATUS_FAILED,
            STATUS_PENDING,
            STATUS_PROCESSING,
            OutboxEvent,
        )

        now = datetime.utcnow()
        counts = dict(
            db.session.query(OutboxEvent.status, func.count(OutboxEvent.id))
            .filter(OutboxEvent.status.in_([STATUS_PENDING, STATUS_FAILED, STATUS_PROCESSING]))
            .group_by(OutboxEvent.status)
            .all()
        )
        oldest = (
            db.session.query(func.min(OutboxEvent.created_at))
            .filter(OutboxEvent.status.in_([STATUS_PENDING, STATUS_FAILED]))
            .scalar()
        )
        dead = (
            db.session.query(func.count(OutboxEvent.id))
            .filter(OutboxEvent.status == STATUS_DEAD)
            .scalar()
            or 0
        )
        lag_seconds = int((now - oldest).total_seconds()) if oldest else 0
        return {
            "healthy": True,
            "pending": int(counts.get(STATUS_PENDING, 0)),
            "failed": int(counts.get(STATUS_FAILED, 0)),
            "processing": int(counts.get(STATUS_PROCESSING, 0)),
            "dead": int(dead),
            "oldest_pending_age_seconds": lag_seconds,
        }
    except Exception as exc:
        return {"healthy": False, "error": str(exc)}


@api_bp.route("/health/outbox", methods=["GET"])
def health_outbox():
    """Outbox backlog: pending/failed/dead counts and oldest pending age.

    Ops-token gated. Fails (503) when dead rows need attention or the oldest
    pending row is older than the alert threshold, so monitors can page on it.
    """
    import os

    denied = _require_ops_token()
    if denied:
        return denied

    check = _check_outbox()
    if not check.get("healthy", False):
        return jsonify(check), 503
    try:
        max_lag = int(os.getenv("OUTBOX_ALERT_LAG_SECONDS", "600"))
    except (TypeError, ValueError):
        max_lag = 600
    alert = bool(check.get("dead", 0)) or check.get("oldest_pending_age_seconds", 0) > max_lag
    return jsonify({**check, "alert": alert}), (503 if alert else 200)


def _overall(checks):
    # Database is required. Kafka/Redis/AI are reported but do not by themselves
    # make the process unready; scheduler is informational for the web process.
    return bool(checks.get("database", {}).get("healthy", False))


@api_bp.route("/health/scheduler", methods=["GET"])
def health_scheduler():
    """Fail when the dedicated scheduler worker has missed two cycles."""
    from ...scheduler import scheduler_health

    denied = _require_ops_token()
    if denied:
        return denied

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
    """Readiness: required dependencies are available (ops-token gated)."""
    denied = _require_ops_token()
    if denied:
        return denied
    checks = {
        "database": _check_database(),
        "redis": _check_redis(),
        "kafka": _check_kafka(),
        "ai_providers": _check_ai_providers(),
        "scheduler": _check_scheduler(),
        "outbox": _check_outbox(),
    }
    healthy = _overall(checks)
    return jsonify({
        "status": "ok" if healthy else "degraded",
        "checks": checks,
    }), (200 if healthy else 503)


@api_bp.route("/health/detailed", methods=["GET"])
def health_detailed():
    """Full dependency detail (ops-token gated; AI check cached 60s)."""
    denied = _require_ops_token()
    if denied:
        return denied
    checks = {
        "database": _check_database(),
        "redis": _check_redis(),
        "kafka": _check_kafka(),
        "ai_providers": _check_ai_providers(),
        "scheduler": _check_scheduler(),
        "outbox": _check_outbox(),
    }
    healthy = _overall(checks)
    return jsonify({
        "status": "ok" if healthy else "degraded",
        "service": "RecruAI backend",
        "checks": checks,
    }), (200 if healthy else 503)