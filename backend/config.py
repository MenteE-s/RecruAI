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
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    # JWT uses its own key, but default to SECRET_KEY when not provided
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    # Default JWT cookie settings: use cookies for tokens (safer than localStorage
    # if the frontend is configured to use them). These can be overridden via
    # environment variables for flexibility.
    JWT_TOKEN_LOCATION = os.getenv("JWT_TOKEN_LOCATION", "cookies").split(",")
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "1" if IS_PRODUCTION else "0") == "1"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "None" if IS_PRODUCTION else "Lax")
    # protect cookies with CSRF double-submit cookie if true
    # By default disable CSRF protection for cookies in local dev to keep the
    # client simple; enable in production by setting JWT_COOKIE_CSRF_PROTECT=1
    # and handling the CSRF token on the client side.
    JWT_COOKIE_CSRF_PROTECT = os.getenv("JWT_COOKIE_CSRF_PROTECT", "0") == "1"

    # JWT token expiration: 24 hours by default
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24")))

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
