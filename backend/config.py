import os
from dotenv import load_dotenv


# Load backend/.env so imports that evaluate at module import time (like
# Config.SQLALCHEMY_DATABASE_URI) pick up the DATABASE_URL when CLI or
# scripts import this module from repo root.
# Use override=True so backend/.env wins over repo-root .env that Flask auto-loads (which has docker hosts kafka:29092 / redis:6379)
here = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(here, ".env"), override=True)


class Config:
    """Default configuration. Reads DATABASE_URL from env.

    DATABASE_URL example: postgresql://user:pass@host:5432/dbname
    """

    # Detect if we're in production. Set PRODUCTION=1 (or FLASK_ENV=production)
    # on any VPS/EC2 host; RAILWAY_ENVIRONMENT covers Railway.
    IS_PRODUCTION = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None
        or os.getenv("PRODUCTION") == "1"
        or os.getenv("IS_PRODUCTION") == "1"
        or os.getenv("FLASK_ENV") == "production"
    )

    _db_url = os.getenv(
        "DATABASE_URL",
        # Local dev default: prefer Postgres at default creds per developer request.
        "postgresql://recruai:recruai_pass@localhost:5432/recruai",
    )
    # The entire stack is built on psycopg2 (psycopg2-binary in
    # requirements.txt, pgvector.psycopg2 in app.py). A URL without an
    # explicit driver is the dangerous case: SQLAlchemy 2.1 changed the
    # default dialect of a bare "postgresql://" to psycopg (v3), so a
    # clean-looking URL raised "ModuleNotFoundError: No module named
    # 'psycopg'" at create_app() — dev (SQLAlchemy 2.0.x) never saw it.
    # Pin the driver explicitly so the default dialect is irrelevant.
    if _db_url.startswith("postgresql+psycopg3://"):
        _db_url = "postgresql+psycopg2://" + _db_url[len("postgresql+psycopg3://"):]
    elif _db_url.startswith("postgresql+psycopg://"):
        _db_url = "postgresql+psycopg2://" + _db_url[len("postgresql+psycopg://"):]
    elif _db_url.startswith("postgresql+asyncpg://"):
        # asyncpg is asyncio-only; this app is sync. Same driver-swap
        # rationale.
        _db_url = "postgresql+psycopg2://" + _db_url[len("postgresql+asyncpg://"):]
    elif _db_url.startswith("postgres://"):
        _db_url = "postgresql+psycopg2://" + _db_url[len("postgres://"):]
    elif _db_url.startswith("postgresql://"):
        _db_url = "postgresql+psycopg2://" + _db_url[len("postgresql://"):]
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security: Strong secret keys required
    SECRET_KEY = os.getenv("SECRET_KEY")
    if IS_PRODUCTION:
        if not SECRET_KEY or SECRET_KEY == "dev-secret-change-in-production":
            raise ValueError("SECRET_KEY environment variable is required in production")
    elif not SECRET_KEY:
        SECRET_KEY = "dev-secret-change-in-production"  # Better default for dev

    # JWT uses its own key, but default to SECRET_KEY when not provided
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    if IS_PRODUCTION and JWT_SECRET_KEY == "dev-secret-change-in-production":
        raise ValueError("JWT_SECRET_KEY environment variable is required in production")

    # Security: Enhanced JWT settings.
    # Access tokens are short-lived bearer tokens returned in JSON and held in
    # frontend memory only. Refresh tokens are opaque, HttpOnly cookies handled
    # by backend/api/auth/session.py — never by Flask-JWT-Extended cookies.
    import json as _json
    _loc_raw = os.getenv("JWT_TOKEN_LOCATION")
    try:
        JWT_TOKEN_LOCATION = _json.loads(_loc_raw) if _loc_raw else ["headers"]
    except Exception:
        JWT_TOKEN_LOCATION = [s.strip() for s in _loc_raw.split(",") if s.strip()] if _loc_raw else ["headers"]
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "1" if IS_PRODUCTION else "0") == "1"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "None" if IS_PRODUCTION else "Lax")
    JWT_COOKIE_HTTPONLY = True
    # Kept for legacy deployments; access tokens are header-only now.
    JWT_COOKIE_CSRF_PROTECT = os.getenv("JWT_COOKIE_CSRF_PROTECT", "1" if IS_PRODUCTION else "0") == "1"

    # Security: short access-token lifetime, rotated refresh-token session.
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    )
    REFRESH_TOKEN_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "30"))
    REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
    REFRESH_COOKIE_PATH = os.getenv("REFRESH_COOKIE_PATH", "/api/auth")
    REFRESH_COOKIE_SECURE = os.getenv(
        "REFRESH_COOKIE_SECURE", "1" if IS_PRODUCTION else "0"
    ) == "1"
    # Frontend and API are same-site subdomains in production, so Lax is both
    # sufficient and safer than None. Set None only for a truly cross-site API.
    REFRESH_COOKIE_SAMESITE = os.getenv("REFRESH_COOKIE_SAMESITE", "Lax")
    REFRESH_COOKIE_DOMAIN = os.getenv("REFRESH_COOKIE_DOMAIN") or None
    REFRESH_REUSE_GRACE_SECONDS = int(os.getenv("REFRESH_REUSE_GRACE_SECONDS", "10"))

    # Kafka configuration. Toggle with KAFKA_ENABLED=1 (needs a reachable
    # broker at KAFKA_BOOTSTRAP_SERVERS); default off for small hosts.
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_ENABLED = os.getenv("KAFKA_ENABLED", "0") == "1"

    # Redis configuration
    REDIS_URL = os.getenv(
        "REDIS_URL",
        "redis://127.0.0.1:6379/0"
    )
    REDIS_ENABLED = os.getenv("REDIS_ENABLED", "1") == "1"
    REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "20"))

    # Security: Request size limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max request size

    # CORS configuration - auto-detect based on environment
    FRONTEND_ORIGIN = os.getenv(
        "FRONTEND_ORIGIN",
        "https://recruai.yourdomain.com" if IS_PRODUCTION else "http://localhost:3000"
    )

    # Server port - single source of truth, override via .env PORT
    PORT = int(os.getenv("PORT", "8000"))

    # API configuration - reads from .env, fallback uses PORT env var (no hardcoded port duplicated)
    API_BASE_URL = os.getenv(
        "API_BASE_URL",
        "https://recruai.yourdomain.com" if IS_PRODUCTION else f"http://localhost:{os.getenv('PORT', '8000')}"
    )

    # Transactional email (Resend). OTP is strictly no-reply; the welcome
    # mail invites replies, routed to the contact inbox.
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "RecruAI <no-reply@menteeai.org>")
    RESEND_WELCOME_FROM_EMAIL = os.getenv(
        "RESEND_WELCOME_FROM_EMAIL", "RecruAI <welcome@menteeai.org>"
    )

    # Security: Rate limiting configuration
    RATELIMIT_STORAGE_URL = os.getenv("RATELIMIT_STORAGE_URL", "memory://")
    RATELIMIT_STRATEGY = os.getenv("RATELIMIT_STRATEGY", "fixed-window")

    # Security: Password policy
    PASSWORD_MIN_LENGTH = int(os.getenv("PASSWORD_MIN_LENGTH", "8"))
    PASSWORD_REQUIRE_UPPERCASE = os.getenv("PASSWORD_REQUIRE_UPPERCASE", "1") == "1"
    PASSWORD_REQUIRE_LOWERCASE = os.getenv("PASSWORD_REQUIRE_LOWERCASE", "1") == "1"
    PASSWORD_REQUIRE_DIGITS = os.getenv("PASSWORD_REQUIRE_DIGITS", "1") == "1"
    PASSWORD_REQUIRE_SPECIAL = os.getenv("PASSWORD_REQUIRE_SPECIAL", "0") == "1"

    # Security: Account lockout settings
    MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

    # Security: File upload settings
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB default
    ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", "png,jpg,jpeg,gif,pdf,doc,docx").split(",")

    # Security: Audit logging
    ENABLE_AUDIT_LOG = os.getenv("ENABLE_AUDIT_LOG", "1" if IS_PRODUCTION else "0") == "1"

    # Ops token gating the detailed/ready/scheduler/outbox health endpoints.
    # Never log this value; it is compared with hmac.compare_digest.
    OPS_TOKEN = os.getenv("OPS_TOKEN")

    # AI Provider Configuration (dynamic properties)
    @property
    def AI_PROVIDER(self):
        return os.getenv("AI_PROVIDER", "groq").lower()

    @property
    def EMBEDDING_PROVIDER(self):
        return os.getenv("EMBEDDING_PROVIDER", "huggingface").lower()

    @property
    def RAG_ENABLED(self):
        return os.getenv("RAG_ENABLED", "1") == "1"

    @property
    def AI_GENERATION_MODEL(self):
        return (os.getenv("AI_GENERATION_MODEL")
                or os.getenv("AI_MODEL")
                or os.getenv("GENERATION_MODEL"))

    @property
    def AI_MODEL(self):
        return self.AI_GENERATION_MODEL

    @property
    def GROQ_MODEL(self):
        return os.getenv("GROQ_MODEL") or self.AI_GENERATION_MODEL

    @property
    def OPENAI_MODEL(self):
        return os.getenv("OPENAI_MODEL") or self.AI_GENERATION_MODEL

    @property
    def OPENROUTER_MODEL(self):
        return os.getenv("OPENROUTER_MODEL") or self.AI_GENERATION_MODEL

    @property
    def AI_EMBEDDING_MODEL(self):
        return (os.getenv("AI_EMBEDDING_MODEL")
                or os.getenv("EMBEDDING_MODEL"))

    @property
    def EMBEDDING_MODEL(self):
        return self.AI_EMBEDDING_MODEL

    @property
    def EMBEDDING_DIMENSIONS(self):
        # all-MiniLM-L6-v2 (HF space + pgvector columns) is 384-dim.
        return int(os.getenv("EMBEDDING_DIMENSIONS", "384"))

    @property
    def OPENAI_API_KEY(self):
        return os.getenv("OPENAI_API_KEY")

    @property
    def GROQ_API_KEY(self):
        return os.getenv("GROQ_API_KEY")

    @property
    def OPENROUTER_API_KEY(self):
        return os.getenv("OPENROUTER_API_KEY")

    @property
    # On-demand Groq tiers enforce ~1000 output tokens/minute. Keep the default
    # below that so a single request cannot exceed the provider limit.
    def AI_MAX_TOKENS(self):
        return int(os.getenv("AI_MAX_TOKENS", "800"))

    @property
    def AI_TEMPERATURE(self):
        return float(os.getenv("AI_TEMPERATURE", "0.7"))

    @property
    def AI_TIMEOUT(self):
        return int(os.getenv("AI_TIMEOUT", "30"))

    @property
    def AI_PROVIDER_REFRESH_SECONDS(self):
        """How often workers re-read the active DB provider rows.

        Admin changes invalidate the manager in the worker that handled the
        request. In a multi-worker deployment the other workers need a cheap
        periodic check; 60 seconds is fast enough for an operator change and
        far cheaper than a database round-trip on every AI call.
        """
        return int(os.getenv("AI_PROVIDER_REFRESH_SECONDS", "60"))

    @property
    def HUGGINGFACE_SPACES_URL(self):
        return os.getenv("HUGGINGFACE_SPACES_URL", "https://syedsyab-recruai.hf.space")

    @property
    def EMBEDDING_MAX_RETRIES(self):
        return int(os.getenv("EMBEDDING_MAX_RETRIES", "3"))

    @property
    def RAG_CHUNK_SIZE(self):
        return int(os.getenv("RAG_CHUNK_SIZE", "1000"))

    @property
    def RAG_CHUNK_OVERLAP(self):
        return int(os.getenv("RAG_CHUNK_OVERLAP", "200"))

    @property
    def RAG_TOP_K(self):
        return int(os.getenv("RAG_TOP_K", "5"))

    @property
    def RAG_SIMILARITY_THRESHOLD(self):
        return float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.7"))

    @property
    def RAG_MAX_CONTEXT_LENGTH(self):
        return int(os.getenv("RAG_MAX_CONTEXT_LENGTH", "8000"))

    @property
    def AI_REQUESTS_PER_MINUTE(self):
        return int(os.getenv("AI_REQUESTS_PER_MINUTE", "60"))

    @property
    def AI_REQUESTS_PER_HOUR(self):
        return int(os.getenv("AI_REQUESTS_PER_HOUR", "1000"))

    @property
    def EMBEDDING_REQUESTS_PER_MINUTE(self):
        return int(os.getenv("EMBEDDING_REQUESTS_PER_MINUTE", "60"))

    @property
    def EMBEDDING_REQUESTS_PER_HOUR(self):
        return int(os.getenv("EMBEDDING_REQUESTS_PER_HOUR", "1000"))

    # LiveKit self-hosted video (1:1 interviews + recording)
    @property
    def LIVEKIT_URL(self):
        # Internal URL for server-side API calls (ws://livekit:7880 in compose)
        return os.getenv("LIVEKIT_URL")

    @property
    def LIVEKIT_PUBLIC_URL(self):
        # wss:// URL handed to browsers (defaults to LIVEKIT_URL)
        return os.getenv("LIVEKIT_PUBLIC_URL") or os.getenv("LIVEKIT_URL")

    @property
    def LIVEKIT_API_KEY(self):
        return os.getenv("LIVEKIT_API_KEY")

    @property
    def LIVEKIT_API_SECRET(self):
        return os.getenv("LIVEKIT_API_SECRET")

    @property
    def LIVEKIT_MAX_CONCURRENT_RECORDINGS(self):
        return int(os.getenv("LIVEKIT_MAX_CONCURRENT_RECORDINGS", "2"))


def _is_production_config(config) -> bool:
    get = config.get if hasattr(config, "get") else config.__getitem__
    try:
        return bool(get("IS_PRODUCTION"))
    except Exception:
        return False


def validate_production_config(config=None) -> list:
    """Fail fast when production is misconfigured. Returns warnings.

    Raises ``RuntimeError`` naming the first missing requirement. Pure
    function of the passed mapping so tests can call it directly; pass
    ``app.config`` from the factory. LiveKit keys are required only when
    video is enabled; AI needs at least one provider key; Resend is required
    because OTP, password reset, and invitations all depend on it.
    """
    source = config if config is not None else os.environ
    if hasattr(source, "get"):
        raw_get = source.get
    else:  # pragma: no cover - defensive; mappings always have .get
        raw_get = source.__getitem__

    def get(name):
        # from_object() copies @property descriptors unevaluated, so a
        # property object here means "read the live environment instead".
        value = raw_get(name)
        if isinstance(value, property):
            value = os.environ.get(name)
        return value

    def required(name):
        value = get(name)
        if value is None or (isinstance(value, str) and not value.strip()):
            raise RuntimeError(
                f"Production config error: {name} is required but missing or empty."
            )
        return value

    warnings = []
    for name in ("SECRET_KEY", "JWT_SECRET_KEY", "RESEND_API_KEY", "OPS_TOKEN"):
        if get(name) in (None, "", "dev-secret-change-in-production"):
            raise RuntimeError(
                f"Production config error: {name} must be set to a real value, not the dev default."
                if "SECRET" in name
                else f"Production config error: {name} is required but missing or empty."
            )
    # The DB URL lives in SQLALCHEMY_DATABASE_URI on the app config and in
    # DATABASE_URL in the environment; accept either.
    db_url = (
        get("DATABASE_URL")
        or get("SQLALCHEMY_DATABASE_URI")
        or os.environ.get("DATABASE_URL")
    )
    if not db_url or not str(db_url).strip():
        raise RuntimeError(
            "Production config error: DATABASE_URL is required but missing or empty."
        )

    if not any(get(k) for k in ("GROQ_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY")):
        raise RuntimeError(
            "Production config error: at least one AI provider key is required "
            "(GROQ_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY)."
        )

    # Rate limits and token revocation must be shared across workers. A
    # disabled Redis silently turns both into per-process memory.
    if not get("REDIS_ENABLED"):
        raise RuntimeError(
            "Production config error: REDIS_ENABLED must be true so limits and "
            "revocations are shared, not per-process memory."
        )

    if str(get("VIDEO_ENABLED") or "0") == "1":
        for name in (
            "LIVEKIT_URL",
            "LIVEKIT_PUBLIC_URL",
            "LIVEKIT_API_KEY",
            "LIVEKIT_API_SECRET",
        ):
            required(name)
        public_url = str(get("LIVEKIT_PUBLIC_URL") or "")
        if not public_url.startswith(("ws://", "wss://")):
            raise RuntimeError(
                "Production config error: LIVEKIT_PUBLIC_URL must be a browser-"
                "reachable ws:// or wss:// URL."
            )
        if public_url.startswith("ws://"):
            warnings.append(
                "LIVEKIT_PUBLIC_URL uses ws://; browsers require wss:// when the "
                "app is served over HTTPS."
            )
    elif not get("LIVEKIT_API_KEY"):
        warnings.append(
            "LIVEKIT_API_KEY is unset; video endpoints will report unconfigured "
            "(expected while VIDEO_ENABLED=0)."
        )

    return warnings
