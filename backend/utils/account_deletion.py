"""Account deletion request and hard-purge implementation.

Lifecycle
---------
1. ``request_account_deletion`` verifies the password, blocks deletion when the
   caller is the last admin of an organization, revokes every session, marks the
   user as deleted, and schedules a purge ``ACCOUNT_DELETION_GRACE_DAYS`` later.
2. ``purge_due_accounts`` is called by the scheduler worker. It hard-deletes the
   user's rows, interview conversations, memberships, tokens, payment metadata,
   and local uploads, then leaves a non-PII audit row in ``account_deletions``.
3. ``purge_account_now`` is the support path for an immediate deletion.

The database has no ``ON DELETE CASCADE`` on most user foreign keys, so the
purge order is explicit. Do not reorder without checking the FK graph; the
constraints are what protect unrelated organizations and candidates.
"""

from datetime import datetime, timedelta
import hashlib
import logging
import os
from pathlib import Path
import shutil

from flask import current_app
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from backend.constants import ACCOUNT_DELETION_GRACE_DAYS
from backend.extensions import db
from backend.models import AccountDeletion, Interview, Organization, TeamMember, User
from backend.utils.cache import invalidate_auth_cache
from backend.utils.security import log_security_event, sanitize_input

logger = logging.getLogger(__name__)

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"


def _utcnow():
    return datetime.utcnow()


def hash_email(email: str) -> str:
    return hashlib.sha256((email or "").strip().lower().encode("utf-8")).hexdigest()


def _iso(value):
    return value.isoformat() + "Z" if value else None


def _admins_for_org(org_id: int, exclude_user_id: int) -> int:
    """Count admins other than the caller.

    A legacy organization account can be an admin without a TeamMember row, so
    both sources count. Without this, deleting the only organization user would
    orphan the company page and its jobs.
    """
    team_admins = (
        TeamMember.query
        .filter(
            TeamMember.organization_id == org_id,
            TeamMember.role == "Admin",
            TeamMember.user_id != exclude_user_id,
        )
        .count()
    )
    legacy_admins = (
        User.query
        .filter(
            User.organization_id == org_id,
            User.role == "organization",
            User.id != exclude_user_id,
        )
        .count()
    )
    return int(team_admins) + int(legacy_admins)


def last_admin_organizations(user: User):
    """Organizations where this user is the only remaining admin.

    Returns a list of ``{"id", "name"}``. The caller turns this into a 409 rather
    than deleting a company page's last owner.
    """
    if not user:
        return []

    org_ids = set()
    if user.organization_id and user.role == "organization":
        org_ids.add(user.organization_id)
    for membership in TeamMember.query.filter_by(user_id=user.id).all():
        if (membership.role or "").strip().lower() == "admin":
            org_ids.add(membership.organization_id)

    blocked = []
    for org_id in sorted(org_ids):
        if _admins_for_org(org_id, user.id) == 0:
            org = db.session.get(Organization, org_id)
            blocked.append({"id": org_id, "name": org.name if org else f"Organization {org_id}"})
    return blocked


def request_account_deletion(user: User, password: str, reason: str = "", ip_address=None):
    """Schedule deletion. Returns ``(ok, payload, status_code)``.

    Re-authentication is deliberate: a stolen access token must not be enough to
    destroy an account. The password check is done directly rather than through
    ``User.check_password`` so a failed deletion attempt does not mutate the
    login lockout counters.
    """
    from backend.utils.security import verify_password

    if not user:
        return False, {"error": "User not found"}, 404

    if user.deleted_at is not None:
        existing = (
            AccountDeletion.query
            .filter_by(user_id=user.id)
            .order_by(AccountDeletion.id.desc())
            .first()
        )
        scheduled = user.deletion_scheduled_for or (existing.scheduled_for if existing else None)
        return True, {
            "message": "Account deletion is already scheduled.",
            "scheduled_for": _iso(scheduled),
            "code": "deletion_already_scheduled",
        }, 202

    if not user.password_hash:
        return False, {
            "error": "Set a password before deleting this account.",
            "code": "password_required",
        }, 400

    if not password or not verify_password(user.password_hash, password):
        log_security_event(
            "account_deletion_reauth_failed",
            user_id=str(user.id),
            ip_address=ip_address,
        )
        return False, {
            "error": "Password is incorrect.",
            "code": "invalid_password",
        }, 403

    blocked = last_admin_organizations(user)
    if blocked:
        names = ", ".join(org["name"] for org in blocked)
        return False, {
            "error": (
                f"You are the last admin of {names}. Add or transfer another admin "
                "before deleting your account."
            ),
            "code": "last_org_admin",
            "organizations": blocked,
        }, 409

    now = _utcnow()
    scheduled_for = now + timedelta(days=ACCOUNT_DELETION_GRACE_DAYS)
    user.deleted_at = now
    user.deletion_requested_at = now
    user.deletion_scheduled_for = scheduled_for
    user.deletion_reason = sanitize_input(reason or "", max_length=255) or None
    user.is_discoverable = False
    # Bump the version in the same transaction as the state change so access
    # tokens issued a second earlier stop working immediately.
    user.token_version = int(user.token_version or 0) + 1
    user.failed_login_attempts = 0
    user.locked_until = None

    try:
        from backend.api.auth.session import revoke_all_refresh_tokens

        revoke_all_refresh_tokens(user.id, commit=False)
    except Exception:
        # The token_version bump already invalidates access tokens. A failure
        # here must not leave the account half-deleted; log and continue.
        logger.exception("could not revoke refresh tokens for user %s", user.id)

    # Pending invitations to this address must not remain usable after the
    # account is gone.
    db.session.execute(
        text(
            """
            UPDATE organization_invitations
               SET revoked_at = :now
             WHERE lower(email) = lower(:email)
               AND accepted_at IS NULL
               AND revoked_at IS NULL
            """
        ),
        {"now": now, "email": user.email},
    )

    audit = AccountDeletion(
        user_id=user.id,
        email_hash=hash_email(user.email),
        status="scheduled",
        requested_at=now,
        scheduled_for=scheduled_for,
        requested_ip=ip_address,
    )
    db.session.add(audit)
    db.session.commit()

    try:
        invalidate_auth_cache(user.id)
    except Exception:
        pass

    log_security_event(
        "account_deletion_requested",
        user_id=str(user.id),
        ip_address=ip_address,
        details={"scheduled_for": _iso(scheduled_for)},
    )
    try:
        from backend.utils.kafka_service import kafka_service

        kafka_service.emit_event(
            "account_deletion_requested",
            {"user_id": user.id, "scheduled_for": _iso(scheduled_for)},
        )
    except Exception:
        pass

    return True, {
        "message": (
            "Your account is scheduled for deletion. You have been signed out. "
            "Contact support if you need to reverse this."
        ),
        "scheduled_for": _iso(scheduled_for),
        "grace_days": ACCOUNT_DELETION_GRACE_DAYS,
        "code": "deletion_scheduled",
    }, 202


def _delete_sql(table: str, where: str, params: dict) -> int:
    # Table names come from the static lists in this module, never from input.
    result = db.session.execute(
        text(f'DELETE FROM "{table}" WHERE {where}'),
        params,
    )
    return int(result.rowcount or 0)


def _update_sql(table: str, set_clause: str, where: str, params: dict) -> int:
    result = db.session.execute(
        text(f'UPDATE "{table}" SET {set_clause} WHERE {where}'),
        params,
    )
    return int(result.rowcount or 0)


def _in_clause(column: str, values, prefix: str):
    """Build a safe IN clause with bound parameters; returns (sql, params)."""
    values = list(values or [])
    if not values:
        return "FALSE", {}
    names = [f"{prefix}{i}" for i in range(len(values))]
    sql = f"{column} IN ({', '.join(':' + name for name in names)})"
    return sql, dict(zip(names, values))


def _upload_paths(user: User, interview_ids, application_ids):
    paths = [user.profile_picture, user.banner]
    for (url,) in (
        db.session.query(Interview.recording_url)
        .filter(Interview.id.in_(interview_ids))
        .all()
        if interview_ids else []
    ):
        paths.append(url)
    from backend.models import Application

    for (url,) in (
        db.session.query(Application.resume_url)
        .filter(Application.id.in_(application_ids))
        .all()
        if application_ids else []
    ):
        paths.append(url)
    return [p for p in paths if p]


def _remove_uploads(paths, user_id: int):
    """Delete only paths that resolve inside backend/uploads.

    A profile URL is user-influenced data, so path traversal here would be a
    file-deletion vulnerability. ``commonpath`` enforces the boundary after
    resolving symlinks.
    """
    root = UPLOAD_ROOT.resolve()
    candidates = []
    for raw in paths:
        if not isinstance(raw, str):
            continue
        if raw.startswith("http://") or raw.startswith("https://"):
            continue
        relative = raw.lstrip("/")
        if relative.startswith("uploads/"):
            relative = relative[len("uploads/"):]
        candidates.append(relative)

    # Also catch the deterministic names even if a URL was overwritten.
    candidates.extend([
        f"profile_pictures/user_{user_id}_profile.png",
        f"profile_pictures/user_{user_id}_profile.jpg",
        f"profile_pictures/user_{user_id}_profile.jpeg",
        f"profile_pictures/user_{user_id}_profile.gif",
    ])

    for relative in candidates:
        try:
            target = (root / relative).resolve()
            if os.path.commonpath([str(root), str(target)]) != str(root):
                logger.warning("refusing to delete upload outside %s: %s", root, relative)
                continue
            if target.is_dir():
                shutil.rmtree(target, ignore_errors=True)
            elif target.exists():
                target.unlink()
        except Exception:
            logger.exception("could not delete upload for user %s: %s", user_id, relative)


def _purge_files(user: User, interview_ids, application_ids):
    _remove_uploads(_upload_paths(user, interview_ids, application_ids), user.id)


def _mark_audit_error(user_id: int, error: str):
    try:
        db.session.rollback()
        audit = (
            AccountDeletion.query
            .filter_by(user_id=user_id)
            .order_by(AccountDeletion.id.desc())
            .first()
        )
        if audit:
            audit.status = "error"
            audit.error = error[:2000]
            db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("could not record deletion error for user %s", user_id)


def purge_account(user_id: int, force: bool = False, now=None, reason: str = "scheduled"):
    """Hard-delete one account and everything keyed to it.

    Returns one of ``"purged"``, ``"not_found"``, ``"not_due"``, ``"not_deleted"``.
    ``force`` is reserved for the support CLI. It cannot be reached from HTTP.
    """
    now = now or _utcnow()
    user = (
        User.query
        .filter(User.id == user_id)
        .with_for_update()
        .first()
    )
    if not user:
        db.session.rollback()
        return "not_found"
    if not user.deleted_at and not force:
        db.session.rollback()
        return "not_deleted"
    if user.deletion_scheduled_for and user.deletion_scheduled_for > now and not force:
        db.session.rollback()
        return "not_due"

    interview_ids = [
        row[0]
        for row in db.session.query(Interview.id).filter(Interview.user_id == user.id).all()
    ]
    from backend.models import Application

    application_ids = [
        row[0]
        for row in db.session.query(Application.id).filter(Application.user_id == user.id).all()
    ]
    plan_ids = [
        row[0]
        for row in db.session.execute(
            text("SELECT id FROM mentorship_plans WHERE user_id = :uid"), {"uid": user.id}
        ).scalars().all()
    ]
    shareable_ids = [
        row[0]
        for row in db.session.execute(
            text("SELECT id FROM shareable_profiles WHERE user_id = :uid"), {"uid": user.id}
        ).scalars().all()
    ]

    # Files first: if the DB transaction fails, a retry can still find the
    # references and delete the remaining files.
    _purge_files(user, interview_ids, application_ids)

    try:
        # --- rows that point at this user's interviews/applications/plans ----
        notif_parts = ["user_id = :uid", "related_user_id = :uid"]
        notif_params = {"uid": user.id}
        clause, params = _in_clause("related_interview_id", interview_ids, "iv")
        if clause != "FALSE":
            notif_parts.append(clause)
            notif_params.update(params)
        clause, params = _in_clause("related_application_id", application_ids, "app")
        if clause != "FALSE":
            notif_parts.append(clause)
            notif_params.update(params)
        clause, params = _in_clause("related_mentorship_plan_id", plan_ids, "plan")
        if clause != "FALSE":
            notif_parts.append(clause)
            notif_params.update(params)
        _delete_sql("notifications", " OR ".join(notif_parts), notif_params)

        clause, params = _in_clause("profile_id", shareable_ids, "share")
        if clause != "FALSE":
            _delete_sql("profile_analytics", clause, params)

        clause, params = _in_clause("interview_id", interview_ids, "iv")
        if clause != "FALSE":
            _delete_sql("conversation_memories", f"user_id = :uid OR {clause}", {**params, "uid": user.id})
            _delete_sql("conversation_messages", f"sender_user_id = :uid OR {clause}", {**params, "uid": user.id})
            _delete_sql("messages", f"user_id = :uid OR {clause}", {**params, "uid": user.id})
            _delete_sql("interview_analyses", clause, params)
            _delete_sql("interview_decision_history", clause, params)
        else:
            _delete_sql("conversation_memories", "user_id = :uid", {"uid": user.id})
            _delete_sql("conversation_messages", "sender_user_id = :uid", {"uid": user.id})
            _delete_sql("messages", "user_id = :uid", {"uid": user.id})

        clause, params = _in_clause("plan_id", plan_ids, "plan")
        if clause != "FALSE":
            _delete_sql("mentorship_steps", clause, params)

        # --- references from other people's records -------------------------
        _update_sql(
            "interview_decision_history",
            "decided_by = NULL",
            "decided_by = :uid",
            {"uid": user.id},
        )
        _update_sql(
            "system_issues",
            "resolved_by = NULL",
            "resolved_by = :uid",
            {"uid": user.id},
        )
        _update_sql(
            "users",
            "referred_by_user_id = NULL",
            "referred_by_user_id = :uid",
            {"uid": user.id},
        )
        _update_sql(
            "organization_invitations",
            "invited_by_id = NULL",
            "invited_by_id = :uid",
            {"uid": user.id},
        )
        _update_sql(
            "organization_invitations",
            "accepted_by_id = NULL",
            "accepted_by_id = :uid",
            {"uid": user.id},
        )
        # Invitations carry the address itself; remove them with the account.
        _delete_sql(
            "organization_invitations",
            "lower(email) = lower(:email)",
            {"email": user.email},
        )
        for table in (
            "guided_projects",
            "skill_quizzes",
            "skill_questions",
            "mock_interview_questions",
        ):
            _update_sql(
                table,
                "created_by_user_id = NULL",
                "created_by_user_id = :uid",
                {"uid": user.id},
            )

        # --- rows owned by the user, in dependency order --------------------
        for table in (
            "guided_project_attempts",
            "quiz_attempts",
            "mock_interviews",
            "skill_assessments",
            "favorites",
            "company_follows",
            "saved_jobs",
            "shareable_profiles",
            "applications",
            "interviews",
            "mentorship_plans",
            "practice_ai_agents",
            "team_members",
            "profile_sections",
            "experiences",
            "educations",
            "skills",
            "projects",
            "publications",
            "awards",
            "certifications",
            "languages",
            "volunteer_experiences",
            "references",
            "hobby_interests",
            "professional_memberships",
            "patents",
            "course_trainings",
            "social_media_links",
            "key_achievements",
            "conferences",
            "speaking_engagements",
            "licenses",
            "payment_methods",
            "token_usage",
            "email_otps",
            "refresh_tokens",
            "system_issues",
        ):
            _delete_sql(table, "user_id = :uid", {"uid": user.id})
        _delete_sql("favorites", "target_user_id = :uid", {"uid": user.id})

        # profile_embeddings stores the user id as text, not an FK.
        _delete_sql(
            "recommendation_profile_embeddings",
            "user_id = :uid_text",
            {"uid_text": str(user.id)},
        )

        # Finally the account row itself. Raw DELETE avoids the ORM trying to
        # cascade over collections we have already removed.
        _delete_sql("users", "id = :uid", {"uid": user.id})

        audit = (
            AccountDeletion.query
            .filter_by(user_id=user.id)
            .order_by(AccountDeletion.id.desc())
            .first()
        )
        if audit:
            audit.status = "purged"
            audit.purged_at = now
            audit.error = None
        else:
            db.session.add(AccountDeletion(
                user_id=user.id,
                email_hash=hash_email(user.email),
                status="purged",
                requested_at=user.deletion_requested_at or now,
                scheduled_for=user.deletion_scheduled_for or now,
                purged_at=now,
            ))
        db.session.commit()
    except SQLAlchemyError as exc:
        logger.exception("purge failed for user %s", user_id)
        _mark_audit_error(user_id, str(exc))
        return "error"

    try:
        invalidate_auth_cache(user_id)
    except Exception:
        pass
    log_security_event(
        "account_purged",
        user_id=str(user_id),
        details={"method": reason},
    )
    return "purged"


def purge_due_accounts(batch_size: int = 25, now=None) -> int:
    """Purge accounts whose grace period has elapsed. Returns rows purged."""
    now = now or _utcnow()
    limit = max(1, min(int(batch_size or 25), 100))
    ids = (
        db.session.query(User.id)
        .filter(
            User.deleted_at.isnot(None),
            User.deletion_scheduled_for.isnot(None),
            User.deletion_scheduled_for <= now,
        )
        .order_by(User.deletion_scheduled_for.asc())
        .limit(limit)
        .with_for_update(skip_locked=True)
        .all()
    )
    db.session.rollback()  # release the selection locks; purge_account re-locks
    purged = 0
    for (user_id,) in ids:
        if purge_account(user_id, now=now) == "purged":
            purged += 1
    return purged


def purge_account_now(user: User, reason: str = "support") -> bool:
    """Support path: mark due immediately and purge. Caller owns app context."""
    if not user:
        return False
    if user.deleted_at is None:
        user.deleted_at = _utcnow()
        user.deletion_requested_at = user.deleted_at
        user.token_version = int(user.token_version or 0) + 1
    user.deletion_scheduled_for = _utcnow()
    db.session.add(AccountDeletion(
        user_id=user.id,
        email_hash=hash_email(user.email),
        status="scheduled",
        requested_at=user.deletion_requested_at or _utcnow(),
        scheduled_for=user.deletion_scheduled_for,
    ))
    db.session.commit()
    return purge_account(user.id, force=True, reason=reason) == "purged"
