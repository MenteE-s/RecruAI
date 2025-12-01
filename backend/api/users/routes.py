from flask import request, jsonify

from .. import api_bp
from ...extensions import db
from ...models import (
    User, Experience, Education, Skill, Project, Certification,
    Award, Language, VolunteerExperience, Reference, HobbyInterest,
    ProfessionalMembership, Patent, CourseTraining, SocialMediaLink, KeyAchievement
)
from ...utils.timezone_utils import get_timezone_list, is_valid_timezone, get_current_time_info


@api_bp.route("/timezones", methods=["GET"])
def list_timezones():
    """Get list of available timezones for user selection."""
    return jsonify(get_timezone_list()), 200


@api_bp.route("/users/<int:user_id>/timezone", methods=["PUT"])
def update_user_timezone(user_id):
    """Update user's timezone preference."""
    user = User.query.get_or_404(user_id)
    payload = request.get_json(silent=True) or {}
    
    tz = payload.get("timezone")
    if not tz:
        return jsonify({"error": "timezone required"}), 400
    
    if not is_valid_timezone(tz):
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400
    
    user.timezone = tz
    db.session.commit()
    
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
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@api_bp.route("/users", methods=["POST"])
def create_user():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    name = payload.get("name")
    if not email:
        return jsonify({"error": "email required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already exists"}), 400

    user = User(email=email, name=name)
    db.session.add(user)
    db.session.commit()
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
