from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from .. import api_bp
from ...extensions import db
from ...models import Post, Organization, User, TeamMember
import json


def _can_manage_org(user, org_id):
    """Caller may mutate this org's posts: own org account or team member."""
    if not user or not org_id:
        return False
    try:
        org_id = int(org_id)
    except (TypeError, ValueError):
        return False
    if user.role == "organization" and user.organization_id == org_id:
        return True
    return TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first() is not None
from datetime import datetime
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params
from ...utils.kafka_service import kafka_service as kafka
from ...utils.cache import cached, invalidate_job_cache


def _parse_salary(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        raise ValueError("Invalid salary value")

@api_bp.route("/organizations/<int:org_id>/posts", methods=["GET"])
def list_posts_for_org(org_id):
    org = Organization.query.get_or_404(org_id)
    return jsonify([p.to_dict() for p in org.posts])

@api_bp.route("/posts", methods=["POST"])
@jwt_required()
def create_post():
    try:
        payload = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400

    org_id = payload.get("organization_id")
    title = payload.get("title")

    if not org_id or not title:
        return jsonify({"error": "organization_id and title required"}), 400

    try:
        caller = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        caller = None
    if not _can_manage_org(caller, org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403

    if len(title.strip()) < 3:
        return jsonify({"error": "title must be at least 3 characters"}), 400

    try:
        salary_min_value = _parse_salary(payload.get("salary_min"))
        salary_max_value = _parse_salary(payload.get("salary_max"))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if (
        salary_min_value is not None
        and salary_max_value is not None
        and salary_min_value > salary_max_value
    ):
        return jsonify({"error": "salary_min cannot be greater than salary_max"}), 400

    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "organization not found"}), 404

    # Parse application deadline if provided
    application_deadline = None
    if payload.get("application_deadline"):
        try:
            # Handle ISO format strings from frontend
            deadline_str = payload["application_deadline"]
            if deadline_str.endswith('Z'):
                deadline_str = deadline_str[:-1] + '+00:00'
            application_deadline = datetime.fromisoformat(deadline_str).date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid application_deadline format"}), 400

    # Validate and serialize requirements
    requirements = payload.get("requirements")
    if requirements is not None:
        try:
            requirements_json = json.dumps(requirements)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid requirements format - must be JSON serializable"}), 400
    else:
        requirements_json = None

    try:
        post = Post(
            organization_id=org_id,
            title=title,
            description=payload.get("description"),
            location=payload.get("location"),
            employment_type=payload.get("employment_type"),
            category=payload.get("category"),
            salary_min=salary_min_value,
            salary_max=salary_max_value,
            salary_currency=payload.get("salary_currency", "USD"),
            requirements=requirements_json,
            application_deadline=application_deadline,
            status=payload.get("status", "active"),
        )
        db.session.add(post)
        db.session.commit()
        
        # Invalidate job caches
        invalidate_job_cache()
        
        # Emit Kafka event for post creation
        kafka.emit_event('job_post_created', {
            'post_id': post.id,
            'organization_id': post.organization_id,
            'title': post.title,
            'status': post.status,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify(post.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save job: {str(e)}"}), 500

@api_bp.route("/posts/<int:post_id>", methods=["PUT"])
@jwt_required()
def update_post(post_id):
    post = Post.query.get_or_404(post_id)

    try:
        caller = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        caller = None
    if not _can_manage_org(caller, post.organization_id):
        return jsonify({"error": "Forbidden for this organization"}), 403

    payload = request.get_json(silent=True) or {}

    # Update fields
    if "title" in payload:
        post.title = payload["title"]
    if "description" in payload:
        post.description = payload["description"]
    if "location" in payload:
        post.location = payload["location"]
    if "employment_type" in payload:
        post.employment_type = payload["employment_type"]
    if "category" in payload:
        post.category = payload["category"]
    if "salary_min" in payload:
        try:
            post.salary_min = _parse_salary(payload["salary_min"])
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
    if "salary_max" in payload:
        try:
            post.salary_max = _parse_salary(payload["salary_max"])
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

    if (
        post.salary_min is not None
        and post.salary_max is not None
        and post.salary_min > post.salary_max
    ):
        return jsonify({"error": "salary_min cannot be greater than salary_max"}), 400
    if "salary_currency" in payload:
        post.salary_currency = payload["salary_currency"]
    if "requirements" in payload:
        if payload["requirements"] is not None:
            try:
                post.requirements = json.dumps(payload["requirements"])
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid requirements format - must be JSON serializable"}), 400
        else:
            post.requirements = None
    if "application_deadline" in payload:
        if payload["application_deadline"]:
            try:
                # Handle ISO format strings from frontend
                deadline_str = payload["application_deadline"]
                if deadline_str.endswith('Z'):
                    deadline_str = deadline_str[:-1] + '+00:00'
                post.application_deadline = datetime.fromisoformat(deadline_str).date()
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid application_deadline format"}), 400
        else:
            post.application_deadline = None
    if "status" in payload:
        post.status = payload["status"]

    try:
        db.session.commit()

        # Invalidate job caches
        invalidate_job_cache(post.id)
        
        # Emit Kafka event for post update
        kafka.emit_event('job_post_updated', {
            'post_id': post.id,
            'organization_id': post.organization_id,
            'title': post.title,
            'status': post.status,
            'updated_at': datetime.utcnow().isoformat()
        })
        
        return jsonify(post.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update job: {str(e)}"}), 500

@api_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    try:
        caller = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        caller = None
    if not _can_manage_org(caller, post.organization_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    try:
        post_id_val = post.id
        org_id_val = post.organization_id
        db.session.delete(post)
        db.session.commit()

        # Invalidate job caches
        invalidate_job_cache(post_id_val)
        
        # Emit Kafka event for post deletion
        kafka.emit_event('job_post_deleted', {
            'post_id': post_id_val,
            'organization_id': org_id_val,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({"message": "post deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete job: {str(e)}"}), 500

@api_bp.route("/posts", methods=["GET"])
@cached("job_listings", ttl=600)
def list_posts():
    """List posts with pagination, filtering, and sorting support"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request
    filters = get_request_filters(Post)

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='created_at')

    # Build base query - only show active posts by default
    query = Post.query.filter(Post.status == 'active')

    # Full-text search over title / requirements / description / category.
    # (The generic column filters below can't express `search`, so handle it here.)
    search_text = (request.args.get('search') or '').strip()
    if search_text:
        doc = (
            func.setweight(func.to_tsvector('english', func.coalesce(Post.title, '')), 'A')
            .op('||')(func.setweight(func.to_tsvector('english', func.coalesce(Post.requirements, '')), 'B'))
            .op('||')(func.setweight(func.to_tsvector('english', func.coalesce(Post.description, '')), 'C'))
            .op('||')(func.setweight(func.to_tsvector(
                'english',
                func.coalesce(Post.category, '') + ' ' + func.coalesce(Post.location, ''),
            ), 'D'))
        )
        tsq = func.plainto_tsquery('english', search_text[:500])
        query = query.filter(func.ts_rank(doc, tsq) > 1e-6).order_by(func.ts_rank(doc, tsq).desc())

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Post, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200

@api_bp.route("/posts/<int:post_id>", methods=["GET"])
@cached("job_details", ttl=300, key_func=lambda post_id: f"post_{post_id}")
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify(post.to_dict())