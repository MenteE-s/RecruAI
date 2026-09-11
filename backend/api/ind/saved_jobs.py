from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import SavedJob
from ...utils.kafka_service import KafkaService


def _identity():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

# Saved jobs endpoints
@api_bp.route("/saved-jobs", methods=["POST"])
@jwt_required()
def save_job():
    payload = request.get_json(silent=True) or {}
    # Identity comes from the JWT, never from the client payload.
    user_id = _identity()
    post_id = payload.get("post_id")
    if not user_id or not post_id:
        return jsonify({"error": "post_id required"}), 400

    # Check if already saved
    existing = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        return jsonify({"error": "job already saved"}), 400

    saved_job = SavedJob(user_id=user_id, post_id=post_id)
    db.session.add(saved_job)
    db.session.commit()
    
    # Emit Kafka event for job saved
    try:
        kafka = KafkaService()
        kafka.emit_event('job_saved', {
            'user_id': user_id,
            'post_id': post_id,
            'saved_at': saved_job.saved_at.isoformat() if saved_job.saved_at else None
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for job save: {ke}")
        
    return jsonify(saved_job.to_dict()), 201

@api_bp.route("/saved-jobs/<int:saved_id>", methods=["DELETE"])
@jwt_required()
def unsave_job(saved_id):
    saved_job = SavedJob.query.get_or_404(saved_id)
    if saved_job.user_id != _identity():
        return jsonify({"error": "Forbidden"}), 403
    user_id = saved_job.user_id
    post_id = saved_job.post_id
    
    db.session.delete(saved_job)
    db.session.commit()
    
    # Emit Kafka event for job unsaved
    try:
        kafka = KafkaService()
        kafka.emit_event('job_unsaved', {
            'user_id': user_id,
            'post_id': post_id
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for job unsave: {ke}")
        
    return jsonify({"message": "job unsaved"}), 200

@api_bp.route("/saved-jobs/user/<int:user_id>", methods=["GET"])
@jwt_required()
def list_saved_jobs(user_id):
    if _identity() != user_id:
        return jsonify({"error": "Forbidden"}), 403
    saved_jobs = SavedJob.query.filter_by(user_id=user_id).order_by(SavedJob.saved_at.desc()).all()
    return jsonify([sj.to_dict() for sj in saved_jobs]), 200

@api_bp.route("/saved-jobs/check", methods=["GET"])
@jwt_required()
def check_saved():
    user_id = _identity()
    post_id = request.args.get("post_id", type=int)
    if not user_id or not post_id:
        return jsonify({"error": "post_id required"}), 400

    saved = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    return jsonify({"saved": saved is not None, "saved_id": saved.id if saved else None}), 200