from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


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
    """Decorator to ensure the caller is currently an organization account.

    Security: the role is re-read from the database at the decision point,
    never trusted from the JWT `role` claim alone — claims stay valid until
    token expiry, so a demoted user would otherwise keep org-only access
    (e.g. POST /api/users) for up to JWT_ACCESS_TOKEN_EXPIRES.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Ensure there's a valid JWT first (revocation included)
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "missing or invalid token"}), 401

        uid = get_jwt_identity()
        try:
            user = User.query.get(int(uid))
        except (TypeError, ValueError):
            return jsonify({"error": "invalid user identity"}), 400
        if not user or user.role != "organization":
            return jsonify({"error": "forbidden: organization membership required"}), 403

        return fn(*args, **kwargs)

    return wrapper
