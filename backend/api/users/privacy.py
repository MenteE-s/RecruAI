"""Account data export and deletion endpoints.

Both endpoints require the current password even though the caller already has
an access token. An XSS-stolen token must not be able to download every profile
field or destroy the account; the password is the second factor.

Deletion is a two-phase operation: this endpoint revokes sessions and starts a
30-day grace period, and the scheduler worker performs the hard purge.
"""

from datetime import datetime

from flask import jsonify, make_response, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from .. import api_bp
from ...extensions import db
from ...models import AccountDeletion, User
from ...utils.account_deletion import request_account_deletion
from ...utils.account_export import export_as_json
from ...utils.security import log_security_event, verify_password


def _caller():
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _password_from_body():
    payload = request.get_json(silent=True) or {}
    value = payload.get("password")
    return value if isinstance(value, str) else ""


def _reject_deleted(user):
    if user and user.deleted_at:
        return jsonify({
            "error": "This account has been deleted.",
            "code": "account_deleted",
        }), 410
    return None


@api_bp.route("/users/me/export", methods=["POST"])
@jwt_required()
def export_my_data():
    """Download a JSON copy of the caller's account data."""
    user = _caller()
    if not user:
        return jsonify({"error": "User not found"}), 404
    deleted = _reject_deleted(user)
    if deleted:
        return deleted

    if not user.password_hash:
        return jsonify({
            "error": "Set a password before exporting your data.",
            "code": "password_required",
        }), 400

    if not verify_password(user.password_hash, _password_from_body()):
        log_security_event(
            "account_export_reauth_failed",
            user_id=str(user.id),
            ip_address=request.remote_addr,
        )
        return jsonify({
            "error": "Password is incorrect.",
            "code": "invalid_password",
        }), 403

    body = export_as_json(user)
    date = datetime.utcnow().strftime("%Y-%m-%d")
    response = make_response(body)
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="recruai-account-{user.id}-{date}.json"'
    )
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    log_security_event(
        "account_export_downloaded",
        user_id=str(user.id),
        ip_address=request.remote_addr,
    )
    return response


@api_bp.route("/users/me", methods=["DELETE"])
@jwt_required()
def delete_my_account():
    """Schedule permanent deletion after a 30-day grace period."""
    user = _caller()
    if not user:
        return jsonify({"error": "User not found"}), 404
    deleted = _reject_deleted(user)
    if deleted:
        return deleted

    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason") if isinstance(payload.get("reason"), str) else ""
    ok, body, status = request_account_deletion(
        user,
        _password_from_body(),
        reason=reason,
        ip_address=request.remote_addr,
    )
    return jsonify(body), status


@api_bp.route("/users/me/deletion", methods=["GET"])
@jwt_required()
def deletion_status():
    """Show the scheduled deletion date (used by Settings)."""
    user = _caller()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not user.deleted_at:
        return jsonify({"scheduled": False}), 200
    audit = (
        AccountDeletion.query
        .filter_by(user_id=user.id)
        .order_by(AccountDeletion.id.desc())
        .first()
    )
    return jsonify({
        "scheduled": True,
        "deleted_at": user.deleted_at.isoformat() + "Z",
        "scheduled_for": (
            user.deletion_scheduled_for.isoformat() + "Z"
            if user.deletion_scheduled_for else None
        ),
        "status": audit.status if audit else "scheduled",
    }), 200
