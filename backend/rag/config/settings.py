"""
RAG System Configuration Settings
"""

import os
from typing import Dict, Any, Optional


class RAGConfig:
    """Configuration class for RAG system settings"""

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-ada-002"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536
    OPENAI_COMPLETION_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TEMPERATURE: float = 0.7

    # Vector Database Configuration
    VECTOR_DB_HOST: str = os.getenv("VECTOR_DB_HOST", "localhost")
    VECTOR_DB_PORT: int = int(os.getenv("VECTOR_DB_PORT", "5432"))
    VECTOR_DB_NAME: str = os.getenv("VECTOR_DB_NAME", "recruai")
    VECTOR_DB_USER: str = os.getenv("VECTOR_DB_USER", "postgres")
    VECTOR_DB_PASSWORD: str = os.getenv("VECTOR_DB_PASSWORD", "")

    # Chunking Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_CHUNKS_PER_DOCUMENT: int = 100

    # Retrieval Configuration
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.7
    MAX_CONTEXT_LENGTH: int = 8000

    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = 60
    MAX_REQUESTS_PER_HOUR: int = 1000

    # File Processing
    MAX_FILE_SIZE_MB: int = 10
    SUPPORTED_FILE_TYPES: list = [".pdf", ".txt", ".md", ".docx", ".html"]

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

        if not cls.OPENAI_API_KEY:
            issues.append("OPENAI_API_KEY environment variable not set")

        if not cls.VECTOR_DB_PASSWORD:
            issues.append("VECTOR_DB_PASSWORD environment variable not set")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": {
                "embedding_model": cls.OPENAI_EMBEDDING_MODEL,
                "completion_model": cls.OPENAI_COMPLETION_MODEL,
                "chunk_size": cls.CHUNK_SIZE,
                "top_k": cls.TOP_K_RESULTS,
                "max_file_size": cls.MAX_FILE_SIZE_MB,
            }
        }

    @classmethod
    def get_embedding_config(cls) -> Dict[str, Any]:
        """Get embedding-specific configuration"""
        return {
            "model": cls.OPENAI_EMBEDDING_MODEL,
            "dimensions": cls.OPENAI_EMBEDDING_DIMENSIONS,
            "api_key": cls.OPENAI_API_KEY,
        }

    @classmethod
    def get_completion_config(cls) -> Dict[str, Any]:
        """Get completion-specific configuration"""
        return {
            "model": cls.OPENAI_COMPLETION_MODEL,
            "max_tokens": cls.OPENAI_MAX_TOKENS,
            "temperature": cls.OPENAI_TEMPERATURE,
            "api_key": cls.OPENAI_API_KEY,
        }