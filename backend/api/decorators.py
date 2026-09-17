from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


from ..models import User


def require_auth(fn):
    """Decorator to ensure the incoming request has a valid JWT and return the authenticated user.

    Use this on backend endpoints that need user authentication.
    It verifies the JWT and passes the User object as the first parameter to the decorated function.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Ensure there's a valid JWT first
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "missing or invalid token"}), 401

        # Get user from JWT identity
        uid = get_jwt_identity()
        try:
            user_id = int(uid)
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "user not found"}), 404
        except (ValueError, TypeError):
            return jsonify({"error": "invalid user identity"}), 400

        # Call the decorated function with user as first argument
        return fn(user, *args, **kwargs)

    return wrapper


def organization_required(fn):
    """Decorator to ensure the incoming request has a JWT with role=="organization".

    Use this on backend endpoints that return or mutate organization-scoped data.
    It relies on the `role` claim being present in the JWT (we set it at login/registration).
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Ensure there's a valid JWT first
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "missing or invalid token"}), 401

        claims = get_jwt()
        role = claims.get("role")
        if role != "organization":
            return jsonify({"error": "forbidden: organization membership required"}), 403

        return fn(*args, **kwargs)

    return wrapper
