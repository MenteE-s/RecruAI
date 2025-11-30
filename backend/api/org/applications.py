from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Application

# Application endpoints
@api_bp.route("/applications", methods=["GET"])
def get_applications():
    """Get applications for current user's organization posts"""
    # TODO: Add JWT authentication to get current user
    # For now, return all applications (will be filtered by organization later)
    applications = Application.query.order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api_bp.route("/applications", methods=["POST"])
def create_application():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    post_id = payload.get("post_id")
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    # Check if user already applied
    existing = Application.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        return jsonify({"error": "already applied to this job"}), 400

    application = Application(
        user_id=user_id,
        post_id=post_id,
        cover_letter=payload.get("cover_letter"),
        resume_url=payload.get("resume_url"),
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201

@api_bp.route("/applications/user/<int:user_id>", methods=["GET"])
def list_user_applications(user_id):
    applications = Application.query.filter_by(user_id=user_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api_bp.route("/applications/post/<int:post_id>", methods=["GET"])
def list_post_applications(post_id):
    applications = Application.query.filter_by(post_id=post_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api_bp.route("/applications/<int:app_id>", methods=["PUT"])
def update_application_status(app_id):
    application = Application.query.get_or_404(app_id)
    payload = request.get_json(silent=True) or {}
    if "status" in payload:
        application.status = payload["status"]
    db.session.commit()
    return jsonify(application.to_dict()), 200