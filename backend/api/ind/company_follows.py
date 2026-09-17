from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import CompanyFollow, Organization


def _identity():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


# Company follow endpoints (My Network)
@api_bp.route("/company-follows", methods=["POST"])
@jwt_required()
def follow_company():
    payload = request.get_json(silent=True) or {}
    user_id = _identity()
    org_id = payload.get("organization_id")
    if not user_id or not org_id:
        return jsonify({"error": "organization_id required"}), 400

    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "organization not found"}), 404

    existing = CompanyFollow.query.filter_by(user_id=user_id, organization_id=org_id).first()
    if existing:
        return jsonify({"error": "already following"}), 400

    follow = CompanyFollow(user_id=user_id, organization_id=org_id)
    db.session.add(follow)
    db.session.commit()
    return jsonify(follow.to_dict()), 201


@api_bp.route("/company-follows/<int:org_id>", methods=["DELETE"])
@jwt_required()
def unfollow_company(org_id):
    follow = CompanyFollow.query.filter_by(
        user_id=_identity(), organization_id=org_id
    ).first_or_404()
    db.session.delete(follow)
    db.session.commit()
    return jsonify({"message": "unfollowed"}), 200


@api_bp.route("/company-follows", methods=["GET"])
@jwt_required()
def list_company_follows():
    """My Network: followed companies, each with open-role count + latest active job."""
    follows = (
        CompanyFollow.query.filter_by(user_id=_identity())
        .order_by(CompanyFollow.created_at.desc())
        .all()
    )
    return jsonify([f.to_dict(with_latest_post=True) for f in follows]), 200


@api_bp.route("/company-follows/check", methods=["GET"])
@jwt_required()
def check_company_follow():
    org_id = request.args.get("organization_id", type=int)
    if not _identity() or not org_id:
        return jsonify({"error": "organization_id required"}), 400
    follow = CompanyFollow.query.filter_by(
        user_id=_identity(), organization_id=org_id
    ).first()
    return jsonify({"following": follow is not None}), 200
