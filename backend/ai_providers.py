"""
AI Provider Abstraction Layer
Provider-agnostic interfaces for LLM and embedding services
"""

import os
import abc
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import requests
from concurrent.futures import ThreadPoolExecutor

try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    Groq = None

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None
    np = None

# support running as a module (recommended) and as a script
try:
    # when used as a package (python -m backend.ai_providers or via other modules)
    from ..config import Config
except Exception:
    # when executed directly as a script (python ai_providers.py) the package-relative
    # imports often fail. To support running the script from inside the
    # `backend/` directory we insert the repo root on sys.path and import the
    # `backend` package explicitly so package-relative imports inside submodules
    # (like `config`) resolve correctly.
    import sys
    import importlib

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    backend_config = importlib.import_module("backend.config")
    Config = backend_config.Config  # type: ignore

logger = logging.getLogger(__name__)


class LLMProvider(abc.ABC):
    """Abstract base class for LLM providers"""

    @abc.abstractmethod
    def generate(self, prompt: str, context: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> str:
        """Generate text response"""
        pass

    @abc.abstractmethod
    def chat(self, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> str:
        """Chat completion with message history"""
        pass

    @abc.abstractmethod
    def healthcheck(self) -> bool:
        """Check if provider is available"""
        pass


class EmbeddingProvider(abc.ABC):
    """Abstract base class for embedding providers"""

    @property
    @abc.abstractmethod
    def embedding_dimension(self) -> int:
        """Return the dimension of embeddings"""
        pass

    @abc.abstractmethod
    def embed(self, text: str) -> List[float]:
        """Generate embedding for single text"""
        pass

    @abc.abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for batch of texts"""
        pass


class OpenAILLMProvider(LLMProvider):
    """OpenAI LLM provider implementation"""

    def __init__(self, api_key: str, model: str = "gpt-4", timeout: int = 30):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed")
        if not api_key:
            raise ValueError("OpenAI API key required")

        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.timeout = timeout
        self.last_token_usage = 0
        config = Config()
        self.default_params = {
            "max_tokens": config.AI_MAX_TOKENS,
            "temperature": config.AI_TEMPERATURE,
        }

    def generate(self, prompt: str, context: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> str:
        messages = [{"role": "system", "content": prompt}]
        if context:
            messages.append({"role": "user", "content": context})
        else:
            # If no context provided, treat the prompt as a user message with a generic system prompt
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]

        return self.chat(messages, params)

    def chat(self, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> str:
        try:
            request_params = {**self.default_params}
            if params:
                request_params.update(params)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                **request_params
            )

            # Track token usage
            self.last_token_usage = response.usage.total_tokens if response.usage else 0

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise

    def get_last_token_usage(self) -> int:
        """Get the token usage from the last API call"""
        return self.last_token_usage

    def healthcheck(self) -> bool:
        try:
            # Simple health check
            self.client.models.list()
            return True
        except Exception:
            return False


class GroqLLMProvider(LLMProvider):
    """Groq LLM provider implementation"""

    def __init__(self, api_key: str, model: str = "mixtral-8x7b-32768", timeout: int = 30):
        if not GROQ_AVAILABLE:
            raise ImportError("Groq package not installed")
        if not api_key:
            raise ValueError("Groq API key required")

        self.client = Groq(api_key=api_key)
        self.model = model
        self.timeout = timeout
        self.last_token_usage = 0
        config = Config()
        self.default_params = {
            "max_tokens": config.AI_MAX_TOKENS,
            "temperature": config.AI_TEMPERATURE,
        }

    def generate(self, prompt: str, context: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> str:
        messages = [{"role": "system", "content": prompt}]
        if context:
            messages.append({"role": "user", "content": context})
        else:
            # If no context provided, treat the prompt as a user message with a generic system prompt
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]

        return self.chat(messages, params)

    def chat(self, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> str:
        try:
            request_params = {**self.default_params}
            if params:
                request_params.update(params)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                **request_params
            )

            # Track token usage
            self.last_token_usage = response.usage.total_tokens if response.usage else 0

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            raise

    def get_last_token_usage(self) -> int:
        """Get the token usage from the last API call"""
        return self.last_token_usage

    def healthcheck(self) -> bool:
        try:
            # Simple health check
            self.client.models.list()
            return True
        except Exception:
            return False


class LocalLLMProvider(LLMProvider):
    """Local LLM provider (placeholder for future implementation)"""

    def __init__(self, model_path: str = None):
        # Placeholder - would implement local model loading
        raise NotImplementedError("Local LLM provider not yet implemented")

    def generate(self, prompt: str, context: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> str:
        raise NotImplementedError("Local LLM generation not implemented")

    def chat(self, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> str:
        raise NotImplementedError("Local LLM chat not implemented")

    def healthcheck(self) -> bool:
        return False


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider"""

    def __init__(self, api_key: str, model: str = "text-embedding-ada-002", dimensions: int = 1536):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed")
        if not api_key:
            raise ValueError("OpenAI API key required")

        self.client = OpenAI(api_key=api_key)
        self.model = model
        self._embedding_dimension = dimensions

    @property
    def embedding_dimension(self) -> int:
        return self._embedding_dimension

    def embed(self, text: str) -> List[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.model
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"OpenAI embedding error: {str(e)}")
            raise


class LocalEmbeddingProvider(EmbeddingProvider):
    """Local SentenceTransformer embedding provider"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2", dimensions: int = 384):
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError("sentence-transformers package not installed")

        self.model = SentenceTransformer(model_name)
        self._embedding_dimension = dimensions
        self.executor = ThreadPoolExecutor(max_workers=4)

    @property
    def embedding_dimension(self) -> int:
        return self._embedding_dimension

    def embed(self, text: str) -> List[float]:
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist() if hasattr(embeddings, 'tolist') else embeddings.tolist()


class AIProviderManager:
    """Central manager for AI providers"""

    def __init__(self):
        self.config = Config()
        self._llm_provider: Optional[LLMProvider] = None
        self._embedding_provider: Optional[EmbeddingProvider] = None
        self._initialized = False

    def initialize(self):
        """Initialize providers based on configuration"""
        if self._initialized:
            return

        logger.info(f"Initializing AI providers - LLM: {self.config.AI_PROVIDER}, Embedding: {self.config.EMBEDDING_PROVIDER}")

        # Initialize LLM provider
        self._llm_provider = self._create_llm_provider()

        # Initialize embedding provider
        self._embedding_provider = self._create_embedding_provider()

        self._initialized = True
        logger.info("AI providers initialized successfully")

    def _create_llm_provider(self) -> LLMProvider:
        """Create LLM provider based on configuration"""
        provider = self.config.AI_PROVIDER

        if provider == "openai":
            if not self.config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY required for OpenAI provider")
            model = self.config.AI_MODEL or "gpt-4"
            return OpenAILLMProvider(
                api_key=self.config.OPENAI_API_KEY,
                model=model,
                timeout=self.config.AI_TIMEOUT
            )

        elif provider == "groq":
            if not self.config.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY required for Groq provider")
            model = self.config.AI_MODEL or "mixtral-8x7b-32768"
            return GroqLLMProvider(
                api_key=self.config.GROQ_API_KEY,
                model=model,
                timeout=self.config.AI_TIMEOUT
            )

        elif provider == "local":
            # Placeholder for local models
            raise NotImplementedError("Local LLM provider not yet implemented")

        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

    def _create_embedding_provider(self) -> EmbeddingProvider:
        """Create embedding provider based on configuration"""
        provider = self.config.EMBEDDING_PROVIDER

        if provider == "openai":
            if not self.config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY required for OpenAI embeddings")
            model = self.config.EMBEDDING_MODEL or "text-embedding-ada-002"
            return OpenAIEmbeddingProvider(
                api_key=self.config.OPENAI_API_KEY,
                model=model,
                dimensions=self.config.EMBEDDING_DIMENSIONS
            )

        elif provider == "local":
            model = self.config.EMBEDDING_MODEL or self.config.LOCAL_EMBEDDING_MODEL
            return LocalEmbeddingProvider(
                model_name=model,
                dimensions=self.config.EMBEDDING_DIMENSIONS
            )

        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")

    @property
    def llm(self) -> LLMProvider:
        """Get the active LLM provider"""
        if not self._initialized:
            self.initialize()
        return self._llm_provider

    @property
    def embedding(self) -> EmbeddingProvider:
        """Get the active embedding provider"""
        if not self._initialized:
            self.initialize()
        return self._embedding_provider

    def healthcheck(self) -> Dict[str, bool]:
        """Check health of all providers"""
        if not self._initialized:
            self.initialize()

        return {
            "llm": self._llm_provider.healthcheck() if self._llm_provider else False,
            "embedding": True,  # Embedding providers don't have external dependencies to check
        }

    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about active providers"""
        return {
            "llm_provider": self.config.AI_PROVIDER,
            "embedding_provider": self.config.EMBEDDING_PROVIDER,
            "rag_enabled": self.config.RAG_ENABLED,
            "embedding_dimension": self.embedding.embedding_dimension if self._embedding_provider else None,
        }


# Global instance
ai_provider_manager = AIProviderManager()


def get_ai_provider_manager() -> AIProviderManager:
    """Get the global AI provider manager instance"""
    return ai_provider_manager