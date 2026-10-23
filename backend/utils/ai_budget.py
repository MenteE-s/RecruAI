"""Central AI token budget gate and usage ledger.

Every LLM call in the product goes through ``BudgetedLLMProvider`` in
``ai_providers.py``. That wrapper resolves the acting account (the signed-in
user, or their organization when the user belongs to one), enforces the
allowance atomically before the provider is called, and records one
``token_usage`` row afterwards.

The old implementation enforced only ``AIService.generate_response``. Direct
``llm_provider.chat``/``generate`` calls in recommendations, RAG, mentorship,
mock interviews, and the interview agent bypassed it entirely, so an account
could spend without limit through those paths.

Concurrency: the reservation is a single ``UPDATE ... WHERE used + estimate <=
allowance RETURNING ...`` on a separate connection. A per-process check followed
by ``used += n`` would let two requests both pass at the last token. The separate
connection also means an AI call cannot accidentally commit (or roll back) the
caller's unrelated database transaction.

    AI_BUDGET_ENABLED=0              disables enforcement (never in production)
    AI_TOKEN_ALLOWANCE_DEFAULT=50000 fallback for rows without an allowance
"""

from datetime import datetime, timedelta
import logging
import os
from typing import Dict, Optional, Tuple

from sqlalchemy import func, text

from ..constants import AI_BUDGET_WARNING_FRACTION
from ..extensions import db
from ..models import Organization, TokenUsage, User

logger = logging.getLogger(__name__)


class AIBudgetError(Exception):
    """Raised when a model call is refused or cannot be attributed.

    Routes translate this to a 402 JSON response. Tool layers that catch broad
    exceptions must re-raise this type or the user gets a misleading generic
    failure and the call is still not counted.
    """

    status_code = 402
    code = "ai_budget_exhausted"

    def __init__(self, message: str, code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


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


def _account_is_org(account) -> bool:
    return isinstance(account, Organization)


def _table_for(account) -> str:
    return "organizations" if _account_is_org(account) else "users"


def account_id(account) -> Optional[int]:
    return getattr(account, "id", None)


def allowance_for(account) -> int:
    """This account's total AI allowance. 0 means unlimited."""
    if account is None:
        return _env_int("AI_TOKEN_ALLOWANCE_DEFAULT", 50_000)
    value = getattr(account, "token_allowance", None)
    if value is None:
        return _env_int("AI_TOKEN_ALLOWANCE_DEFAULT", 50_000)
    return int(value)


def used_tokens(account) -> int:
    """Read the counter fresh, bypassing a stale ORM identity map."""
    if account is None or account_id(account) is None:
        return 0
    table = _table_for(account)
    with db.engine.connect() as conn:
        value = conn.execute(
            text(f"SELECT COALESCE(tokens_used, 0) FROM {table} WHERE id = :id"),
            {"id": account_id(account)},
        ).scalar()
    return int(value or 0)


def budget_status(account) -> Dict:
    """Usage against the allowance. Safe to surface to a client."""
    allowance = allowance_for(account)
    used = used_tokens(account)
    unlimited = allowance <= 0
    fraction = 0.0 if unlimited or allowance == 0 else min(1.0, used / allowance)
    return {
        "actor_type": "organization" if _account_is_org(account) else "user",
        "actor_id": account_id(account),
        "tokens_used": used,
        "token_allowance": allowance,
        "remaining": None if unlimited else max(0, allowance - used),
        "unlimited": unlimited,
        "exhausted": bool(not unlimited and used >= allowance),
        "warning": bool(not unlimited and fraction >= AI_BUDGET_WARNING_FRACTION),
        "percent_used": round(fraction * 100, 1) if not unlimited else 0.0,
    }


def check_ai_budget(account, operation_type: str = "") -> Tuple[bool, str]:
    """(allowed, message). An empty message means allowed."""
    if not budget_enabled() or account is None:
        return True, ""
    status = budget_status(account)
    if not status["exhausted"]:
        return True, ""
    return False, (
        f"You've used all {status['token_allowance']:,} of your AI tokens. "
        "Ask an admin to top you up to keep using AI features — your progress "
        "and history are saved."
    )


def _actor_from_request():
    """Resolve the signed-in account for a call made inside a request.

    Route decorators have already verified the JWT by the time an LLM call runs,
    so this reads the current identity rather than decoding again. Background
    work has no request and must pass an explicit actor.
    """
    try:
        from flask import has_request_context
        from flask_jwt_extended import get_jwt, get_jwt_identity

        if not has_request_context():
            return None, None
        identity = get_jwt_identity()
        if identity is None:
            return None, None
        try:
            user_id = int(identity)
        except (TypeError, ValueError):
            return None, None
        user = db.session.get(User, user_id)
        if user is None or user.deleted_at is not None:
            return None, None
        claims = {}
        try:
            claims = get_jwt() or {}
        except Exception:
            claims = {}
        org_id = claims.get("organization_id") or user.organization_id
        if org_id:
            org = db.session.get(Organization, int(org_id))
            if org is not None:
                return org, user
        return user, user
    except Exception:
        return None, None


def resolve_ai_actor(user=None, organization=None):
    """Return ``(account_to_charge, attributed_user)``.

    An organization member's usage is charged to the organization, so one
    employee's chat cannot exhaust a colleague's personal allowance. The
    attributed_user is still recorded on the usage row for support/debugging.
    """
    if organization is not None:
        return organization, user
    if user is not None:
        if getattr(user, "deleted_at", None) is not None:
            raise AIBudgetError(
                "This account has been deleted.", code="account_deleted"
            )
        org_id = getattr(user, "organization_id", None)
        if org_id:
            org = db.session.get(Organization, int(org_id))
            if org is not None:
                return org, user
        return user, user
    return _actor_from_request()


def _estimate_prompt_tokens(messages) -> int:
    # Four characters per token is the usual rough estimate for English. The
    # reservation only needs to be conservative enough to stop runaway calls;
    # the provider's reported usage replaces it after the call.
    chars = 0
    for message in messages or []:
        if not isinstance(message, dict):
            continue
        content = message.get("content")
        if isinstance(content, str):
            chars += len(content)
        elif content is not None:
            chars += len(str(content))
    return max(1, chars // 4 + 16)


def estimate_tokens_for_messages(messages) -> int:
    """Public prompt-size estimate used by the provider wrapper."""
    return _estimate_prompt_tokens(messages)


def reserve_budget(account, estimate: int) -> Dict:
    """Atomically reserve estimated tokens. Raises ``AIBudgetError`` on refusal.

    Returns ``{"reserved": int, "previous_used": int, "allowance": int,
    "unlimited": bool}``. ``reserved`` may be 0 for an unlimited account.
    """
    estimate = max(1, int(estimate or 1))
    allowance = allowance_for(account)
    if allowance <= 0:
        return {
            "reserved": 0,
            "previous_used": used_tokens(account),
            "allowance": allowance,
            "unlimited": True,
        }

    table = _table_for(account)
    default_allowance = _env_int("AI_TOKEN_ALLOWANCE_DEFAULT", 50_000)
    with db.engine.begin() as conn:
        row = conn.execute(
            text(
                f"""
                UPDATE {table}
                   SET tokens_used = COALESCE(tokens_used, 0) + :estimate
                 WHERE id = :id
                   AND COALESCE(token_allowance, :default_allowance) > 0
                   AND COALESCE(tokens_used, 0) + :estimate
                       <= COALESCE(token_allowance, :default_allowance)
                RETURNING COALESCE(tokens_used, 0) - :estimate AS previous_used
                """
            ),
            {
                "estimate": estimate,
                "id": account_id(account),
                "default_allowance": default_allowance,
            },
        ).first()

    if row is None:
        status = budget_status(account)
        if status["exhausted"]:
            message = (
                f"You've used all {status['token_allowance']:,} of your AI tokens. "
                "Ask an admin to top you up to keep using AI features — your "
                "progress and history are saved."
            )
        else:
            message = (
                "This AI request needs more tokens than remain on the account. "
                "Ask an admin to top up the allowance and try again."
            )
        raise AIBudgetError(message)

    previous = int(row[0] or 0)
    return {
        "reserved": estimate,
        "previous_used": previous,
        "allowance": allowance,
        "unlimited": False,
    }


def _record_usage(
    account,
    attribution_user,
    provider,
    model,
    counter_delta,
    actual_tokens,
    operation_type,
):
    """Write the analytics row and adjust the counter on the same connection.

    ``counter_delta`` is what remains to be added after the reservation;
    ``actual_tokens`` is what the provider reported and is what the ledger row
    records. They differ whenever the completion used fewer or more tokens than
    the estimate. Storing the delta in the ledger would undercount every call.
    """
    table = _table_for(account)
    user_id = getattr(attribution_user, "id", None) if attribution_user is not None else None
    org_id = getattr(account, "id", None) if _account_is_org(account) else getattr(attribution_user, "organization_id", None)
    if _account_is_org(account):
        org_id = account.id
    with db.engine.begin() as conn:
        conn.execute(
            text(
                f"""
                UPDATE {table}
                   SET tokens_used = GREATEST(0, COALESCE(tokens_used, 0) + :delta)
                 WHERE id = :id
                """
            ),
            {"delta": int(counter_delta), "id": account_id(account)},
        )
        conn.execute(
            text(
                """
                INSERT INTO token_usage
                    (user_id, organization_id, provider, model, tokens_used,
                     operation_type, created_at)
                VALUES
                    (:user_id, :organization_id, :provider, :model, :tokens,
                     :operation_type, :created_at)
                """
            ),
            {
                "user_id": user_id,
                "organization_id": org_id,
                "provider": (provider or "unknown")[:50],
                "model": (model or "unknown")[:100],
                "tokens": int(actual_tokens),
                "operation_type": (operation_type or "ai_chat")[:50],
                "created_at": datetime.utcnow(),
            },
        )


def finalize_budget(account, attribution_user, reservation: Dict, actual_tokens: int,
                    provider: str, model: str, operation_type: str = "ai_chat") -> Dict:
    """Replace the reservation with actual usage and record the ledger row."""
    reserved = int(reservation.get("reserved", 0) or 0)
    actual = int(actual_tokens or reserved or 1)
    if reservation.get("unlimited"):
        delta = actual
    else:
        delta = actual - reserved
    _record_usage(
        account,
        attribution_user,
        provider,
        model,
        delta,
        actual,
        operation_type,
    )

    new_used = int(reservation.get("previous_used", 0) or 0) + actual
    allowance = int(reservation.get("allowance", 0) or 0)
    if allowance > 0:
        previous_fraction = (reservation.get("previous_used", 0) or 0) / allowance
        new_fraction = new_used / allowance
        if previous_fraction < AI_BUDGET_WARNING_FRACTION <= new_fraction:
            logger.warning(
                "ai_budget_80pct actor_type=%s actor_id=%s used=%s allowance=%s",
                "organization" if _account_is_org(account) else "user",
                account_id(account),
                new_used,
                allowance,
            )
    return {
        "tokens_used": actual,
        "reserved": reserved,
        "account_used": new_used,
    }


def release_budget(account, reservation: Dict) -> None:
    """Undo a reservation when the provider call failed before reporting usage."""
    reserved = int((reservation or {}).get("reserved", 0) or 0)
    if reserved <= 0:
        return
    table = _table_for(account)
    try:
        with db.engine.begin() as conn:
            conn.execute(
                text(
                    f"""
                    UPDATE {table}
                       SET tokens_used = GREATEST(0, COALESCE(tokens_used, 0) - :reserved)
                     WHERE id = :id
                    """
                ),
                {"reserved": reserved, "id": account_id(account)},
            )
    except Exception:
        logger.exception("could not release AI budget reservation")


def reset_token_usage(account) -> int:
    """Zero an account's token counter. Returns the previous value."""
    if account is None or account_id(account) is None:
        return 0
    previous = used_tokens(account)
    table = _table_for(account)
    with db.engine.begin() as conn:
        conn.execute(
            text(f"UPDATE {table} SET tokens_used = 0 WHERE id = :id"),
            {"id": account_id(account)},
        )
    return previous


def usage_since(account, since: datetime) -> int:
    """Tokens recorded against this account since ``since`` (reporting only)."""
    if account is None or account_id(account) is None:
        return 0
    query = db.session.query(func.coalesce(func.sum(TokenUsage.tokens_used), 0))
    if _account_is_org(account):
        query = query.filter(TokenUsage.organization_id == account.id)
    else:
        query = query.filter(
            TokenUsage.user_id == account.id,
            TokenUsage.organization_id.is_(None),
        )
    return int(query.filter(TokenUsage.created_at >= since).scalar() or 0)


def daily_usage_report(hours: int = 24, limit: int = 50000) -> Dict:
    """Summarise the last day's usage for ops and 80%-allowance alerting.

    This is an aggregate, not a per-call gate; it intentionally does not write
    notifications itself. Logging accounts that crossed 80% is enough for the
    launch period and keeps the worker from fanning out a million notifications.
    """
    since = datetime.utcnow() - timedelta(hours=max(1, int(hours or 24)))
    rows = (
        db.session.query(
            TokenUsage.user_id,
            TokenUsage.organization_id,
            func.coalesce(func.sum(TokenUsage.tokens_used), 0).label("tokens"),
        )
        .filter(TokenUsage.created_at >= since)
        .group_by(TokenUsage.user_id, TokenUsage.organization_id)
        .order_by(func.coalesce(func.sum(TokenUsage.tokens_used), 0).desc())
        .limit(max(1, min(int(limit or 50000), 100000)))
        .all()
    )
    near_limit = 0
    for user_id, org_id, tokens in rows:
        if org_id:
            account = db.session.get(Organization, org_id)
        elif user_id:
            account = db.session.get(User, user_id)
        else:
            account = None
        allowance = allowance_for(account)
        if allowance > 0 and int(tokens or 0) >= allowance * AI_BUDGET_WARNING_FRACTION:
            near_limit += 1
    report = {
        "since": since.isoformat() + "Z",
        "accounts": len(rows),
        "near_or_over_allowance": near_limit,
    }
    logger.info("daily AI usage report: %s", report)
    return report
