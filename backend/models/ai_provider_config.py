"""Platform-wide AI provider configuration (admin-managed).

One active LLM config and one active embedding config at a time. Stored in
the database so the admin dashboard can switch providers/models without a
redeploy. API keys are stored encrypted-at-rest-ish (base64 + a per-deploy
secret) — enough to stop casual DB-dump exposure, not a substitute for a real
secret manager. Env vars remain the fallback for local dev and for the very
first boot before any row exists.
"""

import base64
import hashlib
import json
from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


def _secret_key() -> bytes:
    import os

    raw = os.getenv("SECRET_KEY") or "dev-secret-change-in-production"
    return hashlib.sha256(raw.encode("utf-8")).digest()


def _mask(value: str | None) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "•" * len(value)
    return "•" * (len(value) - 4) + value[-4:]


class AIProviderConfig(db.Model):
    __tablename__ = "ai_provider_configs"

    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(16), nullable=False)  # "llm" or "embedding"
    provider = db.Column(db.String(32), nullable=False)  # groq/openai/openrouter/huggingface
    model = db.Column(db.String(128), nullable=False)
    # api_key stored encrypted with the deploy secret so a DB dump alone is not
    # enough. Empty for keyless providers (huggingface).
    api_key_enc = db.Column(db.Text, nullable=True)
    base_url = db.Column(db.String(512), nullable=True)
    dimensions = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index("ix_ai_provider_configs_kind_active", "kind", "is_active"),
    )

    # ---------- key handling ----------
    def set_api_key(self, value: str | None):
        if not value:
            self.api_key_enc = None
            return
        key = _secret_key()
        # XOR stream cipher over the utf-8 bytes; not AES, but keeps keys out of
        # casual SELECT output and is reversible with the same deploy secret.
        data = value.encode("utf-8")
        stream = (key * ((len(data) // len(key)) + 1))[: len(data)]
        xored = bytes(a ^ b for a, b in zip(data, stream))
        self.api_key_enc = base64.b64encode(xored).decode("ascii")

    def get_api_key(self) -> str | None:
        if not self.api_key_enc:
            return None
        try:
            key = _secret_key()
            data = base64.b64decode(self.api_key_enc.encode("ascii"))
            stream = (key * ((len(data) // len(key)) + 1))[: len(data)]
            return bytes(a ^ b for a, b in zip(data, stream)).decode("utf-8")
        except Exception:
            return None

    @property
    def api_key_masked(self) -> str:
        return _mask(self.get_api_key())

    # ---------- serialization ----------
    def to_dict(self, include_secret: bool = False):
        return {
            "id": self.id,
            "kind": self.kind,
            "provider": self.provider,
            "model": self.model,
            "api_key": self.get_api_key() if include_secret else self.api_key_masked,
            "has_api_key": bool(self.api_key_enc),
            "base_url": self.base_url,
            "dimensions": self.dimensions,
            "is_active": bool(self.is_active),
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
        }
