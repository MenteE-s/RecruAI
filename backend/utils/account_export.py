"""Portable account export (GDPR/CCPA subject access request).

The export is deliberately schema-driven: every table with a ``user_id`` column
is included automatically, so a future profile table cannot silently omit user
data from an export. A short allowlist adds rows that are linked indirectly
(interview conversations, shareable-profile analytics, invitations addressed to
the user).

Secrets are never exported: password hashes, refresh-token hashes, OTP hashes,
and lockout counters are removed. File columns remain as URLs/paths so the user
can download the underlying files while the account still exists.
"""

from datetime import date, datetime
from decimal import Decimal
import json
import uuid

from sqlalchemy import String, Text, select

from backend.extensions import db
from backend.models import (
    Application,
    Interview,
    MentorshipPlan,
    Organization,
    ShareableProfile,
    TeamMember,
    User,
)

# Never export verifier material or internal abuse controls.
_SENSITIVE_COLUMNS = {
    "password_hash",
    "token_hash",
    "code_hash",
    "otp_hash",
    "refresh_token_hash",
    "reset_token_hash",
    "email_verification_token",
    "two_factor_secret",
    "token_version",
    "failed_login_attempts",
    "locked_until",
    "deletion_reason",
}

_MAX_ROWS_PER_TABLE = 100_000


def _jsonable(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat() + ("Z" if isinstance(value, datetime) else "")
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, (dict, list)):
        return value
    return value


def _serialize_row(mapping):
    return {
        key: _jsonable(value)
        for key, value in mapping.items()
        if key not in _SENSITIVE_COLUMNS
    }


def _value_for_column(column, user_id: int):
    try:
        python_type = column.type.python_type
    except NotImplementedError:
        python_type = str
    if isinstance(column.type, (String, Text)) or python_type is str:
        return str(user_id)
    return user_id


def _rows_for_table(table, user_id: int):
    if "user_id" not in table.c:
        return []
    column = table.c.user_id
    value = _value_for_column(column, user_id)
    stmt = select(table).where(column == value).limit(_MAX_ROWS_PER_TABLE)
    return [_serialize_row(row) for row in db.session.execute(stmt).mappings()]


def export_account_data(user: User) -> dict:
    """Build a JSON-serialisable export for one account.

    Caller must be inside an app context. This does not mutate the session.
    """
    user_id = user.id
    tables = {}
    for table in db.metadata.sorted_tables:
        if table.name == "users":
            continue
        rows = _rows_for_table(table, user_id)
        if rows:
            tables[table.name] = rows

    interview_ids = [
        row[0]
        for row in db.session.query(Interview.id).filter(Interview.user_id == user_id).all()
    ]
    if interview_ids:
        for table_name in (
            "conversation_memories",
            "conversation_messages",
            "interview_analyses",
            "interview_decision_history",
        ):
            table = db.metadata.tables.get(table_name)
            if table is None or "interview_id" not in table.c:
                continue
            stmt = select(table).where(table.c.interview_id.in_(interview_ids)).limit(
                _MAX_ROWS_PER_TABLE
            )
            rows = [_serialize_row(row) for row in db.session.execute(stmt).mappings()]
            if rows:
                existing = tables.setdefault(table_name, [])
                seen = {(row.get("id")) for row in existing}
                existing.extend(row for row in rows if row.get("id") not in seen)

    # Plan steps are linked through the plan, not directly to the user.
    plan_ids = [
        row[0]
        for row in db.session.query(MentorshipPlan.id)
        .filter(MentorshipPlan.user_id == user_id)
        .all()
    ]
    if plan_ids:
        table = db.metadata.tables.get("mentorship_steps")
        if table is not None and "plan_id" in table.c:
            stmt = select(table).where(table.c.plan_id.in_(plan_ids)).limit(
                _MAX_ROWS_PER_TABLE
            )
            rows = [_serialize_row(row) for row in db.session.execute(stmt).mappings()]
            if rows:
                tables["mentorship_steps"] = rows

    # Shareable-profile view analytics are data about the user's profile.
    profile_ids = [
        row[0]
        for row in db.session.query(ShareableProfile.id).filter_by(user_id=user_id).all()
    ]
    if profile_ids:
        table = db.metadata.tables.get("profile_analytics")
        if table is not None:
            stmt = select(table).where(table.c.profile_id.in_(profile_ids)).limit(
                _MAX_ROWS_PER_TABLE
            )
            rows = [_serialize_row(row) for row in db.session.execute(stmt).mappings()]
            if rows:
                tables["profile_analytics"] = rows

    # Invitations addressed to this email are the user's data too.
    inv = db.metadata.tables.get("organization_invitations")
    if inv is not None and "email" in inv.c:
        stmt = select(inv).where(inv.c.email.ilike(user.email)).limit(1000)
        rows = [_serialize_row(row) for row in db.session.execute(stmt).mappings()]
        if rows:
            tables["organization_invitations_addressed_to_you"] = rows

    # Public organization summaries, not other members' personal data.
    org_ids = set()
    if user.organization_id:
        org_ids.add(user.organization_id)
    org_ids.update(
        row[0]
        for row in db.session.query(TeamMember.organization_id)
        .filter(TeamMember.user_id == user_id)
        .all()
    )
    organizations = []
    if org_ids:
        for org in Organization.query.filter(Organization.id.in_(sorted(org_ids))).all():
            organizations.append({
                "id": org.id,
                "name": org.name,
                "description": org.description,
                "website": org.website,
                "location": org.location,
                "industry": org.industry,
                "company_size": org.company_size,
                "subscription_status": org.subscription_status,
                "created_at": _jsonable(org.created_at),
            })

    account = {
        key: _jsonable(value)
        for key, value in user.to_dict().items()
        if key not in _SENSITIVE_COLUMNS
    }
    account.update({
        "id": user.id,
        "created_at": _jsonable(user.created_at),
        "last_login_at": _jsonable(user.last_login_at),
        "email_verified": bool(user.email_verified),
    })

    return {
        "export_version": 1,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "account": account,
        "organizations": organizations,
        "data": tables,
        "notes": [
            "Password hashes, session-token hashes, one-time-code hashes and security "
            "lockout counters are never exported.",
            "File URLs are included while the account exists. Download them before "
            "requesting deletion.",
            "Rows belonging to other people (for example their messages to you) are "
            "omitted or redacted.",
        ],
    }


def export_as_json(user: User) -> str:
    return json.dumps(export_account_data(user), ensure_ascii=False, default=_jsonable)
