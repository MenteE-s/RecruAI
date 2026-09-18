"""Blueprint-level request guards, registered once at import time.

Lives here (not in the app factory) because `python -m backend.app`
executes the app module twice, and Flask forbids blueprint setup calls
after first registration. This module is imported exactly once via
`backend.api`, so the guard registers exactly once.
"""

from flask import jsonify, request as freq
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from . import api_bp


# Security: verified-email gate. Unverified accounts are never issued a
# usable token (register mints none, login refuses, OTP-verify flips the
# flag before minting), but this closes the loop if a token ever exists
# pre-verification: any authenticated call with an unverified identity is
# rejected except logout. Requests without a token (public endpoints and
# the auth flows themselves) pass through untouched.
@api_bp.before_request
def require_verified_email():
    try:
        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            return None  # route-level auth handles bad tokens
        uid = get_jwt_identity()
        if uid is None:
            return None
        if freq.endpoint in {"api.logout"}:
            return None
        try:
            user_id = int(uid)
        except (TypeError, ValueError):
            return None
        from ..models import User

        user = User.query.get(user_id)
        if user is not None and not user.email_verified:
            return jsonify({"error": "Please verify your email first.", "code": "email_not_verified"}), 403
        return None
    except Exception:
        return None
