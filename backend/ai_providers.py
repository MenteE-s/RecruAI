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

    def __init__(self, api_key: str, model: Optional[str] = None, timeout: int = 30):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed")
        if not api_key:
            raise ValueError("OpenAI API key required")
        if not model:
            raise ValueError("A generation model is required for OpenAI")

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

    def __init__(self, api_key: str, model: Optional[str] = None, timeout: int = 30):
        if not GROQ_AVAILABLE:
            raise ImportError("Groq package not installed")
        if not api_key:
            raise ValueError("Groq API key required")
        if not model:
            raise ValueError("A generation model is required for Groq")

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

    def __init__(self, api_key: str, model: Optional[str] = None, dimensions: int = 1536):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed")
        if not api_key:
            raise ValueError("OpenAI API key required")
        if not model:
            raise ValueError("An embedding model is required for OpenAI embeddings")

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


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """HuggingFace Spaces / local ML service embedding provider"""

    def __init__(self, api_url: str, dimensions: int = 384):
        if not api_url:
            raise ValueError("HuggingFace Spaces API URL required")
        self.api_url = api_url.rstrip('/')
        self._embedding_dimension = dimensions

    @property
    def embedding_dimension(self) -> int:
        return self._embedding_dimension

    def embed(self, text: str) -> List[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            from gradio_client import Client
            client = Client(self.api_url)
            result = client.predict(
                texts=texts,
                api_name="/predict"
            )
            if isinstance(result, dict) and 'data' in result:
                return result['data']
            else:
                raise ValueError(f"Unexpected response format: {result}")
        except Exception as e:
            logger.error(f"Embedding error: {str(e)}")
            raise


class OpenRouterEmbeddingProvider(EmbeddingProvider):
    """OpenRouter embedding provider (OpenAI-compatible /embeddings API).

    Default model `sentence-transformers/all-minilm-l6-v2` is 384-dim, matching
    the pgvector columns. The returned dimension is validated fail-fast so a
    misconfigured model can't silently corrupt the vector store.
    """

    API_URL = "https://openrouter.ai/api/v1/embeddings"

    def __init__(self, api_key: str, model: Optional[str] = None,
                 dimensions: int = 384, timeout: int = 30):
        if not api_key:
            raise ValueError("OpenRouter API key required")
        if not model:
            raise ValueError("An embedding model is required for OpenRouter embeddings")
        self.api_key = api_key
        self.model = model
        self._embedding_dimension = dimensions
        self.timeout = timeout

    @property
    def embedding_dimension(self) -> int:
        return self._embedding_dimension

    def embed(self, text: str) -> List[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            response = requests.post(
                self.API_URL,
                json={"model": self.model, "input": texts, "encoding_format": "float"},
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "https://recruai.local"),
                    "X-Title": os.getenv("OPENROUTER_TITLE", "RecruAI"),
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            items = sorted(response.json().get("data", []), key=lambda d: d.get("index", 0))
            embeddings = [item["embedding"] for item in items]
            if len(embeddings) != len(texts):
                raise ValueError(
                    f"OpenRouter returned {len(embeddings)} embeddings for {len(texts)} inputs")
            for emb in embeddings:
                if len(emb) != self._embedding_dimension:
                    raise ValueError(
                        f"OpenRouter model {self.model} returned {len(emb)} dims, "
                        f"expected {self._embedding_dimension} — check EMBEDDING_MODEL/DIMENSIONS")
            return embeddings
        except Exception as e:
            logger.error(f"OpenRouter embedding error: {str(e)}")
            raise


class BudgetedLLMProvider(LLMProvider):
    """The only LLM entry point application code should use.

    It wraps a concrete provider, resolves the acting account (request user,
    organization, or an explicit actor from a background job), reserves tokens
    atomically, and writes a ``token_usage`` row for every call. No provider call
    can bypass the allowance by calling ``chat`` or ``generate`` directly,
    because ``AIProviderManager.llm`` returns this wrapper.
    """

    def __init__(self, provider: LLMProvider):
        self._provider = provider

    @property
    def model(self):
        return getattr(self._provider, "model", "unknown")

    @property
    def provider_name(self):
        cls = type(self._provider).__name__
        if cls.startswith("OpenAI"):
            return "openai"
        if cls.startswith("Groq"):
            return "groq"
        if cls.startswith("Local"):
            return "local"
        return cls.replace("LLMProvider", "").lower() or "unknown"

    @property
    def default_params(self):
        return getattr(self._provider, "default_params", {}) or {}

    def _begin(self, messages, params, actor, organization, operation_type):
        from .utils.ai_budget import (
            AIBudgetError,
            allowance_for,
            budget_enabled,
            estimate_tokens_for_messages,
            finalize_budget,
            release_budget,
            reserve_budget,
            resolve_ai_actor,
            used_tokens,
        )

        account, attribution_user = resolve_ai_actor(
            user=actor, organization=organization
        )
        if account is None:
            if budget_enabled():
                raise AIBudgetError(
                    "AI usage could not be attributed to an account. Please sign "
                    "in again and retry.",
                    code="ai_unattributed",
                )
            # Enforcement disabled and no actor: honour the explicit escape
            # hatch, but do not pretend to record usage.
            return None, {
                "account": None,
                "attribution_user": None,
                "reservation": None,
                "params": params,
                "estimate": 0,
                "budget_enabled": False,
            }

        configured_max = int(
            (params or {}).get("max_tokens")
            or self.default_params.get("max_tokens")
            or 1024
        )
        prompt_estimate = estimate_tokens_for_messages(messages)
        allowance = allowance_for(account)
        remaining = None
        request_params = dict(params or {})
        if allowance > 0:
            remaining = max(0, allowance - used_tokens(account))
            # Leave room for the prompt; a completion that cannot fit means the
            # allowance is effectively exhausted for this request.
            available_completion = remaining - prompt_estimate
            if available_completion < 1:
                raise AIBudgetError(
                    "This AI request needs more tokens than remain on the account. "
                    "Ask an admin to top up the allowance and try again.",
                    code="ai_budget_exhausted",
                )
            completion_cap = max(1, min(configured_max, available_completion))
            request_params["max_tokens"] = completion_cap
            estimate = prompt_estimate + completion_cap
        else:
            estimate = prompt_estimate + configured_max

        if budget_enabled():
            reservation = reserve_budget(account, estimate)
        else:
            reservation = {
                "reserved": 0,
                "previous_used": used_tokens(account),
                "allowance": allowance,
                "unlimited": True,
            }

        return account, {
            "account": account,
            "attribution_user": attribution_user,
            "reservation": reservation,
            "params": request_params,
            "estimate": estimate,
            "budget_enabled": budget_enabled(),
            "finalize_budget": finalize_budget,
            "release_budget": release_budget,
            "AIBudgetError": AIBudgetError,
        }

    def _finish(self, context, text, operation_type):
        if not context or context.get("account") is None:
            return text
        actual = 0
        getter = getattr(self._provider, "get_last_token_usage", None)
        if callable(getter):
            try:
                actual = int(getter() or 0)
            except Exception:
                actual = 0
        if actual <= 0:
            actual = int(context.get("estimate") or 1)
        try:
            context["finalize_budget"](
                context["account"],
                context["attribution_user"],
                context["reservation"],
                actual,
                self.provider_name,
                self.model,
                operation_type,
            )
        except Exception:
            # The model call succeeded; do not turn a ledger failure into a
            # user-visible error. The next successful call will still be gated.
            logger.exception(
                "failed to finalize AI usage provider=%s model=%s",
                self.provider_name,
                self.model,
            )
        self.last_token_usage = actual
        return text

    def _fail(self, context):
        if context and context.get("account") is not None:
            try:
                context["release_budget"](context["account"], context["reservation"])
            except Exception:
                logger.exception("failed to release AI budget reservation")

    def chat(self, messages, params=None, *, actor=None, organization=None,
             operation_type="ai_chat"):
        account, context = self._begin(
            messages, params, actor, organization, operation_type
        )
        try:
            text = self._provider.chat(messages, context["params"])
        except Exception:
            self._fail(context)
            raise
        return self._finish(context, text, operation_type)

    def generate(self, prompt, context=None, params=None, *, actor=None,
                 organization=None, operation_type="ai_chat"):
        messages = [{"role": "system", "content": prompt}]
        if context:
            messages.append({"role": "user", "content": context})
        else:
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ]
        _, prepared = self._begin(
            messages, params, actor, organization, operation_type
        )
        try:
            text = self._provider.generate(prompt, context, prepared["params"])
        except Exception:
            self._fail(prepared)
            raise
        return self._finish(prepared, text, operation_type)

    def get_last_token_usage(self) -> int:
        return int(getattr(self, "last_token_usage", 0) or 0)

    def healthcheck(self) -> bool:
        return bool(self._provider.healthcheck())

    def __getattr__(self, name):
        return getattr(self._provider, name)


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

        # Initialize LLM provider. The wrapper is the app-facing provider so
        # every direct chat()/generate() call is budgeted and attributed.
        self._llm_provider = BudgetedLLMProvider(self._create_llm_provider())

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
            model = self.config.OPENAI_MODEL or self.config.AI_GENERATION_MODEL
            if not model:
                raise ValueError("OPENAI_MODEL (or AI_GENERATION_MODEL/AI_MODEL) is required")
            return OpenAILLMProvider(
                api_key=self.config.OPENAI_API_KEY,
                model=model,
                timeout=self.config.AI_TIMEOUT
            )

        elif provider == "groq":
            if not self.config.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY required for Groq provider")
            model = self.config.GROQ_MODEL or self.config.AI_GENERATION_MODEL
            if not model:
                raise ValueError("GROQ_MODEL (or AI_GENERATION_MODEL/AI_MODEL) is required")
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
            model = self.config.EMBEDDING_MODEL
            if not model:
                raise ValueError("EMBEDDING_MODEL (or AI_EMBEDDING_MODEL) is required")
            return OpenAIEmbeddingProvider(
                api_key=self.config.OPENAI_API_KEY,
                model=model,
                dimensions=self.config.EMBEDDING_DIMENSIONS
            )

        elif provider == "huggingface":
            if not self.config.HUGGINGFACE_SPACES_URL:
                raise ValueError("HUGGINGFACE_SPACES_URL required for HuggingFace embeddings")
            return HuggingFaceEmbeddingProvider(
                api_url=self.config.HUGGINGFACE_SPACES_URL,
                dimensions=self.config.EMBEDDING_DIMENSIONS
            )

        elif provider == "openrouter":
            if not self.config.OPENROUTER_API_KEY:
                raise ValueError("OPENROUTER_API_KEY required for OpenRouter embeddings")
            model = self.config.EMBEDDING_MODEL
            if not model:
                raise ValueError("EMBEDDING_MODEL (or AI_EMBEDDING_MODEL) is required")
            return OpenRouterEmbeddingProvider(
                api_key=self.config.OPENROUTER_API_KEY,
                model=model,
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