"""Per-account AI token allowance.

There is no billing in the MVP, so there is no tier to ration against. Instead
each account carries one allowance (`users.token_allowance`, 50k for everyone
including accounts created later) and is measured against the cumulative
`users.tokens_used` counter that `User.track_token_usage` already maintains.

This replaced a daily tier ceiling. Two ceilings would have been confusing to
support ("daily limit" vs "allowance"), and with no way to become a real paid
subscriber the tier differences were theoretical anyway.

Enforced in `AIService.generate_response` before the provider call, so a refused
call costs nothing. Unlike the entitlement gate, this is enforced outside
`IS_PRODUCTION` as well: an entitlement is a product decision, this is a bill.

    AI_TOKEN_ALLOWANCE_DEFAULT=50000   fallback when a row has no allowance
    AI_BUDGET_ENABLED=0                disables enforcement entirely

The allowance does not refill on a schedule. `scripts/grant_subscription.py
--tokens N` tops an account up; that is the intended support move rather than
waiting for a reset.
"""
import os
from datetime import datetime
from typing import Dict, Optional, Tuple

from sqlalchemy import func

from ..extensions import db
from ..models.token_usage import TokenUsage
from ..models.user import DEFAULT_TOKEN_ALLOWANCE, User


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


def allowance_for(user) -> int:
    """This account's total AI allowance. 0 means unlimited."""
    if user is None:
        return _env_int("AI_TOKEN_ALLOWANCE_DEFAULT", DEFAULT_TOKEN_ALLOWANCE)
    value = getattr(user, "token_allowance", None)
    if value is None:
        return _env_int("AI_TOKEN_ALLOWANCE_DEFAULT", DEFAULT_TOKEN_ALLOWANCE)
    return int(value)


def used_tokens(user) -> int:
    """Tokens this account has spent, read fresh from the database.

    A fresh read is not paranoia: `User.track_token_usage` increments the
    counter with raw SQL ("to avoid session-mismatch issues"), which leaves the
    already-loaded ORM attribute stale. Trusting the in-memory value would let
    one account blow past its allowance within a single session.
    """
    if user is None or getattr(user, "id", None) is None:
        return 0
    value = (
        db.session.query(func.coalesce(User.tokens_used, 0))
        .filter(User.id == user.id)
        .scalar()
    )
    return int(value or 0)


def budget_status(user) -> Dict:
    """Usage against the allowance. Safe to surface to a client."""
    allowance = allowance_for(user)
    used = used_tokens(user)
    unlimited = allowance <= 0
    return {
        "tokens_used": used,
        "token_allowance": allowance,
        "remaining": None if unlimited else max(0, allowance - used),
        "unlimited": unlimited,
        "exhausted": bool(not unlimited and used >= allowance),
    }


def check_ai_budget(user, operation_type: str = "") -> Tuple[bool, str]:
    """(allowed, message). An empty message means allowed.

    Returns a refusal rather than raising: the AI service returns user-facing
    prose, so a budget stop has to read like the other stops.
    """
    if not budget_enabled() or user is None:
        return True, ""

    status = budget_status(user)
    if not status["exhausted"]:
        return True, ""

    return False, (
        f"You've used all {status['token_allowance']:,} of your AI tokens. "
        "Ask an admin to top you up to keep using AI features — your progress "
        "and history are saved."
    )


def reset_token_usage(user) -> int:
    """Zero an account's token counter. Returns the previous value.

    The `token_usage` rows are deliberately left alone: they are the analytics
    record of what was actually spent, and deleting them to unblock someone
    would destroy the history that explains why they were blocked.
    """
    if user is None or getattr(user, "id", None) is None:
        return 0
    previous = used_tokens(user)
    account = db.session.get(type(user), user.id)
    account.tokens_used = 0
    db.session.commit()
    return previous


def usage_since(user, since: datetime) -> int:
    """Tokens recorded against this account since `since`.

    Reporting only — enforcement uses the counter above. Useful for "what did
    this account burn today" without trusting the counter's history.
    """
    if user is None or getattr(user, "id", None) is None:
        return 0
    total = (
        db.session.query(func.coalesce(func.sum(TokenUsage.tokens_used), 0))
        .filter(TokenUsage.user_id == user.id, TokenUsage.created_at >= since)
        .scalar()
    )
    return int(total or 0)