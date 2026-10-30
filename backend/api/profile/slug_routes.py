"""Public profiles addressed by slug: /in/<slug>.

The numeric-id route is gone from the product; a slug is the handle people
share and print. This serves the public view of a person and lets them claim
or change their own handle.
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import sanitize_input, log_security_event
from ...utils.timezone_utils import utc_iso
from ...utils.slug import (
    RESERVED, MIN_USER_SLUG_LEN, MAX_USER_SLUG_LEN,
    generate_unique_slug, is_valid_slug, slug_taken,
)


def _me():
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


# Public profile collections are eager-loaded together so a single profile
# view costs a constant number of queries instead of one per section. Built
# lazily because backrefs are registered when the other model modules import.
def _public_profile_loads():
    return (
        selectinload(User.experiences),
        selectinload(User.educations),
        selectinload(User.skills),
        selectinload(User.projects),
        selectinload(User.certifications),
        selectinload(User.awards),
        selectinload(User.publications),
        selectinload(User.languages),
        selectinload(User.volunteer_experiences),
        selectinload(User.social_media_links),
        selectinload(User.profile_sections),
    )


def _public_user_payload(user):
    """Public fields only: no email, phone, plan, org ownership or referral."""
    about = None
    for section in user.profile_sections:
        if section.section_type == "about":
            about = section.to_dict().get("section_data") or {}
            break

    return {
        "id": user.id,
        "name": user.name,
        "slug": user.profile_slug,
        "headline": user.headline,
        "current_position": user.current_position,
        "current_company": user.current_company,
        "location": user.location,
        "profile_picture": user.profile_picture,
        "banner": user.banner,
        "employment_status": user.employment_status,
        "website": user.website,
        "linkedin": user.linkedin,
        "created_at": utc_iso(user.created_at),
        "about": about,
        "experiences": [exp.to_dict() for exp in user.experiences],
        "educations": [edu.to_dict() for edu in user.educations],
        "skills": [skill.to_dict() for skill in user.skills],
        "projects": [proj.to_dict() for proj in user.projects],
        "certifications": [cert.to_dict() for cert in user.certifications],
        "awards": [award.to_dict() for award in user.awards],
        "publications": [pub.to_dict() for pub in user.publications],
        "languages": [lang.to_dict() for lang in user.languages],
        "volunteer_experiences": [vol.to_dict() for vol in user.volunteer_experiences],
        "social_media_links": [link.to_dict() for link in user.social_media_links],
    }


@api_bp.route("/in/<slug>", methods=["GET"])
def get_public_profile_by_slug(slug):
    """Public profile for a slug. Open, so a shared link works signed out."""
    clean = sanitize_input(slug or "", max_length=30).strip().lower()
    if not clean:
        return jsonify({"error": "Not found"}), 404

    user = (
        User.query.options(*_public_profile_loads())
        .filter(func.lower(User.profile_slug) == clean)
        .first()
    )
    # No slug match: a shared link may carry the numeric id instead,
    # the same fallback the org and job endpoints offer. Slugs are
    # generated from names, so a numeric segment can only be an id.
    if not user and clean.isdigit():
        user = (
            User.query.options(*_public_profile_loads())
            .filter(User.id == int(clean))
            .first()
        )
    if not user:
        return jsonify({"error": "Not found"}), 404

    # Privacy: a person's public profile must not disclose which company pages
    # they administer. organization_id is a pointer to a page they created or
    # were invited to, which is not the same claim as "I work here".
    #
    # Declared employment is fine and still shows: current_position and
    # current_company are profile fields the person controls, as are the
    # Experience entries. So someone can list a role at Honey Beee Lane if they
    # want to — but nobody can discover that they own the page.
    #
    # Deliberately also absent: email, phone, referral address, plan and
    # subscription state. is_discoverable governs search only; an explicit link
    # still resolves.
    return jsonify({
        "user": _public_user_payload(user),
        "is_discoverable": bool(user.is_discoverable),
    }), 200


@api_bp.route("/auth/me/profile-slug", methods=["PUT"])
@jwt_required()
def update_my_profile_slug():
    """Claim or change your own /in/<slug> handle."""
    me = _me()
    if not me:
        return jsonify({"error": "User not found"}), 404

    payload = request.get_json(silent=True) or {}
    requested = sanitize_input(payload.get("slug", "") or "", max_length=30).strip().lower()

    if not requested:
        return jsonify({"error": "Enter a profile name."}), 400
    if requested in RESERVED:
        return jsonify({
            "error": "That name is reserved. Pick something else."
        }), 400
    if len(requested) < MIN_USER_SLUG_LEN or len(requested) > MAX_USER_SLUG_LEN:
        return jsonify({
            "error": f"Use {MIN_USER_SLUG_LEN}-{MAX_USER_SLUG_LEN} characters."
        }), 400
    if not is_valid_slug(requested):
        return jsonify({
            "error": "Use lowercase letters, numbers and single hyphens only."
        }), 400
    if slug_taken(requested, User, exclude_user_id=me.id):
        return jsonify({"error": "That name is already taken."}), 409

    previous = me.profile_slug
    me.profile_slug = requested
    try:
        db.session.commit()
    except Exception:
        # Lost the race against a concurrent claim; the unique index caught it.
        db.session.rollback()
        log_security_event("profile_slug_collision", user_id=me.id, details={"slug": requested})
        return jsonify({"error": "That name is already taken."}), 409

    log_security_event("profile_slug_changed", user_id=me.id,
                       details={"from": previous, "to": requested})
    return jsonify({"slug": me.profile_slug}), 200


@api_bp.route("/auth/me/profile-slug/random", methods=["POST"])
@jwt_required()
def regenerate_my_profile_slug():
    """Roll a fresh random handle, replacing your current one."""
    me = _me()
    if not me:
        return jsonify({"error": "User not found"}), 404

    try:
        me.profile_slug = generate_unique_slug(User, exclude_user_id=me.id)
        db.session.commit()
    except RuntimeError:
        db.session.rollback()
        return jsonify({"error": "Could not generate a new name. Try again."}), 500
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not generate a new name. Try again."}), 500

    return jsonify({"slug": me.profile_slug}), 200