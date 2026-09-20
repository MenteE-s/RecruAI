from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ..decorators import organization_required
from ...extensions import db
from ...models import (
    User, Experience, Education, Skill, Project, Certification,
    Award, Language, VolunteerExperience, Reference, HobbyInterest,
    ProfessionalMembership, Patent, CourseTraining, SocialMediaLink, KeyAchievement,
    Favorite, Application, Post, Interview, TeamMember
)
from ...utils.timezone_utils import get_timezone_list, is_valid_timezone, get_current_time_info
from ...utils.security import log_security_event, sanitize_input, validate_email, validate_request_size
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params
from ...api.notifications.routes import create_profile_notification
from ...utils.kafka_service import kafka_service
from ...utils.cache import cached, invalidate_user_cache


def _own_id_or_403(user_id):
    """Caller may act only as themselves; returns None or a 403 tuple."""
    try:
        if int(get_jwt_identity()) != int(user_id):
            return jsonify({"error": "Forbidden"}), 403
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    return None


@api_bp.route("/timezones", methods=["GET"])
def list_timezones():
    """Get list of available timezones for user selection."""
    return jsonify(get_timezone_list()), 200


@api_bp.route("/users/<int:user_id>/timezone", methods=["PUT"])
@jwt_required()
def update_user_timezone(user_id):
    """Update user's timezone preference (own account only)."""
    denied = _own_id_or_403(user_id)
    if denied:
        return denied
    user = User.query.get_or_404(user_id)

    try:
        payload = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", request.remote_addr, user_id)
        return jsonify({"error": "Invalid JSON in request body"}), 400

    # Validate request size
    is_valid, error_msg = validate_request_size(payload)
    if not is_valid:
        log_security_event("request_size_exceeded", request.remote_addr, user_id, details={"error": error_msg})
        return jsonify({"error": error_msg}), 400

    tz = sanitize_input(payload.get("timezone", ""))

    if not tz:
        log_security_event("missing_timezone", request.remote_addr, user_id)
        return jsonify({"error": "timezone required"}), 400

    if not is_valid_timezone(tz):
        log_security_event("invalid_timezone", request.remote_addr, user_id, details={"timezone": tz})
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400

    user.timezone = tz
    db.session.commit()

    log_security_event("timezone_updated", request.remote_addr, user_id, details={"timezone": tz})

    # Emit Kafka event
    kafka_service.emit_event(
        "user_updated",
        {
            "user_id": user.id,
            "field": "timezone",
            "value": tz,
            "message": f"User {user.name} updated their timezone to {tz}"
        }
    )

    return jsonify({
        "message": "Timezone updated",
        "user": user.to_dict(),
        "current_time": get_current_time_info(tz),
    }), 200


@api_bp.route("/users/<int:user_id>/current-time", methods=["GET"])
@jwt_required()
def get_user_current_time(user_id):
    """Get current time information in user's timezone (auth required to prevent ID enumeration)."""
    user = User.query.get_or_404(user_id)
    tz = user.timezone or "UTC"
    return jsonify(get_current_time_info(tz)), 200


@api_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    """List users (organization-side hiring directory).

    Individuals may not dump the user directory; organization accounts and
    team members may browse candidates.
    """
    try:
        me = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    if not me:
        return jsonify({"error": "user not found"}), 404
    manages_any = bool(me.organization_id) or (
        TeamMember.query.filter_by(user_id=me.id).first() is not None
    )
    if me.role != "organization" and not manages_any:
        return jsonify({"error": "Forbidden: organization account required"}), 403
    # Get pagination parameters (capped at 100 by Pagination)
    page, per_page = get_pagination_params()
    # Cap directory pages to prevent mass scraping
    per_page = min(per_page, 20)

    # Security: allowlist filters/sorts for hiring directory. Never expose
    # email/phone/tokens/lockout fields as filters, sorts, or output.
    ALLOWED_FILTERS = {"name", "headline", "location", "role", "employment_status"}
    ALLOWED_SORTS = {"name", "created_at", "headline"}

    raw_filters = get_request_filters(User)
    filters = {k: v for k, v in raw_filters.items() if k in ALLOWED_FILTERS}
    # Force candidate-only view
    filters["role"] = "individual"

    sort_by, sort_order = get_sorting_params(default_sort='created_at')
    if sort_by not in ALLOWED_SORTS:
        sort_by = "created_at"

    # Build base query
    query = User.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, User, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Log access for security monitoring
    log_security_event("users_list_accessed", request.remote_addr, None,
                      details={"page": page, "per_page": per_page, "total": pagination_result['pagination']['total']})

    def _directory_serializer(u):
        return {
            "id": u.id,
            "name": u.name,
            "headline": u.headline,
            "location": u.location,
            "role": u.role,
            "profile_picture": u.profile_picture,
            "employment_status": u.employment_status,
            "current_position": u.current_position,
            "current_company": u.current_company,
        }

    # Return paginated response with minimal DTO (no email/phone/PII)
    return jsonify(paginated_response(
        pagination_result['items'],
        pagination_result['pagination'],
        item_serializer=_directory_serializer,
    )), 200


@api_bp.route("/users", methods=["POST"])
@organization_required
def create_user():
    try:
        payload = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", request.remote_addr, None)
        return jsonify({"error": "Invalid JSON in request body"}), 400

    # Validate request size
    is_valid, error_msg = validate_request_size(payload)
    if not is_valid:
        log_security_event("request_size_exceeded", request.remote_addr, None, details={"error": error_msg})
        return jsonify({"error": error_msg}), 400

    email = sanitize_input(payload.get("email", ""))
    name = sanitize_input(payload.get("name", ""))
    role = sanitize_input(payload.get("role", "individual"))

    if not email:
        log_security_event("missing_email_create_user", request.remote_addr, None)
        return jsonify({"error": "email required"}), 400

    if role not in ("individual", "organization"):
        return jsonify({"error": "Invalid role specified"}), 400

    # Validate email format
    if not validate_email(email):
        log_security_event("invalid_email_format", request.remote_addr, None, email=email)
        return jsonify({"error": "Invalid email format"}), 400

    # Check for existing user
    if User.query.filter_by(email=email).first():
        log_security_event("duplicate_user_creation_attempt", request.remote_addr, None, email=email)
        return jsonify({"error": "email already exists"}), 400

    # Security: never create passwordless accounts — require a password so
    # the account cannot be claimed via OTP-only flow, and start unverified.
    password = (payload or {}).get("password", "") or ""
    if not password:
        return jsonify({"error": "password required"}), 400
    user = User(email=email, name=name, role=role, email_verified=False)
    try:
        user.set_password(password)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    # Bind organization-role users to caller's org to avoid orphan org accounts.
    if role == "organization":
        try:
            from flask_jwt_extended import get_jwt_identity as _gj
            caller = User.query.get(int(_gj()))
        except (TypeError, ValueError):
            caller = None
        requested_org = (payload or {}).get("organization_id")
        try:
            requested_org = int(requested_org) if requested_org is not None else None
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid organization_id"}), 400
        org_id = requested_org or (caller.organization_id if caller else None)
        if not org_id:
            return jsonify({"error": "organization_id required for organization users"}), 400
        # Caller must manage the target org (own org account or team member).
        from ...models import TeamMember as _TM
        allowed = caller is not None and (
            (caller.role == "organization" and caller.organization_id == org_id)
            or _TM.query.filter_by(organization_id=org_id, user_id=caller.id).first() is not None
        )
        if not allowed:
            return jsonify({"error": "Forbidden for this organization"}), 403
        user.organization_id = org_id
    db.session.add(user)
    db.session.commit()

    log_security_event("user_created", request.remote_addr, user.id, email=email)

    # Emit Kafka event
    kafka_service.emit_event(
        "user_created",
        {
            "user_id": user.id,
            "email": email,
            "name": name,
            "message": f"New user created: {name} ({email})"
        }
    )

    return jsonify(user.to_dict()), 201


@api_bp.route("/users/<int:user_id>/full-profile", methods=["GET"])
@jwt_required()
# Security: the view enforces a per-requester relationship check, so the
# requester must be part of the cache key. A target-only key would serve one
# requester's authorized response to an unrelated requester on a cache HIT
# (the HIT path returns before the view body runs).
@cached("user_profile", ttl=300, key_func=lambda user_id: f"{get_jwt_identity()}:user_{user_id}")
def get_user_full_profile(user_id):
    """Full profile: the user themselves, or a hiring manager whose org has
    an application or interview relationship with that user."""
    try:
        me_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    me = User.query.get_or_404(me_id)
    if me.id != int(user_id):
        managed_ids = set()
        if me.organization_id:
            managed_ids.add(me.organization_id)
        for tm in TeamMember.query.filter_by(user_id=me.id).all():
            managed_ids.add(tm.organization_id)
        related = False
        if managed_ids:
            related = (
                Application.query.join(Post, Application.post_id == Post.id)
                .filter(
                    Application.user_id == user_id,
                    Post.organization_id.in_(managed_ids),
                )
                .first()
                is not None
            ) or (
                Interview.query.filter(
                    Interview.user_id == user_id,
                    Interview.organization_id.in_(managed_ids),
                ).first()
                is not None
            )
        if not related:
            return jsonify({"error": "Forbidden"}), 403
    user = User.query.get_or_404(user_id)

    # Get all profile data
    profile_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "experiences": [exp.to_dict() for exp in user.experiences],
        "educations": [edu.to_dict() for edu in user.educations],
        "skills": [skill.to_dict() for skill in user.skills],
        "projects": [proj.to_dict() for proj in user.projects],
        "certifications": [cert.to_dict() for cert in user.certifications],
        "awards": [award.to_dict() for award in user.awards],
        "languages": [lang.to_dict() for lang in user.languages],
        "volunteer_experiences": [vol.to_dict() for vol in user.volunteer_experiences],
        "references": [ref.to_dict() for ref in user.references],
        "hobby_interests": [hobby.to_dict() for hobby in user.hobby_interests],
        "professional_memberships": [mem.to_dict() for mem in user.professional_memberships],
        "patents": [pat.to_dict() for pat in user.patents],
        "course_trainings": [course.to_dict() for course in user.course_trainings],
        "social_media_links": [link.to_dict() for link in user.social_media_links],
        "key_achievements": [ach.to_dict() for ach in user.key_achievements],
    }

    return jsonify(profile_data), 200


@api_bp.route("/users/<int:user_id>/toggle-favorite/<int:target_user_id>", methods=["POST"])
@jwt_required()
def toggle_favorite(user_id, target_user_id):
    """Toggle favorite status for a user (own list only)."""
    denied = _own_id_or_403(user_id)
    if denied:
        return denied
    # Check if the favorite relationship already exists
    favorite = Favorite.query.filter_by(
        user_id=user_id, 
        target_user_id=target_user_id
    ).first()
    
    if favorite:
        # If favorite exists, remove it (unfavorite)
        db.session.delete(favorite)
        db.session.commit()

        # Emit Kafka event
        kafka_service.emit_event(
            "favorite_toggled",
            {
                "user_id": user_id,
                "target_user_id": target_user_id,
                "favorited": False,
                "message": "User removed from favorites"
            }
        )

        return jsonify({
            "favorited": False,
            "message": "User unfavorited successfully"
        }), 200
    else:
        # If favorite doesn't exist, create it (favorite)
        # Check if both users exist
        user = User.query.get_or_404(user_id)
        target_user = User.query.get_or_404(target_user_id)
        
        favorite = Favorite(
            user_id=user_id,
            target_user_id=target_user_id
        )
        db.session.add(favorite)
        db.session.commit()

        # Emit Kafka event
        kafka_service.emit_event(
            "favorite_toggled",
            {
                "user_id": user_id,
                "target_user_id": target_user_id,
                "favorited": True,
                "message": f"User {target_user.name} added to favorites"
            }
        )

        # Create notification for the favorited user
        try:
            create_profile_notification(
                user_id=target_user.id,
                notification_type="profile_favorited",
                title=f"Profile Favorited by {user.name}",
                message=f"Your profile has been favorited by {user.name} from {user.organization.name if user.organization else 'an organization'}.",
                related_user_id=user.id,
                related_org_id=user.organization_id if user.organization else None
            )
        except Exception as e:
            print(f"Failed to create favorite notification: {e}")

        return jsonify({
            "favorited": True,
            "message": "User favorited successfully"
        }), 201


@api_bp.route("/users/<int:user_id>/favorites", methods=["GET"])
@jwt_required()
def get_favorites(user_id):
    """Get list of favorited users for a specific user (own list only)."""
    denied = _own_id_or_403(user_id)
    if denied:
        return denied
    user = User.query.get_or_404(user_id)
    
    # Get pagination parameters
    page, per_page = get_pagination_params()
    
    # Build query for favorites
    query = Favorite.query.filter_by(user_id=user_id)
    
    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()
    
    # Convert favorites to user objects
    favorited_users = []
    for fav in pagination_result['items']:
        favorited_users.append(fav.target_user.to_dict())
    
    # Return paginated response
    return jsonify(paginated_response(favorited_users, pagination_result['pagination'])), 200


@api_bp.route("/users/<int:user_id>/is-favorite/<int:target_user_id>", methods=["GET"])
@jwt_required()
def is_favorite(user_id, target_user_id):
    """Check if a user is favorited by another user (own list only)."""
    denied = _own_id_or_403(user_id)
    if denied:
        return denied
    favorite = Favorite.query.filter_by(
        user_id=user_id,
        target_user_id=target_user_id
    ).first()
    
    return jsonify({
        "favorited": favorite is not None
    }), 200


@api_bp.route("/users/<int:user_id>/join-position", methods=["POST"])
@jwt_required()
def join_position(user_id):
    """Allow a candidate to join/accept their hired position (own account only)."""
    from datetime import datetime
    from ...models import Application

    denied = _own_id_or_403(user_id)
    if denied:
        return denied
    user = User.query.get_or_404(user_id)

    # Check if user is hired
    if user.employment_status != 'hired':
        return jsonify({"error": "User is not in hired status"}), 400

    # Update user's employment status to working
    user.employment_status = 'working'
    user.onboarded_date = datetime.utcnow()

    # Find and update the application
    application = Application.query.filter_by(
        user_id=user_id,
        pipeline_stage='hired'
    ).first()

    if application:
        application.onboarded = True
        application.pipeline_stage = 'hired'  # Keep as hired but mark as onboarded

    db.session.commit()

    # Emit Kafka event
    kafka_service.emit_event(
        "user_onboarded",
        {
            "user_id": user.id,
            "name": user.name,
            "onboarded_date": user.onboarded_date.isoformat() if user.onboarded_date else None,
            "message": f"User {user.name} has successfully joined their new position"
        }
    )

    return jsonify({
        "message": "Successfully joined position",
        "user": user.to_dict()
    }), 200


@api_bp.route("/users/me/referrals", methods=["GET"])
@jwt_required()
def get_my_referrals():
    """List users who were referred by the current user."""
    user_id = int(get_jwt_identity())
    me = User.query.get_or_404(user_id)

    referrals = User.query.filter_by(referred_by_user_id=user_id).order_by(User.created_at.desc()).all()

    return jsonify({
        "total": len(referrals),
        "referrals": [
            {
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "role": r.role,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in referrals
        ]
    }), 200
