from .. import api_bp
from ...ai_providers import get_ai_provider_manager


@api_bp.route("/health", methods=["GET"])
def health():
    try:
        ai_manager = get_ai_provider_manager()
        ai_health = ai_manager.healthcheck()
        provider_info = ai_manager.get_provider_info()

        return {
            "status": "ok",
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
