"""Self-service subscription for individuals.

There is no payment processor in the MVP, so this endpoint is the
*substitute for billing*: an individual can upgrade their own account to
paid/trial and thereby unlock CVAI (quizzes, guided projects, mock
interviews, mentorship). Everything here is idempotent and auditable, so it
can be replaced by a real checkout flow later without changing the contract.

Routes live on api_bp so the email-verification guard applies.
"""
from datetime import datetime, timedelta

from flask import request, jsonify
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
    """Upgrade the caller to an active paid subscription.

    Idempotent: an already-active subscription returns the current state.
    Sets subscription_status="active", paid_plan=True, and backfills
    trial_start_date so is_trial_active() stays consistent.
    """
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.email_verified:
        return jsonify({
            "error": "Verify your email before subscribing",
        }), 403

    data = request.get_json(silent=True) or {}
    plan = (data.get("plan") or "paid").lower()
    if plan not in ("paid", "trial"):
        return jsonify({"error": "plan must be 'paid' or 'trial'"}), 400

    if user.is_subscription_active():
        return jsonify({
            "message": "Subscription already active",
            "subscription": user.get_subscription_status(),
        }), 200

    now = datetime.utcnow()
    user.subscription_status = "active"
    user.paid_plan = True
    if plan == "trial":
        user.trial_start_date = now
    elif not user.trial_start_date:
        user.trial_start_date = now
    db.session.commit()

    return jsonify({
        "message": f"Subscribed to {plan} plan",
        "subscription": user.get_subscription_status(),
    }), 200


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
