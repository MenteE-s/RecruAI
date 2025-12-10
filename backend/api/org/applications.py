from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Application, Post, Interview
from sqlalchemy import func
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params

# Application endpoints
@api_bp.route("/applications", methods=["GET"])
def get_applications():
    """Get applications with pagination, filtering, and sorting support"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request
    filters = get_request_filters(Application)

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    # Build base query
    query = Application.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200

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
        pipeline_stage="applied"
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201

@api_bp.route("/applications/user/<int:user_id>", methods=["GET"])
def list_user_applications(user_id):
    """Get applications for a specific user with pagination"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request (excluding user_id since it's in URL)
    filters = get_request_filters(Application)
    filters['user_id'] = user_id  # Force user_id filter

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    # Build base query
    query = Application.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200

@api_bp.route("/applications/post/<int:post_id>", methods=["GET"])
def list_post_applications(post_id):
    """Get applications for a specific post with pagination"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request (excluding post_id since it's in URL)
    filters = get_request_filters(Application)
    filters['post_id'] = post_id  # Force post_id filter

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    # Build base query
    query = Application.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200

@api_bp.route("/applications/<int:app_id>", methods=["PUT"])
def update_application_status(app_id):
    application = Application.query.get_or_404(app_id)
    payload = request.get_json(silent=True) or {}
    if "status" in payload:
        application.status = payload["status"]
    if "pipeline_stage" in payload:
        application.pipeline_stage = payload["pipeline_stage"]
    db.session.commit()
    return jsonify(application.to_dict()), 200

@api_bp.route("/pipeline/<int:org_id>", methods=["GET"])
def get_pipeline_data(org_id):
    """Get pipeline data for an organization"""
    # Get all posts for this organization
    posts = Post.query.filter_by(organization_id=org_id).all()

    pipeline_data = []

    for post in posts:
        # Get applications for this post
        applications = Application.query.filter_by(post_id=post.id).all()

        # Group applications by pipeline stage
        stages = {
            "applied": [],
            "screening": [],
            "interview_scheduled": [],
            "interview_completed": [],
            "offer_extended": [],
            "offer_accepted": [],
            "hired": [],
            "rejected": []
        }

        for app in applications:
            stage = app.pipeline_stage or "applied"
            if stage in stages:
                # Check if there's an associated interview
                interview = Interview.query.filter_by(post_id=post.id, user_id=app.user_id).first()
                stages[stage].append({
                    "application": app.to_dict(),
                    "interview": interview.to_dict() if interview else None
                })

        pipeline_data.append({
            "post": post.to_dict(),
            "stages": stages,
            "total_candidates": len(applications)
        })

    return jsonify(pipeline_data), 200

@api_bp.route("/pipeline/application/<int:app_id>/stage", methods=["PUT"])
def update_pipeline_stage(app_id):
    """Update pipeline stage for an application"""
    application = Application.query.get_or_404(app_id)
    payload = request.get_json(silent=True) or {}
    new_stage = payload.get("pipeline_stage")

    if not new_stage:
        return jsonify({"error": "pipeline_stage is required"}), 400

    # Validate stage
    valid_stages = ["applied", "screening", "interview_scheduled", "interview_completed", "offer_extended", "offer_accepted", "hired", "rejected"]
    if new_stage not in valid_stages:
        return jsonify({"error": "Invalid pipeline stage"}), 400

    application.pipeline_stage = new_stage
    db.session.commit()

    return jsonify(application.to_dict()), 200