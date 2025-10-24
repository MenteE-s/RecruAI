from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


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
