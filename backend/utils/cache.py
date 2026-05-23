"""
Secure Redis caching utilities for the RecruAI backend.

Features:
- Connection pooling for performance
- Key prefixing to prevent collisions
- Configurable TTL per cache type
- Graceful fallback when Redis is unavailable
- Cache invalidation helpers
- Input sanitization for cache keys
"""

import json
import hashlib
import logging
import functools
from typing import Any, Callable, Optional
from flask import request, jsonify

logger = logging.getLogger(__name__)

# Cache TTL defaults (in seconds)
CACHE_TTL = {
    "user_profile": 300,       # 5 min
    "job_listings": 600,       # 10 min
    "org_details": 300,        # 5 min
    "agent_config": 900,       # 15 min
    "general": 120,            # 2 min
}

# Security: Key prefix to isolate this app's data
CACHE_PREFIX = "recruai:v1:"

# Security: Max key length to prevent abuse
MAX_KEY_LENGTH = 250


def _sanitize_key(key: str) -> str:
    """Sanitize and normalize cache keys to prevent injection."""
    if len(key) > MAX_KEY_LENGTH:
        key = hashlib.sha256(key.encode()).hexdigest()
    return key.replace(":", "_").replace(" ", "_")


def _build_key(resource: str, identifier: str) -> str:
    """Build a namespaced, sanitized cache key."""
    raw = f"{CACHE_PREFIX}{resource}:{identifier}"
    return _sanitize_key(raw)


def _get_redis_client():
    """Get Redis client from app extensions, with graceful fallback."""
    try:
        from flask import current_app
        return current_app.extensions.get("redis_client")
    except RuntimeError:
        return None


def cache_get(key: str) -> Optional[Any]:
    """Retrieve a value from cache. Returns None on miss or error."""
    client = _get_redis_client()
    if not client:
        return None
    try:
        raw = client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Cache GET failed for key {key}: {e}")
        return None


def cache_set(key: str, value: Any, ttl: int = 120) -> bool:
    """Store a value in cache with TTL. Returns False on error."""
    client = _get_redis_client()
    if not client:
        print(f"[CACHE] No Redis client available for key: {key}")
        return False
    try:
        client.setex(key, ttl, json.dumps(value, default=str))
        print(f"[CACHE] SET {key} (TTL: {ttl}s)")
        return True
    except Exception as e:
        print(f"[CACHE] SET failed for {key}: {e}")
        return False


def cache_delete(key: str) -> bool:
    """Delete a key from cache. Returns False on error."""
    client = _get_redis_client()
    if not client:
        return False
    try:
        client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache DELETE failed for key {key}: {e}")
        return False


def cache_delete_pattern(pattern: str) -> bool:
    """Delete all keys matching a pattern (e.g., 'recruai:v1:user_profile:*')."""
    client = _get_redis_client()
    if not client:
        return False
    try:
        # Must sanitize the same way _build_key does (replaces : with _)
        search_key = _sanitize_key(f"{CACHE_PREFIX}{pattern}")
        keys = client.keys(search_key)
        if keys:
            client.delete(*keys)
            logger.info(f"Cache invalidated {len(keys)} keys matching {pattern}")
        return True
    except Exception as e:
        logger.warning(f"Cache DELETE pattern failed for {pattern}: {e}")
        return False


def cached(resource: str, ttl: Optional[int] = None, key_func: Optional[Callable] = None):
    """
    Decorator to cache Flask route responses.

    Args:
        resource: Cache namespace (e.g., 'user_profile', 'job_listings')
        ttl: Time-to-live in seconds (defaults to CACHE_TTL[resource])
        key_func: Custom function to build cache key from request.
                  Defaults to using the request path + query string.
    """
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            client = _get_redis_client()
            if not client:
                return f(*args, **kwargs)

            # Build cache key
            if key_func:
                identifier = key_func(*args, **kwargs)
            else:
                identifier = f"{request.path}:{request.query_string.decode()}"

            cache_key = _build_key(resource, identifier)
            effective_ttl = ttl or CACHE_TTL.get(resource, CACHE_TTL["general"])

            # Try cache first
            cached_data = cache_get(cache_key)
            if cached_data is not None:
                print(f"[CACHE] HIT: {cache_key}")
                return jsonify(cached_data), 200

            # Cache miss — call the actual function
            print(f"[CACHE] MISS: {cache_key}")
            response = f(*args, **kwargs)

            # Extract JSON data from response
            try:
                if isinstance(response, tuple):
                    data, status_code = response[0], response[1]
                else:
                    data, status_code = response, 200

                if status_code == 200 and hasattr(data, "get_json"):
                    json_data = data.get_json()
                    if json_data:
                        cache_set(cache_key, json_data, effective_ttl)
            except Exception as e:
                logger.warning(f"Failed to cache response for {cache_key}: {e}")

            return response
        return wrapper
    return decorator


# ---- Cache invalidation helpers ----

def invalidate_user_cache(user_id: int) -> None:
    """Invalidate all cached data for a specific user."""
    cache_delete_pattern(f"user_profile:*{user_id}*")
    cache_delete_pattern(f"users:*{user_id}*")


def invalidate_job_cache(job_id: Optional[int] = None) -> None:
    """Invalidate job listing caches."""
    if job_id:
        cache_delete_pattern(f"job_details:*{job_id}*")
    cache_delete_pattern("job_listings:*")


def invalidate_org_cache(org_id: Optional[int] = None) -> None:
    """Invalidate organization caches."""
    if org_id:
        cache_delete_pattern(f"org_details:*{org_id}*")
    cache_delete_pattern("org_listings:*")
