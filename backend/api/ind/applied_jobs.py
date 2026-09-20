from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Application
from ...utils.kafka_service import kafka_service
from ...utils.cache import cache_get, cache_set, cache_delete_pattern, _build_key, CACHE_TTL
from datetime import datetime


def _identity():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

# Applied jobs endpoints
@api_bp.route("/applied-jobs/user/<int:user_id>", methods=["GET"])
@jwt_required()
def list_applied_jobs(user_id):
    if _identity() != user_id:
        return jsonify({"error": "Forbidden"}), 403
    cache_key = _build_key("user_applications", f"applied_user_{user_id}")
    try:
        hit = cache_get(cache_key)
        if hit is not None:
            return jsonify(hit), 200
    except Exception:
        pass
    applications = Application.query.filter_by(user_id=user_id).order_by(Application.applied_at.desc()).all()
    payload = [app.to_dict() for app in applications]
    try:
        cache_set(cache_key, payload, CACHE_TTL.get("user_applications", 60))
    except Exception:
        pass
    return jsonify(payload), 200

@api_bp.route("/applied-jobs/<int:application_id>", methods=["GET"])
@jwt_required()
def get_application_details(application_id):
    application = Application.query.get_or_404(application_id)
    if application.user_id != _identity():
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(application.to_dict()), 200

@api_bp.route("/applied-jobs/<int:application_id>", methods=["DELETE"])
@jwt_required()
def cancel_application(application_id):
    """Cancel/withdraw a job application"""
    application = Application.query.get_or_404(application_id)
    if application.user_id != _identity():
        return jsonify({"error": "Forbidden"}), 403

    # Only allow cancellation if application is still pending or in early stages
    if application.status in ['accepted', 'rejected']:
        return jsonify({"error": "Cannot cancel an application that has already been accepted or rejected"}), 400

    try:
        application.status = "withdrawn"
        application.pipeline_stage = "withdrawn"
        application.updated_at = datetime.utcnow()
        db.session.commit()
        try:
            cache_delete_pattern(f"user_applications:*{application.user_id}*")
        except Exception:
            pass
        
        # Emit Kafka event for application withdrawn
        try:
            kafka_service.emit_event('application_withdrawn', {
                'application_id': application.id,
                'user_id': application.user_id,
                'post_id': application.post_id,
                'withdrawn_at': utc_iso(application.updated_at)
            })
        except Exception as ke:
            print(f"Failed to emit Kafka message for application withdrawal: {ke}")
            
        return jsonify({"message": "Application cancelled successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to cancel application"}), 500