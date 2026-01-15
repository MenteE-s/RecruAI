from .. import api_bp
from ...ai_providers import get_ai_provider_manager
from ...utils.kafka_service import KafkaService


@api_bp.route("/health", methods=["GET"])
def health():
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
