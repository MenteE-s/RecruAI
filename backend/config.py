import os
from dotenv import load_dotenv


# Load backend/.env so imports that evaluate at module import time (like
# Config.SQLALCHEMY_DATABASE_URI) pick up the DATABASE_URL when CLI or
# scripts import this module from repo root.
here = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(here, ".env"))


class Config:
    """Default configuration. Reads DATABASE_URL from env.

    DATABASE_URL example: postgresql://user:pass@host:5432/dbname
    """

    # Detect if we're in production (Railway sets RAILWAY_ENVIRONMENT)
    IS_PRODUCTION = os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("PRODUCTION") == "1"

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        # Local dev default: prefer Postgres at default creds per developer request.
        "postgresql://postgres:mentee@localhost:5432/recruia",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security: Strong secret keys required
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY and IS_PRODUCTION:
        raise ValueError("SECRET_KEY environment variable is required in production")
    elif not SECRET_KEY:
        SECRET_KEY = "dev-secret-change-in-production"  # Better default for dev

    # JWT uses its own key, but default to SECRET_KEY when not provided
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    # Security: Enhanced JWT cookie settings
    JWT_TOKEN_LOCATION = os.getenv("JWT_TOKEN_LOCATION", "cookies").split(",")
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "1" if IS_PRODUCTION else "0") == "1"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Strict" if IS_PRODUCTION else "Lax")
    # Enable CSRF protection in production for additional security
    JWT_COOKIE_CSRF_PROTECT = os.getenv("JWT_COOKIE_CSRF_PROTECT", "1" if IS_PRODUCTION else "0") == "1"

    # Security: Shorter token expiration for better security
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "2")))  # 2 hours instead of 24

    # Security: Request size limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max request size

    # CORS configuration - auto-detect based on environment
    FRONTEND_ORIGIN = os.getenv(
        "FRONTEND_ORIGIN",
        "https://recruai-production.vercel.app" if IS_PRODUCTION else "http://localhost:3000"
    )

    # API configuration
    API_BASE_URL = os.getenv(
        "API_BASE_URL",
        "https://recruai-production.up.railway.app" if IS_PRODUCTION else "http://localhost:5000"
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
