"""
Recommendation System Configuration Settings
"""

import os
from typing import Dict, Any, Optional

# Import from main config
from ...config import Config


class RecommendationConfig:
    """Configuration class for Recommendation system settings"""

    # Use main config values
    OPENAI_API_KEY: Optional[str] = Config.OPENAI_API_KEY
    GROQ_API_KEY: Optional[str] = Config.GROQ_API_KEY

    # Provider settings from main config
    AI_PROVIDER: str = Config.AI_PROVIDER
    EMBEDDING_PROVIDER: str = Config.EMBEDDING_PROVIDER
    RAG_ENABLED: bool = Config.RAG_ENABLED

    # Model settings
    AI_MODEL: Optional[str] = Config.AI_MODEL
    EMBEDDING_MODEL: Optional[str] = Config.EMBEDDING_MODEL
    EMBEDDING_DIMENSIONS: int = Config.EMBEDDING_DIMENSIONS

    # Vector Database Configuration (from main config)
    VECTOR_DB_HOST: str = os.getenv("VECTOR_DB_HOST", "localhost")
    VECTOR_DB_PORT: int = int(os.getenv("VECTOR_DB_PORT", "5432"))
    VECTOR_DB_NAME: str = os.getenv("VECTOR_DB_NAME", "recruai")
    VECTOR_DB_USER: str = os.getenv("VECTOR_DB_USER", "postgres")
    VECTOR_DB_PASSWORD: str = os.getenv("VECTOR_DB_PASSWORD", "")

    # Recommendation Configuration
    TOP_K_RECOMMENDATIONS: int = 10
    SIMILARITY_THRESHOLD: float = 0.7
    MAX_CONTEXT_LENGTH: int = 2000

    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = Config.EMBEDDING_REQUESTS_PER_MINUTE
    MAX_REQUESTS_PER_HOUR: int = Config.EMBEDDING_REQUESTS_PER_HOUR

    # Caching
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    ENABLE_CACHE: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @classmethod
    def get_database_url(cls) -> str:
        """Get PostgreSQL connection URL"""
        return f"postgresql://{cls.VECTOR_DB_USER}:{cls.VECTOR_DB_PASSWORD}@{cls.VECTOR_DB_HOST}:{cls.VECTOR_DB_PORT}/{cls.VECTOR_DB_NAME}"

    @classmethod
    def validate_config(cls) -> Dict[str, Any]:
        """Validate configuration and return status"""
        issues = []

        if not cls.OPENAI_API_KEY and not cls.GROQ_API_KEY:
            issues.append("No API key set for embeddings")

        if not cls.VECTOR_DB_PASSWORD:
            issues.append("VECTOR_DB_PASSWORD environment variable not set")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": {
                "embedding_model": cls.EMBEDDING_MODEL,
                "top_k": cls.TOP_K_RECOMMENDATIONS,
                "similarity_threshold": cls.SIMILARITY_THRESHOLD,
            }
        }