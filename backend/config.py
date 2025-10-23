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

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        # sensible local default for dev so migrations can run without Postgres
        "sqlite:///recruai_dev.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    # JWT uses its own key, but default to SECRET_KEY when not provided
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
