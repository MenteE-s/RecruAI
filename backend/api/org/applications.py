from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...utils.timezone_utils import utc_now_iso, utc_iso
from ...extensions import db
from ...models import Application, Post, Interview, TeamMember, User
from ...utils.org_permissions import (
    HIRING_MANAGE,
    HIRING_VIEW,
    get_permitted_org_ids,
    has_org_permission,
    invalidate_membership_caches,
)
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params
from ...utils.kafka_service import kafka_service as kafka
from ...utils.cache import (
    invalidate_job_cache,
    cache_get,
    cache_set,
    cache_delete_pattern,
    _build_key,
    CACHE_TTL,
)
from datetime import datetime


def _current_user():
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _managed_org_ids(user, permission=HIRING_VIEW):
    """Org ids where the user has the requested hiring permission."""
    return get_permitted_org_ids(user, permission=permission)


def _can_manage_post(user, post):
    if not user or not post:
        return False
    return has_org_permission(user, post.organization_id, HIRING_MANAGE)


def _can_view_post(user, post):
    if not user or not post:
        return False
    return has_org_permission(user, post.organization_id, HIRING_VIEW)


def _notify_candidate(application, title, message):
    """Persist an in-app notification for the candidate. Never raises —
    a notification failure must not break the status change itself."""
    try:
        from ...models import Notification
        post = application.post
        notification = Notification.create_notification(
            user_id=application.user_id,
            notification_type="application_status",
            title=title,
            message=message,
            related_application_id=application.id,
            related_post_id=application.post_id,
            related_organization_id=post.organization_id if post else None,
        )
        db.session.add(notification)
        db.session.flush()
        try:
            from ...utils.outbox import enqueue_kafka_event

            enqueue_kafka_event('notification_created', {
                'notification_id': notification.id,
                'user_id': application.user_id,
                'type': 'application_status',
                'title': title,
                'related_application_id': application.id,
            })
        except Exception as ke:
            print(f"Failed to queue Kafka message for application notification: {ke}")
        db.session.commit()
    except Exception as e:
        print(f"Failed to create application status notification: {e}")


def _app_names(application):
    post = application.post
    post_title = (post.title if post and post.title else "a position")
    org = getattr(post, "organization", None) if post else None
    org_name = (org.name if org and getattr(org, "name", None) else "The organization")
    return post_title, org_name


# Application endpoints
@api_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_applications():
    """Get applications with pagination, filtering, and sorting support.

    Organization users/team members see their orgs' applications (scoped to
    their own org by default); individuals see only their own.
    """
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request
    filters = get_request_filters(Application)

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    org_ids = _managed_org_ids(user)
    requested = request.args.get('organization_id', type=int)
    if requested:
        if requested not in org_ids:
            return jsonify({"error": "Forbidden for this organization"}), 403
        org_ids = {requested}

    if org_ids:
        # Join with Post to filter by organization
        query = db.session.query(Application).join(Post, Application.post_id == Post.id).filter(Post.organization_id.in_(org_ids))
    else:
        # Individuals with no org ties see only their own applications
        filters['user_id'] = user.id
        query = Application.query

    # Eager-load everything to_dict() touches (candidate, post, org), so a
    # page of N applications stays at a constant query count.
    query = query.options(
        selectinload(Application.user),
        selectinload(Application.post).selectinload(Post.organization),
    )

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response (counts batched: one GROUP BY, not N COUNTs)
    from ...models.post import application_counts as _application_counts

    _items = pagination_result['items']
    _counts = _application_counts([a.post_id for a in _items])
    return jsonify(paginated_response(
        _items,
        pagination_result['pagination'],
        item_serializer=lambda a: a.to_dict(post_counts=_counts),
    )), 200

@api_bp.route("/applications", methods=["POST"])
@jwt_required()
def create_application():
    payload = request.get_json(silent=True) or {}
    # Identity comes from the JWT, never from the client payload.
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    post_id = payload.get("post_id")
    if not post_id:
        return jsonify({"error": "post_id required"}), 400
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "Job post not found"}), 404

    # Only open postings accept applications.
    if getattr(post, "status", None) not in (None, "active", "open"):
        return jsonify({"error": "That job is not accepting applications"}), 400

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

    # Application counts on job cards must refresh + per-user dashboard cache
    invalidate_job_cache(application.post_id)
    try:
        cache_delete_pattern(f"user_applications:*{user_id}*")
    except Exception:
        pass

    # Emit Kafka event for application creation
    kafka.emit_event('application_created', {
        'application_id': application.id,
        'user_id': application.user_id,
        'post_id': application.post_id,
        'pipeline_stage': application.pipeline_stage,
        'timestamp': utc_now_iso()
    })
    
    return jsonify(application.to_dict()), 201

@api_bp.route("/applications/user/<int:user_id>", methods=["GET"])
@jwt_required()
def list_user_applications(user_id):
    """Get applications for a specific user with pagination (own only)."""
    try:
        if int(get_jwt_identity()) != user_id:
            return jsonify({"error": "Forbidden"}), 403
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Cache only the default dashboard shape (no extra filters/sorts) so
    # filtered views never serve stale cross-filter data.
    use_cache = (
        not request.args.get("sort_by")
        and not request.args.get("sort_order")
        and len([k for k in request.args.keys() if k not in ("page", "per_page")]) == 0
    )
    cache_key = _build_key("user_applications", f"user_{user_id}:p{page}:n{per_page}")
    if use_cache:
        try:
            hit = cache_get(cache_key)
            if hit is not None:
                return jsonify(hit), 200
        except Exception:
            pass

    # Get filters from request (excluding user_id since it's in URL)
    filters = get_request_filters(Application)
    filters['user_id'] = user_id  # Force user_id filter

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    # Build base query (eager-load candidate + post + org for to_dict)
    query = Application.query.options(
        selectinload(Application.user),
        selectinload(Application.post).selectinload(Post.organization),
    )

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    payload = paginated_response(pagination_result['items'], pagination_result['pagination'])
    if use_cache:
        try:
            cache_set(cache_key, payload, CACHE_TTL.get("user_applications", 60))
        except Exception:
            pass
    # Return paginated response
    return jsonify(payload), 200

@api_bp.route("/applications/post/<int:post_id>", methods=["GET"])
@jwt_required()
def list_post_applications(post_id):
    """Get applications for a specific post (managing org only)."""
    post = db.get_or_404(Post, post_id)
    if not _can_view_post(_current_user(), post):
        return jsonify({"error": "Forbidden for this organization"}), 403
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request (excluding post_id since it's in URL)
    filters = get_request_filters(Application)
    filters['post_id'] = post_id  # Force post_id filter

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='applied_at')

    # Build base query (eager-load candidate + post + org for to_dict)
    query = Application.query.options(
        selectinload(Application.user),
        selectinload(Application.post).selectinload(Post.organization),
    )

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Application, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response (counts batched: one GROUP BY, not N COUNTs)
    _items = pagination_result['items']
    _counts = _application_counts([a.post_id for a in _items])
    return jsonify(paginated_response(
        _items,
        pagination_result['pagination'],
        item_serializer=lambda a: a.to_dict(post_counts=_counts),
    )), 200

@api_bp.route("/applications/<int:app_id>", methods=["PUT"])
@jwt_required()
def update_application_status(app_id):
    application = db.get_or_404(Application, app_id)
    if not _can_manage_post(_current_user(), application.post):
        return jsonify({"error": "Forbidden for this organization"}), 403
    payload = request.get_json(silent=True) or {}
    allowed_statuses = {"pending", "reviewed", "accepted", "rejected", "withdrawn"}
    allowed_stages = {"applied", "screening", "interview_scheduled", "interview_completed",
                      "offer_extended", "offer_accepted", "hired", "rejected"}
    if "status" in payload:
        if payload["status"] not in allowed_statuses:
            return jsonify({"error": f"Invalid status. Allowed: {sorted(allowed_statuses)}"}), 400
        application.status = payload["status"]
    if "pipeline_stage" in payload:
        if payload["pipeline_stage"] not in allowed_stages:
            return jsonify({"error": f"Invalid pipeline_stage. Allowed: {sorted(allowed_stages)}"}), 400
        application.pipeline_stage = payload["pipeline_stage"]
    # Handle onboarding status update
    if "onboarded" in payload:
        if not isinstance(payload["onboarded"], bool):
            return jsonify({"error": "onboarded must be true or false"}), 400
        application.onboarded = payload["onboarded"]
    db.session.commit()
    
    # Emit Kafka event for application status/stage update
    kafka.emit_event('application_updated', {
        'application_id': application.id,
        'user_id': application.user_id,
        'post_id': application.post_id,
        'status': application.status,
        'pipeline_stage': application.pipeline_stage,
        'updated_at': utc_now_iso()
    })
    
    return jsonify(application.to_dict()), 200


@api_bp.route("/applications/<int:app_id>/onboard", methods=["POST"])
@jwt_required()
def mark_application_onboarded(app_id):
    """Mark an application as onboarded"""
    from datetime import datetime
    application = db.get_or_404(Application, app_id)
    if not _can_manage_post(_current_user(), application.post):
        return jsonify({"error": "Forbidden for this organization"}), 403
    application.onboarded = True
    application.pipeline_stage = "hired"  # Update pipeline stage to hired when onboarded
    
    # Check if team member already exists
    existing_team_member = TeamMember.query.filter_by(
        organization_id=application.post.organization_id,
        user_id=application.user_id
    ).first()
    
    if not existing_team_member:
        # Create team member
        team_member = TeamMember(
            organization_id=application.post.organization_id,
            user_id=application.user_id,
            role='Employee',
            join_date=datetime.utcnow().date()
        )
        db.session.add(team_member)
    
    db.session.commit()
    if not existing_team_member:
        invalidate_membership_caches(application.user_id, application.post.organization_id)
    return jsonify({"message": "Application marked as onboarded", "application": application.to_dict()}), 200


@api_bp.route("/applications/<int:app_id>/offboard", methods=["POST"])
@jwt_required()
def mark_application_offboarded(app_id):
    """Mark an application as not onboarded"""
    application = db.get_or_404(Application, app_id)
    if not _can_manage_post(_current_user(), application.post):
        return jsonify({"error": "Forbidden for this organization"}), 403
    application.onboarded = False
    # Optionally update pipeline stage when offboarding
    db.session.commit()
    return jsonify({"message": "Application marked as not onboarded", "application": application.to_dict()}), 200

@api_bp.route("/pipeline/<int:org_id>", methods=["GET"])
@jwt_required()
def get_pipeline_data(org_id):
    """Get pipeline data for an organization (members only)."""
    user = _current_user()
    if not user or org_id not in _managed_org_ids(user):
        return jsonify({"error": "Forbidden for this organization"}), 403
    # Get all posts for this organization (org eager-loaded for to_dict)
    posts = (
        Post.query.filter_by(organization_id=org_id)
        .options(selectinload(Post.organization))
        .all()
    )
    post_ids = [post.id for post in posts]

    # One query for every application (+ candidate + post + org), one for
    # every interview, instead of per-post/per-application round trips.
    applications = (
        Application.query.filter(Application.post_id.in_(post_ids))
        .options(
            selectinload(Application.user),
            selectinload(Application.post).selectinload(Post.organization),
        )
        .all()
        if post_ids
        else []
    )
    interviews = (
        Interview.query.filter(Interview.post_id.in_(post_ids))
        .options(
            selectinload(Interview.user),
            selectinload(Interview.organization),
            selectinload(Interview.post),
        )
        .all()
        if post_ids
        else []
    )
    apps_by_post = {}
    for app in applications:
        apps_by_post.setdefault(app.post_id, []).append(app)
    interviews_by_post_user = {}
    for interview in interviews:
        # Match the old `.first()` semantics: keep the first row per pair.
        interviews_by_post_user.setdefault((interview.post_id, interview.user_id), interview)

    pipeline_data = []
    counts = _application_counts(post_ids)

    for post in posts:
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

        for app in apps_by_post.get(post.id, []):
            stage = app.pipeline_stage or "applied"
            if stage in stages:
                # Check if there's an associated interview
                interview = interviews_by_post_user.get((post.id, app.user_id))
                stages[stage].append({
                    "application": app.to_dict(post_counts=counts),
                    "interview": interview.to_dict() if interview else None
                })

        pipeline_data.append({
            "post": post.to_dict(application_count=counts.get(post.id, 0)),
            "stages": stages,
            "total_candidates": len(applications)
        })

    return jsonify(pipeline_data), 200

@api_bp.route("/pipeline/application/<int:app_id>/stage", methods=["PUT"])
@jwt_required()
def update_pipeline_stage(app_id):
    """Update pipeline stage for an application"""
    application = db.get_or_404(Application, app_id)
    if not _can_manage_post(_current_user(), application.post):
        return jsonify({"error": "Forbidden for this organization"}), 403
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