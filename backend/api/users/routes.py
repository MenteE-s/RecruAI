from flask import request, jsonify

from .. import api_bp
from ...extensions import db
from ...models import (
    User, Experience, Education, Skill, Project, Certification,
    Award, Language, VolunteerExperience, Reference, HobbyInterest,
    ProfessionalMembership, Patent, CourseTraining, SocialMediaLink, KeyAchievement,
    Favorite
)
from ...utils.timezone_utils import get_timezone_list, is_valid_timezone, get_current_time_info
from ...utils.security import log_security_event, sanitize_input, validate_email, validate_request_size
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params


@api_bp.route("/timezones", methods=["GET"])
def list_timezones():
    """Get list of available timezones for user selection."""
    return jsonify(get_timezone_list()), 200


@api_bp.route("/users/<int:user_id>/timezone", methods=["PUT"])
def update_user_timezone(user_id):
    """Update user's timezone preference."""
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

    return jsonify({
        "message": "Timezone updated",
        "user": user.to_dict(),
        "current_time": get_current_time_info(tz),
    }), 200


@api_bp.route("/users/<int:user_id>/current-time", methods=["GET"])
def get_user_current_time(user_id):
    """Get current time information in user's timezone."""
    user = User.query.get_or_404(user_id)
    tz = user.timezone or "UTC"
    return jsonify(get_current_time_info(tz)), 200


@api_bp.route("/users", methods=["GET"])
def list_users():
    """List users with pagination, filtering, and sorting support"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request
    filters = get_request_filters(User)

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='created_at')

    # Build base query
    query = User.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, User, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Log access for security monitoring
    log_security_event("users_list_accessed", request.remote_addr, None,
                      details={"page": page, "per_page": per_page, "total": pagination_result['pagination']['total']})

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200


@api_bp.route("/users", methods=["POST"])
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

    if not email:
        log_security_event("missing_email_create_user", request.remote_addr, None)
        return jsonify({"error": "email required"}), 400

    # Validate email format
    if not validate_email(email):
        log_security_event("invalid_email_format", request.remote_addr, None, email=email)
        return jsonify({"error": "Invalid email format"}), 400

    # Check for existing user
    if User.query.filter_by(email=email).first():
        log_security_event("duplicate_user_creation_attempt", request.remote_addr, None, email=email)
        return jsonify({"error": "email already exists"}), 400

    user = User(email=email, name=name)
    db.session.add(user)
    db.session.commit()

    log_security_event("user_created", request.remote_addr, user.id, email=email)
    return jsonify(user.to_dict()), 201


@api_bp.route("/users/<int:user_id>/full-profile", methods=["GET"])
def get_user_full_profile(user_id):
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
def toggle_favorite(user_id, target_user_id):
    """Toggle favorite status for a user"""
    # Check if the favorite relationship already exists
    favorite = Favorite.query.filter_by(
        user_id=user_id, 
        target_user_id=target_user_id
    ).first()
    
    if favorite:
        # If favorite exists, remove it (unfavorite)
        db.session.delete(favorite)
        db.session.commit()
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
        return jsonify({
            "favorited": True,
            "message": "User favorited successfully"
        }), 201


@api_bp.route("/users/<int:user_id>/favorites", methods=["GET"])
def get_favorites(user_id):
    """Get list of favorited users for a specific user"""
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
def is_favorite(user_id, target_user_id):
    """Check if a user is favorited by another user"""
    favorite = Favorite.query.filter_by(
        user_id=user_id,
        target_user_id=target_user_id
    ).first()
    
    return jsonify({
        "favorited": favorite is not None
    }), 200
