"""Role-based authorization for organization (company-page) actions.

The legacy code treated every ``team_members`` row as equivalent: a Viewer
could remove the last Admin, change the page's visibility, or manage payment
methods. This module is the single source of truth for what each role may do.

Roles
-----
Admin       full control of the page, billing, and membership.
HR          hiring and interview operations, including AI agents.
Manager     hiring and interview operations; may use but not edit AI agents.
Interviewer candidate/interview access and interview feedback.
Viewer      read-only access to the page's hiring surfaces.
Employee    hired candidate; no page-manager access.

``Member`` is a legacy spelling of Interviewer. Unknown stored roles are
treated as Viewer (read-only) rather than granted broad access.

The permission list is intentionally explicit. A new endpoint must name the
permission it needs; adding a route never silently inherits a role's rights.
"""

from dataclasses import dataclass
from functools import wraps
import logging

from flask import current_app, g, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import TeamMember, User


logger = logging.getLogger(__name__)


# Permission names
ORG_VIEW = "org.view"
ORG_EDIT = "org.edit"
TEAM_VIEW = "team.view"
TEAM_MANAGE = "team.manage"
BILLING_VIEW = "billing.view"
BILLING_MANAGE = "billing.manage"
HIRING_VIEW = "hiring.view"
HIRING_MANAGE = "hiring.manage"
INTERVIEWS_VIEW = "interviews.view"
INTERVIEWS_MANAGE = "interviews.manage"
AI_AGENTS_VIEW = "ai_agents.view"
AI_AGENTS_MANAGE = "ai_agents.manage"
ANALYTICS_VIEW = "analytics.view"

ALL_PERMISSIONS = frozenset({
    ORG_VIEW,
    ORG_EDIT,
    TEAM_VIEW,
    TEAM_MANAGE,
    BILLING_VIEW,
    BILLING_MANAGE,
    HIRING_VIEW,
    HIRING_MANAGE,
    INTERVIEWS_VIEW,
    INTERVIEWS_MANAGE,
    AI_AGENTS_VIEW,
    AI_AGENTS_MANAGE,
    ANALYTICS_VIEW,
})

READ_ONLY_PERMISSIONS = frozenset({
    ORG_VIEW,
    TEAM_VIEW,
    HIRING_VIEW,
    INTERVIEWS_VIEW,
    ANALYTICS_VIEW,
})

ROLE_PERMISSIONS = {
    "Admin": ALL_PERMISSIONS,
    "HR": frozenset({
        ORG_VIEW,
        TEAM_VIEW,
        HIRING_VIEW,
        HIRING_MANAGE,
        INTERVIEWS_VIEW,
        INTERVIEWS_MANAGE,
        AI_AGENTS_VIEW,
        AI_AGENTS_MANAGE,
        ANALYTICS_VIEW,
    }),
    "Manager": frozenset({
        ORG_VIEW,
        TEAM_VIEW,
        HIRING_VIEW,
        HIRING_MANAGE,
        INTERVIEWS_VIEW,
        INTERVIEWS_MANAGE,
        AI_AGENTS_VIEW,
        ANALYTICS_VIEW,
    }),
    "Interviewer": frozenset({
        ORG_VIEW,
        TEAM_VIEW,
        HIRING_VIEW,
        INTERVIEWS_VIEW,
        INTERVIEWS_MANAGE,
        ANALYTICS_VIEW,
    }),
    "Viewer": READ_ONLY_PERMISSIONS,
    "Employee": frozenset(),
}

# Canonical roles accepted when creating/updating a membership. Legacy input
# spellings are accepted but stored in canonical form.
CANONICAL_ROLES = frozenset({"Admin", "HR", "Manager", "Interviewer", "Viewer", "Employee"})
SELECTABLE_ROLES = ("Admin", "HR", "Manager", "Interviewer", "Viewer")

_ROLE_ALIASES = {
    "admin": "Admin",
    "administrator": "Admin",
    "owner": "Admin",
    "hr": "HR",
    "h r": "HR",
    "human resources": "HR",
    "people ops": "HR",
    "people operations": "HR",
    "recruiter": "HR",
    "manager": "Manager",
    "hiring manager": "Manager",
    "interviewer": "Interviewer",
    "member": "Interviewer",
    "viewer": "Viewer",
    "employee": "Employee",
}


def parse_org_role(role):
    """Return the canonical role name, or ``None`` for an unknown value."""
    if not isinstance(role, str):
        return None
    key = " ".join(role.strip().lower().replace("_", " ").replace("-", " ").split())
    return _ROLE_ALIASES.get(key)


def normalize_stored_role(role):
    """Resolve a stored role safely. Unknown data becomes read-only Viewer."""
    return parse_org_role(role) or "Viewer"


def role_permissions(role):
    return ROLE_PERMISSIONS[normalize_stored_role(role)]


@dataclass(frozen=True)
class OrgAccess:
    organization_id: int
    role: str
    permissions: frozenset
    is_owner: bool = False

    @property
    def is_admin(self) -> bool:
        return self.role == "Admin"

    def can(self, permission: str) -> bool:
        return permission in self.permissions

    def to_dict(self):
        return {
            "organization_id": self.organization_id,
            "role": self.role,
            "permissions": sorted(self.permissions),
            "is_owner": bool(self.is_owner),
            "is_admin": self.is_admin,
        }


def _coerce_org_id(org_id):
    try:
        value = int(org_id)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def _request_cache():
    cache = getattr(g, "_org_access_cache", None)
    if cache is None:
        cache = {}
        setattr(g, "_org_access_cache", cache)
    return cache


def get_org_access(user, org_id):
    """Resolve the caller's effective role in an org, or ``None``.

    A membership row is required for individuals. ``user.organization_id`` is
    only a convenience pointer (it is used to pick the primary page); it does
    not grant access on its own. Organization accounts remain the owner of
    their own page for backwards compatibility.
    """
    if not user or getattr(user, "id", None) is None:
        return None
    org_id = _coerce_org_id(org_id)
    if org_id is None:
        return None

    key = (user.id, org_id)
    cache = _request_cache()
    if key in cache:
        return cache[key]

    access = None
    if user.role == "organization" and user.organization_id == org_id:
        access = OrgAccess(
            organization_id=org_id,
            role="Admin",
            permissions=ALL_PERMISSIONS,
            is_owner=True,
        )
    else:
        membership = TeamMember.query.filter_by(
            organization_id=org_id, user_id=user.id
        ).first()
        if membership is not None:
            role = normalize_stored_role(membership.role)
            access = OrgAccess(
                organization_id=org_id,
                role=role,
                permissions=ROLE_PERMISSIONS[role],
            )

    cache[key] = access
    return access


def has_org_permission(user, org_id, permission):
    access = get_org_access(user, org_id)
    return bool(access and access.can(permission))


def get_permitted_org_ids(user, permission=None):
    """Org ids the caller belongs to, optionally filtered by a permission."""
    if not user or getattr(user, "id", None) is None:
        return set()

    ids = set()
    if user.role == "organization" and user.organization_id:
        access = get_org_access(user, user.organization_id)
        if access and (permission is None or access.can(permission)):
            ids.add(access.organization_id)

    memberships = TeamMember.query.filter_by(user_id=user.id).all()
    for membership in memberships:
        access = get_org_access(user, membership.organization_id)
        if access and (permission is None or access.can(permission)):
            ids.add(access.organization_id)
    return ids


def get_managed_org_ids(user, permission=None):
    """Backwards-compatible alias for callers outside this module."""
    return get_permitted_org_ids(user, permission=permission)


def count_org_admins(org_id, exclude_user_id=None):
    """Count unique Admin users, including implicit organization owners."""
    org_id = _coerce_org_id(org_id)
    if org_id is None:
        return 0

    admin_ids = set()
    memberships = TeamMember.query.filter_by(organization_id=org_id).all()
    for membership in memberships:
        if normalize_stored_role(membership.role) == "Admin":
            admin_ids.add(membership.user_id)

    owner_query = User.query.filter_by(role="organization", organization_id=org_id)
    if hasattr(User, "deleted_at"):
        owner_query = owner_query.filter(User.deleted_at.is_(None))
    for owner_id, in owner_query.with_entities(User.id).all():
        admin_ids.add(owner_id)

    if exclude_user_id is not None:
        admin_ids.discard(int(exclude_user_id))
    return len(admin_ids)


def is_last_admin(org_id, user_id):
    return count_org_admins(org_id, exclude_user_id=user_id) == 0


def current_user():
    """Load the JWT caller. Kept local so route modules do not duplicate it."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def forbidden_response(permission=None):
    payload = {
        "error": "You do not have permission to perform this action.",
        "code": "org_permission_denied",
    }
    if permission:
        payload["permission"] = permission
    return jsonify(payload), 403


def _org_id_from_request(kwargs):
    org_id = kwargs.get("org_id")
    if org_id is not None:
        return org_id
    view_args = request.view_args or {}
    if view_args.get("org_id") is not None:
        return view_args["org_id"]
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        payload = request.get_json(silent=True)
        if isinstance(payload, dict):
            for key in ("organization_id", "org_id"):
                if payload.get(key) is not None:
                    return payload[key]
    for key in ("organization_id", "org_id"):
        if request.args.get(key) is not None:
            return request.args.get(key)
    return None


def org_permission_required(permission):
    """Require ``permission`` for the org identified by the route/body.

    Must be applied *below* ``@jwt_required()``. The resolved ``OrgAccess`` is
    exposed as ``flask.g.org_access`` for the view.
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return jsonify({"error": "User not found"}), 404
            org_id = _org_id_from_request(kwargs)
            if org_id is None:
                return jsonify({"error": "organization_id required"}), 400
            access = get_org_access(user, org_id)
            if not access or not access.can(permission):
                logger.info(
                    "org_permission_denied user_id=%s org_id=%s permission=%s",
                    user.id, org_id, permission,
                )
                return forbidden_response(permission)
            g.org_access = access
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def describe_org_access(user, org_id):
    access = get_org_access(user, org_id)
    return access.to_dict() if access else None


def organization_access_for_user(user):
    """Payload for /auth/me: role and permissions for the primary page."""
    if not user or not user.organization_id:
        return None
    return describe_org_access(user, user.organization_id)


def user_payload_with_access(user):
    """``user.to_dict()`` plus the primary page's effective role/permissions."""
    payload = user.to_dict()
    access = organization_access_for_user(user)
    if access is not None:
        payload["organization_role"] = access["role"]
        payload["organization_permissions"] = access["permissions"]
        payload["organization_access"] = access
    return payload


def invalidate_membership_caches(user_id, org_id=None):
    """Drop role-dependent caches after a membership or role change."""
    from .cache import invalidate_auth_cache, invalidate_org_cache

    try:
        invalidate_auth_cache(int(user_id))
    except Exception:
        current_app.logger.exception("could not invalidate auth cache for user %s", user_id)
    if org_id is not None:
        try:
            invalidate_org_cache(int(org_id))
        except Exception:
            current_app.logger.exception("could not invalidate org cache for org %s", org_id)


def sync_primary_org(user):
    """Point the user's primary-page pointer at a page they still belong to.

    Removing someone from a team used to leave ``user.organization_id`` behind,
    which made the page manager keep opening a page the API would reject.
    This deliberately bypasses the per-request access cache: the caller often
    removes the only membership immediately before synchronizing the pointer.
    """
    if not user:
        return
    current = user.organization_id
    if current:
        is_owner = user.role == "organization"
        still_a_member = (
            db.session.query(TeamMember.id)
            .filter_by(organization_id=current, user_id=user.id)
            .first()
            is not None
        )
        if is_owner or still_a_member:
            return
    next_membership = (
        TeamMember.query.filter_by(user_id=user.id)
        .order_by(TeamMember.created_at.asc(), TeamMember.id.asc())
        .first()
    )
    if next_membership:
        user.organization_id = next_membership.organization_id
    else:
        user.organization_id = None


__all__ = [
    "ALL_PERMISSIONS",
    "ANALYTICS_VIEW",
    "AI_AGENTS_MANAGE",
    "AI_AGENTS_VIEW",
    "BILLING_MANAGE",
    "BILLING_VIEW",
    "CANONICAL_ROLES",
    "HIRING_MANAGE",
    "HIRING_VIEW",
    "INTERVIEWS_MANAGE",
    "INTERVIEWS_VIEW",
    "OrgAccess",
    "ORG_EDIT",
    "ORG_VIEW",
    "ROLE_PERMISSIONS",
    "SELECTABLE_ROLES",
    "TEAM_MANAGE",
    "TEAM_VIEW",
    "count_org_admins",
    "current_user",
    "describe_org_access",
    "forbidden_response",
    "get_managed_org_ids",
    "get_org_access",
    "get_permitted_org_ids",
    "has_org_permission",
    "invalidate_membership_caches",
    "is_last_admin",
    "normalize_stored_role",
    "org_permission_required",
    "organization_access_for_user",
    "parse_org_role",
    "role_permissions",
    "sync_primary_org",
    "user_payload_with_access",
]
