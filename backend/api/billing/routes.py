import re
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import PaymentMethod, User, TeamMember
from ...utils.security import sanitize_input


ALLOWED_BRANDS = {"Visa", "Mastercard", "Amex", "Discover", "Card"}
_LAST4_RE = re.compile(r"^\d{4}$")


def _current_user_id():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


def _manages_org(user, org_id):
    """Caller may manage this org's billing: org account or team member."""
    if not user or not org_id:
        return False
    try:
        org_id = int(org_id)
    except (TypeError, ValueError):
        return False
    if user.role == "organization" and user.organization_id == org_id:
        return True
    return (
        TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first()
        is not None
    )


def _scope_filter(user_id, organization_id):
    """Cards are scoped per (owner user, org|personal)."""
    query = PaymentMethod.query.filter_by(user_id=user_id)
    if organization_id is None:
        query = query.filter(PaymentMethod.organization_id.is_(None))
    else:
        query = query.filter_by(organization_id=organization_id)
    return query


def _validate_payload(payload):
    """Server-side validation of card metadata (PAN/CVC are never accepted)."""
    brand = sanitize_input(str(payload.get("brand", "Card")))
    last4 = str(payload.get("last4", "")).strip()
    name = sanitize_input(str(payload.get("cardholder_name", "")))
    try:
        exp_month = int(payload.get("exp_month"))
        exp_year = int(payload.get("exp_year"))
    except (TypeError, ValueError):
        return None, (jsonify({"error": "exp_month and exp_year are required"}), 400)

    if brand not in ALLOWED_BRANDS:
        return None, (jsonify({"error": "Unsupported card brand"}), 400)
    if not _LAST4_RE.match(last4):
        return None, (jsonify({"error": "last4 must be exactly 4 digits"}), 400)
    if not name or len(name.strip()) < 2:
        return None, (jsonify({"error": "cardholder_name is required"}), 400)
    if exp_month < 1 or exp_month > 12:
        return None, (jsonify({"error": "exp_month must be 01-12"}), 400)
    # Accept 2-digit years from clients, normalize to 4-digit.
    if exp_year < 100:
        exp_year += 2000
    if exp_year < 2000 or exp_year > 2100:
        return None, (jsonify({"error": "exp_year is out of range"}), 400)
    now = datetime.utcnow()
    if exp_year < now.year or (exp_year == now.year and exp_month < now.month):
        return None, (jsonify({"error": "Card expiry is in the past"}), 400)

    return {
        "brand": brand,
        "last4": last4,
        "cardholder_name": name.strip(),
        "exp_month": exp_month,
        "exp_year": exp_year,
    }, None


@api_bp.route("/payment-methods", methods=["GET"])
@jwt_required()
def list_payment_methods():
    """List the caller's cards. `?organization_id=` scopes to org cards."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    org_param = request.args.get("organization_id")
    if org_param:
        if not _manages_org(user, org_param):
            return jsonify({"error": "Forbidden for this organization"}), 403
        cards = (
            _scope_filter(user_id, int(org_param))
            .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.asc())
            .all()
        )
    else:
        cards = (
            _scope_filter(user_id, None)
            .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.asc())
            .all()
        )
    return jsonify([c.to_dict() for c in cards]), 200


@api_bp.route("/payment-methods", methods=["POST"])
@jwt_required()
def create_payment_method():
    """Save card metadata (brand/last4/expiry/holder only — never PAN/CVC)."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    try:
        payload = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    if not payload:
        return jsonify({"error": "Request body required"}), 400

    org_id = payload.get("organization_id")
    if org_id is not None:
        if not _manages_org(user, org_id):
            return jsonify({"error": "Forbidden for this organization"}), 403
        try:
            org_id = int(org_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid organization_id"}), 400

    fields, error = _validate_payload(payload)
    if error:
        return error

    existing = _scope_filter(user_id, org_id).all()
    card = PaymentMethod(
        user_id=user_id,
        organization_id=org_id,
        is_default=len(existing) == 0,  # first card in scope becomes default
        **fields,
    )
    db.session.add(card)
    db.session.commit()
    return jsonify(card.to_dict()), 201


@api_bp.route("/payment-methods/<int:card_id>/default", methods=["PUT"])
@jwt_required()
def set_default_payment_method(card_id):
    """Mark one of the caller's cards as default within its scope."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    card = PaymentMethod.query.get_or_404(card_id)
    if card.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if card.organization_id is not None:
        user = User.query.get(user_id)
        if not _manages_org(user, card.organization_id):
            return jsonify({"error": "Forbidden for this organization"}), 403

    for sibling in _scope_filter(user_id, card.organization_id).all():
        sibling.is_default = sibling.id == card.id
    db.session.commit()
    return jsonify(card.to_dict()), 200


@api_bp.route("/payment-methods/<int:card_id>", methods=["DELETE"])
@jwt_required()
def delete_payment_method(card_id):
    """Delete one of the caller's cards (promotes oldest sibling if default)."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Invalid user identity"}), 400
    card = PaymentMethod.query.get_or_404(card_id)
    if card.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if card.organization_id is not None:
        user = User.query.get(user_id)
        if not _manages_org(user, card.organization_id):
            return jsonify({"error": "Forbidden for this organization"}), 403

    was_default = card.is_default
    scope_org = card.organization_id
    db.session.delete(card)
    db.session.commit()

    if was_default:
        oldest = (
            _scope_filter(user_id, scope_org)
            .order_by(PaymentMethod.created_at.asc())
            .first()
        )
        if oldest:
            oldest.is_default = True
            db.session.commit()

    return jsonify({"message": "payment method deleted"}), 200
