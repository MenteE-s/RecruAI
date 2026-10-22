"""Organization invitation tokens and lookups."""

import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import func

from backend.models import OrganizationInvitation, User
from backend.utils.security import sanitize_input

INVITATION_TTL_DAYS = 7
INVITATION_RESEND_COOLDOWN_SECONDS = 60
INVITATION_MAX_PER_HOUR = 5


def normalize_email(value) -> str:
    """Canonical invite address: trimmed, lower-case, length-capped."""
    if not isinstance(value, str):
        return ""
    value = value.strip()
    # Never silently truncate an address: the invite would go to a different
    # mailbox. The users.email/invitation.email columns are VARCHAR(120).
    if len(value) > 120:
        return ""
    return sanitize_input(value, max_length=120).strip().lower()


def generate_invitation_token() -> str:
    return secrets.token_urlsafe(32)


def hash_invitation_token(token: str) -> str:
    return hashlib.sha256((token or "").encode("utf-8")).hexdigest()


def find_invitation_by_token(token: str):
    if not token or len(token) > 200:
        return None
    return OrganizationInvitation.query.filter_by(
        token_hash=hash_invitation_token(token)
    ).first()


def find_user_by_email(email: str):
    email = normalize_email(email)
    if not email:
        return None
    return User.query.filter(func.lower(User.email) == email).first()


def active_invitation_for(org_id: int, email: str):
    email = normalize_email(email)
    now = datetime.utcnow()
    return (
        OrganizationInvitation.query
        .filter(
            OrganizationInvitation.organization_id == org_id,
            func.lower(OrganizationInvitation.email) == email,
            OrganizationInvitation.accepted_at.is_(None),
            OrganizationInvitation.revoked_at.is_(None),
            OrganizationInvitation.expires_at > now,
        )
        .order_by(OrganizationInvitation.created_at.desc())
        .first()
    )


def recent_invitation_count(org_id: int, email: str) -> int:
    """Count invitations created in the last hour for one org/address."""
    email = normalize_email(email)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    return (
        OrganizationInvitation.query
        .filter(
            OrganizationInvitation.organization_id == org_id,
            func.lower(OrganizationInvitation.email) == email,
            OrganizationInvitation.created_at >= one_hour_ago,
        )
        .count()
    )


def invitation_error(invitation):
    """Return (http_status, code, message) for an unusable invitation."""
    if invitation is None:
        return 404, "invitation_not_found", "This invitation link is not valid."
    status = invitation.status
    if status == "accepted":
        return 409, "invitation_already_accepted", "This invitation has already been accepted."
    if status == "revoked":
        return 410, "invitation_revoked", "This invitation has been revoked."
    if status == "expired":
        return 410, "invitation_expired", "This invitation has expired. Ask an admin to resend it."
    return None
