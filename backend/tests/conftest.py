"""Backend integration-test harness.

The suite runs against a real PostgreSQL database because the application
depends on PostgreSQL behaviour (row locks, unique constraints, pgvector) that
SQLite cannot reproduce. Tests never touch the application schema: they use a
dedicated schema that is dropped and recreated for each session, then truncated
between tests.

Environment:
    TEST_DATABASE_URL     PostgreSQL URL (required)
    TEST_DATABASE_SCHEMA  isolated schema name (default: recruai_test)

The schema name or database name must contain "test"; this is a guard against
someone pointing the suite at a real database by accident.
"""

from datetime import datetime, timedelta
import os
from pathlib import Path
import re
import sys

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _database_url() -> str:
    raw = (os.environ.get("TEST_DATABASE_URL") or "").strip()
    if not raw:
        raise pytest.UsageError(
            "TEST_DATABASE_URL is required. Point it at a disposable PostgreSQL "
            "database, e.g. postgresql://recruai:recruai_pass@localhost:5432/recruai_test"
        )
    url = make_url(raw)
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg2")
    return url.render_as_string(hide_password=False)


TEST_DATABASE_URL = _database_url()
TEST_DATABASE_SCHEMA = (
    os.environ.get("TEST_DATABASE_SCHEMA", "").strip() or "recruai_test"
)

if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", TEST_DATABASE_SCHEMA):
    raise pytest.UsageError(
        "TEST_DATABASE_SCHEMA must be a simple PostgreSQL identifier"
    )

_parsed_url = make_url(TEST_DATABASE_URL)
_database_name = (_parsed_url.database or "").lower()
if "test" not in _database_name and "test" not in TEST_DATABASE_SCHEMA.lower():
    raise pytest.UsageError(
        "Refusing to run: TEST_DATABASE_URL/TEST_DATABASE_SCHEMA do not look "
        "like test targets. Use a database or schema whose name contains 'test'."
    )


def _admin_engine():
    """Short-lived engine for schema setup, independent of the app engine."""
    return create_engine(TEST_DATABASE_URL, pool_pre_ping=True)


def _prepare_schema():
    engine = _admin_engine()
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            # The app's vector columns need the extension. It normally lives in
            # public; the test search_path includes public so the type resolves.
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            except Exception as exc:  # pragma: no cover - environment setup
                raise pytest.UsageError(
                    "Could not ensure the pgvector extension exists. Install it "
                    "in the test database or use the pgvector/pgvector image."
                ) from exc
            conn.execute(
                text(f'DROP SCHEMA IF EXISTS "{TEST_DATABASE_SCHEMA}" CASCADE')
            )
            conn.execute(text(f'CREATE SCHEMA "{TEST_DATABASE_SCHEMA}"'))
    finally:
        engine.dispose()


def _drop_schema():
    engine = _admin_engine()
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(
                text(f'DROP SCHEMA IF EXISTS "{TEST_DATABASE_SCHEMA}" CASCADE')
            )
    finally:
        engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _schema():
    _prepare_schema()
    yield
    _drop_schema()


@pytest.fixture(scope="session", autouse=True)
def _silence_external_services():
    """Keep tests hermetic even if a developer's backend/.env enables Kafka."""
    try:
        from backend.utils.kafka_service import kafka_service

        kafka_service.producer = None
    except Exception:
        pass
    yield


class TestConfig:
    """Explicit test configuration; never reads production provider secrets."""

    TESTING = True
    IS_PRODUCTION = False
    SECRET_KEY = "test-secret-key-not-for-production"
    JWT_SECRET_KEY = "test-jwt-secret-not-for-production"
    SQLALCHEMY_DATABASE_URI = TEST_DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"options": f"-csearch_path={TEST_DATABASE_SCHEMA},public"}
    }

    REDIS_ENABLED = False
    RATELIMIT_ENABLED = False
    RATELIMIT_STORAGE_URL = "memory://"
    KAFKA_ENABLED = False
    RAG_ENABLED = False

    FRONTEND_ORIGIN = "http://localhost:3000"
    REFRESH_COOKIE_SECURE = False
    REFRESH_COOKIE_SAMESITE = "Lax"
    REFRESH_COOKIE_PATH = "/api/auth"
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = "Lax"
    ENABLE_AUDIT_LOG = False
    ENABLE_HSTS = False

    RESEND_API_KEY = None
    OPENAI_API_KEY = None
    GROQ_API_KEY = None
    OPENROUTER_API_KEY = None

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_DIGITS = True
    PASSWORD_REQUIRE_SPECIAL = False
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    REFRESH_TOKEN_TTL_DAYS = 30
    REFRESH_REUSE_GRACE_SECONDS = 10


@pytest.fixture(scope="session")
def app(_schema, _silence_external_services):
    from backend import create_app
    from backend.extensions import db

    application = create_app(TestConfig)
    with application.app_context():
        # Importing models is what populates db.metadata. The app import already
        # does this through the route modules; keep it explicit for clarity.
        import backend.models  # noqa: F401

        # checkfirst=False because the application schema (public) may already
        # contain these tables in a shared development database; checkfirst
        # would then skip creating them in the isolated test schema.
        db.metadata.create_all(bind=db.engine, checkfirst=False)
    yield application
    with application.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture(autouse=True)
def app_context(app):
    """Give every test an app context and empty tables on exit."""
    from backend.extensions import db

    with app.app_context():
        yield
        db.session.rollback()
        db.session.remove()
        _truncate_all_tables(db)


def _truncate_all_tables(db):
    tables = [
        f'"{TEST_DATABASE_SCHEMA}"."{table.name}"'
        for table in db.metadata.sorted_tables
    ]
    if not tables:
        return
    db.session.execute(
        text("TRUNCATE TABLE " + ", ".join(tables) + " RESTART IDENTITY CASCADE")
    )
    db.session.commit()
    db.session.remove()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_user(app):
    from backend.extensions import db
    from backend.models import User

    counter = {"n": 0}

    def _make(
        email=None,
        password="TestPass123",
        verified=True,
        name="Test User",
        role="individual",
        organization_id=None,
        **kwargs,
    ):
        counter["n"] += 1
        email = email or f"user{counter['n']}@example.com"
        user = User(
            email=email,
            name=name,
            role=role,
            email_verified=verified,
            email_verified_at=datetime.utcnow() if verified else None,
            organization_id=organization_id,
            **kwargs,
        )
        if password:
            user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    return _make


@pytest.fixture
def make_org(app):
    from backend.extensions import db
    from backend.models import Organization

    counter = {"n": 0}

    def _make(name=None, slug=None, **kwargs):
        counter["n"] += 1
        org = Organization(
            name=name or f"Test Org {counter['n']}",
            slug=slug or f"test-org-{counter['n']}",
            **kwargs,
        )
        db.session.add(org)
        db.session.commit()
        return org

    return _make


@pytest.fixture
def make_member(app):
    from backend.extensions import db
    from backend.models import TeamMember

    def _make(org, user, role="Member"):
        member = TeamMember(
            organization_id=org.id,
            user_id=user.id,
            role=role,
        )
        db.session.add(member)
        db.session.commit()
        return member

    return _make


@pytest.fixture
def auth_headers(app):
    from flask_jwt_extended import create_access_token

    def _headers(user, version=None):
        claims = {
            "role": user.role,
            "organization_id": user.organization_id,
            "ver": int(user.token_version if version is None else version),
        }
        token = create_access_token(
            identity=str(user.id), additional_claims=claims
        )
        return {"Authorization": f"Bearer {token}"}

    return _headers


def refresh_cookie(client, name="refresh_token"):
    cookie = client.get_cookie(name)
    return cookie.value if cookie else None


def cookie_header(raw_token, name="refresh_token"):
    return {"Cookie": f"{name}={raw_token}"}


class RateLimitTestConfig(TestConfig):
    RATELIMIT_ENABLED = True


@pytest.fixture
def rate_limit_client(_schema):
    from backend import create_app

    application = create_app(RateLimitTestConfig)
    return application.test_client()
