from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import SavedJob

# Saved jobs endpoints
@api_bp.route("/saved-jobs", methods=["POST"])
def save_job():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    post_id = payload.get("post_id")
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    # Check if already saved
    existing = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        return jsonify({"error": "job already saved"}), 400

    saved_job = SavedJob(user_id=user_id, post_id=post_id)
    db.session.add(saved_job)
    db.session.commit()
    return jsonify(saved_job.to_dict()), 201

@api_bp.route("/saved-jobs/<int:saved_id>", methods=["DELETE"])
def unsave_job(saved_id):
    saved_job = SavedJob.query.get_or_404(saved_id)
    db.session.delete(saved_job)
    db.session.commit()
    return jsonify({"message": "job unsaved"}), 200

@api_bp.route("/saved-jobs/user/<int:user_id>", methods=["GET"])
def list_saved_jobs(user_id):
    saved_jobs = SavedJob.query.filter_by(user_id=user_id).order_by(SavedJob.saved_at.desc()).all()
    return jsonify([sj.to_dict() for sj in saved_jobs]), 200

@api_bp.route("/saved-jobs/check", methods=["GET"])
def check_saved():
    user_id = request.args.get("user_id", type=int)
    post_id = request.args.get("post_id", type=int)
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    saved = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    return jsonify({"saved": saved is not None, "saved_id": saved.id if saved else None}), 200