from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Application

# Applied jobs endpoints
@api_bp.route("/applied-jobs/user/<int:user_id>", methods=["GET"])
def list_applied_jobs(user_id):
    applications = Application.query.filter_by(user_id=user_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api_bp.route("/applied-jobs/<int:application_id>", methods=["GET"])
def get_application_details(application_id):
    application = Application.query.get_or_404(application_id)
    return jsonify(application.to_dict()), 200