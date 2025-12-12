from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Application
from datetime import datetime

# Applied jobs endpoints
@api_bp.route("/applied-jobs/user/<int:user_id>", methods=["GET"])
def list_applied_jobs(user_id):
    applications = Application.query.filter_by(user_id=user_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api_bp.route("/applied-jobs/<int:application_id>", methods=["GET"])
def get_application_details(application_id):
    application = Application.query.get_or_404(application_id)
    return jsonify(application.to_dict()), 200

@api_bp.route("/applied-jobs/<int:application_id>", methods=["DELETE"])
def cancel_application(application_id):
    """Cancel/withdraw a job application"""
    application = Application.query.get_or_404(application_id)

    # Only allow cancellation if application is still pending or in early stages
    if application.status in ['accepted', 'rejected']:
        return jsonify({"error": "Cannot cancel an application that has already been accepted or rejected"}), 400

    try:
        application.status = "withdrawn"
        application.pipeline_stage = "withdrawn"
        application.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Application cancelled successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to cancel application"}), 500