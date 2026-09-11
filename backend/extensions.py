from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import os
import redis
import logging

logger = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
# Default origins; create_app() overrides with the configured FRONTEND_ORIGIN
# list at init_app time. Never "*" in production (breaks credentialed CORS).
_default_origins = [o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")]
socketio = SocketIO(cors_allowed_origins=_default_origins, async_mode="threading")

# Redis client — initialized in app factory
redis_client = None


def init_redis(app):
    """Initialize Redis connection pool and register with app."""
    global redis_client
    if not app.config.get("REDIS_ENABLED", False):
        logger.info("Redis is disabled by configuration")
        return None

    try:
        redis_url = app.config.get("REDIS_URL", "redis://127.0.0.1:6379/0")
        max_connections = app.config.get("REDIS_MAX_CONNECTIONS", 20)

        pool = redis.ConnectionPool.from_url(
            redis_url,
            max_connections=max_connections,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
        redis_client = redis.Redis(connection_pool=pool)
        redis_client.ping()

        # Store in app extensions for cache utilities to access
        app.extensions["redis_client"] = redis_client

        print(f"Redis connected at {redis_url}")
        logger.info(f"Redis connected at {redis_url}")
        return redis_client
    except redis.ConnectionError as e:
        logger.warning(f"Redis connection failed: {e}. Caching disabled.")
        app.extensions["redis_client"] = None
        return None
    except Exception as e:
        logger.warning(f"Redis initialization error: {e}. Caching disabled.")
        app.extensions["redis_client"] = None
        return None
