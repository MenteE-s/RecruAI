"""Per-user AI token budget.

Billing is out of scope for the MVP, which does not make cost control optional.
The gap this closes is real today: `User.can_schedule_interview()` applies no
count limit to individuals (organizations cap trial usage at 5 interviews), so a
single trial account can drive unbounded LLM traffic through the interview chat.

Budgeting is per calendar day (UTC) and measured from the `token_usage` rows the
AI service already writes, so there is no new column and no migration.

Limits are per tier and overridable by environment variable, because the right
number depends on which provider and model are configured:

    AI_BUDGET_ENABLED=0                       disables enforcement entirely
    AI_DAILY_TOKEN_LIMIT_TRIAL=250000
    AI_DAILY_TOKEN_LIMIT_PAID=2000000
    AI_DAILY_TOKEN_LIMIT_DEFAULT=50000

A limit of 0 means unlimited. Enforcement happens in AIService.generate_response
before the provider call, so a refused call costs nothing — but a call already in
flight can overshoot the remaining budget by one turn's worth of tokens, which is
the right trade for an MVP.
"""
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

from ..extensions import db
from ..models.token_usage import TokenUsage


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def budget_enabled() -> bool:
    return _env_int("AI_BUDGET_ENABLED", 1) != 0


# Generous by design. These exist to stop runaway usage, not to ration a paying
# customer's AI features — there is no billing to ration against yet.
DEFAULT_LIMITS = {
    "paid": 2_000_000,
    "trial": 250_000,
    "default": 50_000,
}


def limit_for(user) -> int:
    """Daily token ceiling for this account's tier. 0 means unlimited."""
    if user is None:
        return DEFAULT_LIMITS["default"]
    if getattr(user, "is_subscription_active", None) and user.is_subscription_active():
        tier = "paid"
    elif getattr(user, "is_trial_active", None) and user.is_trial_active():
        tier = "trial"
    else:
        tier = "default"
    return _env_int(f"AI_DAILY_TOKEN_LIMIT_{tier.upper()}", DEFAULT_LIMITS[tier])


def _account_ids(user) -> Tuple[Optional[int], Optional[int]]:
    """(user_id, organization_id) — org usage is attributed to the org.

    Org admins spend the org's tokens, so charging their personal budget for it
    would be wrong and would let one admin exhaust every colleague's allowance.
    """
    org = getattr(user, "organization", None)
    if org is not None:
        return None, org.id
    return getattr(user, "id", None), None


def usage_since(user, since: datetime) -> int:
    """Tokens attributed to this account since `since`."""
    user_id, org_id = _account_ids(user)
    if user_id is None and org_id is None:
        return 0
    q = db.session.query(TokenUsage)
    if org_id is not None:
        q = q.filter(TokenUsage.organization_id == org_id)
    else:
        q = q.filter(TokenUsage.user_id == user_id)
    total = q.filter(TokenUsage.created_at >= since).with_entities(
        db.func.coalesce(db.func.sum(TokenUsage.tokens_used), 0)
    ).scalar()
    return int(total or 0)


def utc_day_start(moment: Optional[datetime] = None) -> datetime:
    moment = moment or datetime.utcnow()
    return moment.replace(hour=0, minute=0, second=0, microsecond=0)


def budget_status(user) -> Dict:
    """Current usage against the ceiling. Safe to expose to a client."""
    limit = limit_for(user)
    used = usage_since(user, utc_day_start())
    return {
        "tokens_used_today": used,
        "daily_limit": limit,
        "unlimited": limit <= 0,
        "exhausted": bool(limit > 0 and used >= limit),
        "resets_at": (utc_day_start() + timedelta(days=1)).isoformat() + "Z",
    }


def check_ai_budget(user, operation_type: str = "") -> Tuple[bool, str]:
    """(allowed, message). An empty message means allowed.

    Returns a refusal rather than raising: the AI service returns user-facing
    prose, not exceptions, so a budget stop has to read like the other stops.
    """
    if not budget_enabled() or user is None:
        return True, ""

    status = budget_status(user)
    if not status["exhausted"]:
        return True, ""

    used = status["tokens_used_today"]
    limit = status["daily_limit"]
    return False, (
        f"You've reached your daily AI limit ({used:,} of {limit:,} tokens). "
        "Your allowance resets tomorrow — nothing is lost, and your progress is saved."
    )


def reset_today_usage(user) -> int:
    """Delete today's usage rows for an account. Returns rows removed.

    Exists for support and for scripts/grant_subscription.py: when someone is
    blocked and you want to unblock them immediately without waiting for
    midnight, the alternative is editing rows by hand.
    """
    user_id, org_id = _account_ids(user)
    if user_id is None and org_id is None:
        return 0
    q = db.session.query(TokenUsage).filter(TokenUsage.created_at >= utc_day_start())
    if org_id is not None:
        q = q.filter(TokenUsage.organization_id == org_id)
    else:
        q = q.filter(TokenUsage.user_id == user_id)
    removed = q.delete(synchronize_session=False)
    db.session.commit()
    return removed