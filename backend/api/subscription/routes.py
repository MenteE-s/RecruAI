"""Subscription status for individuals.

Paid self-service is intentionally closed during the controlled beta. The
old endpoint acted as a free upgrade: it set ``paid_plan=True`` without a
payment and let an expired account restart its trial by posting
``{"plan": "trial"}``. It now returns 410 and never mutates the account.

Admin grants still use the superadmin-only /api/admin users and
organizations endpoints. A real Stripe checkout can replace this route later
without changing the status contract below.
"""
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import User


def _current_user_id():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


@api_bp.route("/subscription/status", methods=["GET"])
@jwt_required()
def subscription_status():
    """The caller's subscription state and what it unlocks."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.get_subscription_status()), 200


@api_bp.route("/subscription/upgrade", methods=["POST"])
@jwt_required()
def subscription_upgrade():
    """Close paid self-service during the controlled beta.

    This endpoint deliberately does not touch the database. It is the only
    public path that used to grant paid access for free and to reset an
    expired trial; a real checkout/webhook flow must add its own verified
    payment state before this can return 200 again.
    """
    return jsonify({
        "error": "Paid plans are not available during the beta.",
        "code": "billing_disabled",
        "billing_enabled": False,
    }), 410


@api_bp.route("/subscription/cancel", methods=["POST"])
@jwt_required()
def subscription_cancel():
    """Cancel the caller's paid subscription (downgrades to lapsed/basic)."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.is_subscription_active():
        return jsonify({
            "message": "No active subscription to cancel",
            "subscription": user.get_subscription_status(),
        }), 200

    user.subscription_status = "cancelled"
    user.paid_plan = False
    db.session.commit()

    return jsonify({
        "message": "Subscription cancelled",
        "subscription": user.get_subscription_status(),
    }), 200
