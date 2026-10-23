"""Public organization-invitation endpoints.

The token in the email is the only credential. It is hashed at rest, expires
after seven days, and is single-use. Accepting either creates a verified account
for a new address or attaches an existing signed-in account. An organization
admin can invite an address, but only the owner of that inbox can accept.
"""

from datetime import datetime
import logging

from flask import jsonify, make_response, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from .. import api_bp
from ..auth.session import (
    access_token_expires_in,
    create_session_tokens,
    set_refresh_cookie,
)
from ...extensions import db
from ...models import Organization, OrganizationInvitation, TeamMember, User
from ...utils.cache import invalidate_org_cache
from ...utils.email_service import send_welcome_email
from ...utils.invitations import (
    find_invitation_by_token,
    find_user_by_email,
    hash_invitation_token,
    invitation_error,
    normalize_email,
)
from ...utils.security import log_security_event, sanitize_input
from ...utils.slug import generate_unique_slug
from ...utils.timezone_utils import utc_iso, utc_now_iso


def _current_user():
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        return User.query.get(int(identity))
    except (TypeError, ValueError):
        return None


def _emails_match(left, right):
    return normalize_email(left) == normalize_email(right)


def _organization_payload(org):
    if not org:
        return None
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "profile_image": org.profile_image,
    }


def _invitation_payload(invitation):
    org = invitation.organization
    return {
        "email": invitation.email,
        "role": invitation.role,
        "expires_at": utc_iso(invitation.expires_at),
        "organization": _organization_payload(org),
        "inviter_name": (
            invitation.invited_by.name or invitation.invited_by.email
            if invitation.invited_by else None
        ),
        "status": invitation.status,
    }


def _invitation_error_response(invitation):
    error = invitation_error(invitation)
    if not error:
        return None
    status, code, message = error
    return jsonify({"error": message, "code": code}), status


@api_bp.route("/invitations/<string:token>", methods=["GET"])
@jwt_required(optional=True)
def get_invitation(token):
    """Validate an invitation link and tell the client which accept path to use."""
    invitation = find_invitation_by_token(token)
    error_response = _invitation_error_response(invitation)
    if error_response:
        return error_response
    if not invitation.organization:
        return jsonify({"error": "This invitation link is not valid.", "code": "invitation_not_found"}), 404

    current = _current_user()
    existing = find_user_by_email(invitation.email)
    signed_in_matches = bool(current and _emails_match(current.email, invitation.email))
    account_unverified = bool(existing and not existing.email_verified)

    return jsonify({
        "invitation": _invitation_payload(invitation),
        "account_exists": existing is not None,
        # Unverified accounts (including legacy placeholder invites) can set a
        # password after proving control of the invited inbox.
        "account_unverified": account_unverified,
        "requires_sign_in": bool(existing and existing.email_verified and not signed_in_matches),
        "can_set_password": (existing is None or account_unverified) and not current,
        "signed_in": current is not None,
        "signed_in_matches": signed_in_matches,
        "current_user_email": current.email if current else None,
        "suggested_name": (
            existing.name if existing and existing.name else invitation.email.split("@")[0]
        ),
    }), 200


@api_bp.route("/invitations/<string:token>/accept", methods=["POST"])
@jwt_required(optional=True)
def accept_invitation(token):
    """Consume an invitation and attach the invited person to the organization."""
    invitation = find_invitation_by_token(token)
    error_response = _invitation_error_response(invitation)
    if error_response:
        return error_response
    if not invitation.organization:
        return jsonify({"error": "This invitation link is not valid.", "code": "invitation_not_found"}), 404

    org = invitation.organization

    # Serialize competing accepts. The re-check matters: another request may
    # have consumed the token between the lookup above and this lock.
    invitation = (
        OrganizationInvitation.query
        .filter_by(id=invitation.id, token_hash=hash_invitation_token(token))
        .with_for_update()
        .first()
    )
    error_response = _invitation_error_response(invitation)
    if error_response:
        return error_response
    if not invitation.organization:
        return jsonify({"error": "This invitation link is not valid.", "code": "invitation_not_found"}), 404
    org = invitation.organization

    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        payload = {}
    current = _current_user()
    if current and not _emails_match(current.email, invitation.email):
        return jsonify({
            "error": f"This invitation is for {invitation.email}, not {current.email}.",
            "code": "wrong_account",
        }), 403

    existing = current or find_user_by_email(invitation.email)
    if existing and existing.deleted_at is not None:
        return jsonify({
            "error": "This account has been deleted.",
            "code": "account_deleted",
        }), 410
    was_unverified = bool(existing and not existing.email_verified)

    if existing and existing.email_verified and not current:
        # Proving control of the inbox is not enough to take over a verified
        # account. The recipient signs in with their existing password instead.
        return jsonify({
            "error": "You already have an account. Sign in to accept this invitation.",
            "code": "sign_in_required",
            "email": invitation.email,
        }), 401

    now = datetime.utcnow()
    created_user = existing is None

    if created_user:
        raw_name = payload.get("name", "")
        name = sanitize_input(raw_name, max_length=120) if isinstance(raw_name, str) else ""
        password = payload.get("password")
        if not name:
            return jsonify({"error": "Enter your name."}), 400
        if not isinstance(password, str) or not password:
            return jsonify({"error": "Choose a password."}), 400

        user = User(
            email=normalize_email(invitation.email),
            name=name,
            role="individual",
            plan="trial",
            email_verified=True,
            email_verified_at=now,
            organization_id=org.id,
        )
        try:
            user.set_password(password)
        except ValueError as exc:
            log_security_event(
                "invitation_weak_password",
                ip_address=request.remote_addr,
                email=invitation.email,
                details={"org_id": org.id},
            )
            return jsonify({"error": str(exc)}), 400
    else:
        user = existing
        if was_unverified:
            password = payload.get("password")
            if not isinstance(password, str) or not password:
                return jsonify({
                    "error": "Set a password to reclaim your account.",
                    "code": "password_required",
                }), 400
            raw_name = payload.get("name", "")
            name = sanitize_input(raw_name, max_length=120) if isinstance(raw_name, str) else ""
            if name:
                user.name = name
            elif not user.name:
                user.name = invitation.email.split("@")[0]
            try:
                user.set_password(password)
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400
            user.email_verified = True
            user.email_verified_at = now
        # A signed-in verified user simply joins without changing credentials.

    if not user.profile_slug:
        try:
            user.profile_slug = generate_unique_slug(User)
        except RuntimeError:
            db.session.rollback()
            return jsonify({"error": "Could not set up your profile. Please try again."}), 500

    if not user.organization_id:
        user.organization_id = org.id
    if user.employment_status in (None, "", "unemployed"):
        user.employment_status = "working"

    # The TeamMember row needs a user id. Flush the new User first, otherwise
    # SQLAlchemy sees two independent pending rows and can insert the membership
    # before the account (which PostgreSQL rejects as a null user_id).
    if created_user:
        db.session.add(user)
        try:
            db.session.flush()
        except IntegrityError:
            db.session.rollback()
            return jsonify({
                "error": "That email address was just registered. Sign in and reopen the invitation.",
                "code": "account_created_elsewhere",
            }), 409

    team_member = TeamMember.query.filter_by(
        organization_id=org.id, user_id=user.id
    ).first() if not created_user else None
    already_member = team_member is not None
    if team_member is None:
        team_member = TeamMember(
            organization_id=org.id,
            user_id=user.id,
            role=invitation.role,
            permissions=invitation.permissions,
            join_date=invitation.join_date,
        )
        db.session.add(team_member)

    invitation.accepted_at = now
    invitation.accepted_by_id = user.id

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        logging.getLogger(__name__).exception("Invitation accept commit failed")
        return jsonify({
            "error": "That email address was just registered. Sign in and reopen the invitation.",
            "code": "account_created_elsewhere",
        }), 409

    if created_user:
        try:
            db.session.refresh(user)
            db.session.refresh(team_member)
        except Exception:
            pass

    log_security_event(
        "organization_invitation_accepted",
        user_id=user.id,
        ip_address=request.remote_addr,
        email=user.email,
        details={
            "org_id": org.id,
            "invitation_id": invitation.id,
            "created_user": created_user,
            "reclaimed": was_unverified,
            "already_member": already_member,
        },
    )
    try:
        from ...utils.kafka_service import kafka_service
        kafka_service.emit_event("organization_invitation_accepted", {
            "org_id": org.id,
            "invitation_id": invitation.id,
            "user_id": user.id,
            "created_user": created_user,
            "timestamp": utc_now_iso(),
        })
    except Exception:
        pass
    invalidate_org_cache(org.id)

    if created_user or was_unverified:
        try:
            sent, send_err = send_welcome_email(user.email, user.name, user.role)
            if not sent:
                log_security_event(
                    "welcome_email_failed",
                    user_id=user.id,
                    ip_address=request.remote_addr,
                    email=user.email,
                    details={"error": send_err, "context": "invitation"},
                )
        except Exception:
            pass

    if invitation.invited_by_id and invitation.invited_by_id != user.id:
        try:
            from ..notifications.routes import create_profile_notification
            create_profile_notification(
                invitation.invited_by_id,
                "team_joined",
                f"{user.name or user.email} joined {org.name}",
                f"{user.name or user.email} accepted your invitation and joined the team.",
                related_user_id=user.id,
                related_org_id=org.id,
            )
        except Exception:
            pass

    response = {
        "message": f"You've joined {org.name}.",
        "already_member": already_member,
        "created_user": created_user,
        "organization": _organization_payload(org),
        "team_member": team_member.to_dict(),
        "user": user.to_dict(),
        "auto_login": False,
    }

    # New accounts (and reclaimed legacy placeholders) have just chosen a
    # password, so signing them in is safe and avoids an unnecessary detour.
    if created_user or was_unverified:
        access_token, refresh_token = create_session_tokens(user)
        response["access_token"] = access_token
        response["expires_in"] = access_token_expires_in()
        response["auto_login"] = True
        resp = make_response(jsonify(response), 200)
        set_refresh_cookie(resp, refresh_token)
        return resp

    return jsonify(response), 200
