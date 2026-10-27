"""DB-backed AI provider resolution.

The admin dashboard writes rows here. When an active row exists for a kind
('llm' or 'embedding'), it wins over environment variables; otherwise the
Config/env path is used, so local dev and the very first boot keep working
without any seeding.
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

VALID_LLM_PROVIDERS = ("groq", "openai", "openrouter")
VALID_EMBEDDING_PROVIDERS = ("openai", "openrouter", "huggingface")


def active_config(kind: str):
    """Return the active AIProviderConfig row for ``kind`` or None."""
    try:
        from ..extensions import db
        from ..models import AIProviderConfig

        with db.session.no_autoflush:
            return (
                AIProviderConfig.query.filter_by(kind=kind, is_active=True)
                .order_by(AIProviderConfig.updated_at.desc())
                .first()
            )
    except Exception as exc:  # pragma: no cover — DB unavailable at import
        logger.warning("could not read AI provider config: %s", exc)
        return None


def _construct_llm(cfg):
    from ..ai_providers import (
        GroqLLMProvider,
        OpenAILLMProvider,
        OpenRouterLLMProvider,
    )

    if cfg.provider == "groq":
        return GroqLLMProvider(
            api_key=cfg.get_api_key(),
            model=cfg.model,
            timeout=30,
        )
    if cfg.provider == "openai":
        return OpenAILLMProvider(
            api_key=cfg.get_api_key(),
            model=cfg.model,
            timeout=30,
        )
    if cfg.provider == "openrouter":
        return OpenRouterLLMProvider(
            api_key=cfg.get_api_key(),
            model=cfg.model,
            timeout=30,
        )
    raise ValueError(f"unsupported LLM provider: {cfg.provider}")


def _construct_embedding(cfg):
    from ..ai_providers import (
        HuggingFaceEmbeddingProvider,
        OpenAIEmbeddingProvider,
        OpenRouterEmbeddingProvider,
    )

    if cfg.provider == "openai":
        return OpenAIEmbeddingProvider(
            api_key=cfg.get_api_key(),
            model=cfg.model,
            dimensions=cfg.dimensions or 1536,
        )
    if cfg.provider == "openrouter":
        return OpenRouterEmbeddingProvider(
            api_key=cfg.get_api_key(),
            model=cfg.model,
            dimensions=cfg.dimensions or 1536,
        )
    if cfg.provider == "huggingface":
        return HuggingFaceEmbeddingProvider(
            api_url=cfg.base_url,
            dimensions=cfg.dimensions or 384,
        )
    raise ValueError(f"unsupported embedding provider: {cfg.provider}")


def resolve_llm_provider():
    """Construct the LLM provider from DB config, or None to fall back to env."""
    cfg = active_config("llm")
    if cfg is None:
        return None
    if not cfg.model:
        return None
    if cfg.provider in ("groq", "openai", "openrouter") and not cfg.get_api_key():
        logger.warning("active LLM config %s has no api key; falling back to env", cfg.id)
        return None
    return _construct_llm(cfg)


def resolve_embedding_provider():
    """Construct the embedding provider from DB config, or None to fall back to env."""
    cfg = active_config("embedding")
    if cfg is None:
        return None
    if not cfg.model:
        return None
    if cfg.provider in ("openai", "openrouter") and not cfg.get_api_key():
        logger.warning("active embedding config %s has no api key; falling back to env", cfg.id)
        return None
    if cfg.provider == "huggingface" and not cfg.base_url:
        logger.warning("active embedding config %s has no base_url; falling back to env", cfg.id)
        return None
    return _construct_embedding(cfg)
