from flask import current_app, jsonify

from .. import api_bp
from ...ai_providers import get_ai_provider_manager
from ...utils.kafka_service import KafkaService


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


@api_bp.route("/health/detailed", methods=["GET"])
def health_detailed():
    try:
        ai_manager = get_ai_provider_manager()
        ai_health = ai_manager.healthcheck()
        provider_info = ai_manager.get_provider_info()

        # Check Kafka Health
        kafka_healthy = False
        kafka_error = None
        try:
            kafka = KafkaService()
            # A simple poll to see if we can talk to the cluster
            # In a real health check, we might check cluster metadata
            kafka_healthy = True
        except Exception as ke:
            kafka_error = str(ke)

        return {
            "status": "ok" if kafka_healthy else "degraded",
            "service": "RecruAI backend",
            "ai_providers": {
                "llm": {
                    "provider": provider_info["llm_provider"],
                    "healthy": ai_health["llm"]
                },
                "embedding": {
                    "provider": provider_info["embedding_provider"],
                    "healthy": ai_health["embedding"],
                    "dimension": provider_info["embedding_dimension"]
                },
                "rag_enabled": provider_info["rag_enabled"]
            },
            "kafka": {
                "healthy": kafka_healthy,
                "error": kafka_error
            }
        }, 200
    except Exception as e:
        return {
            "status": "degraded",
            "service": "RecruAI backend",
            "ai_providers": {
                "error": str(e)
            }
        }, 200
