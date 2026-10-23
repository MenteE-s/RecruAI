"""
Subscription management utilities for RecruAI
Handles subscription status checking, feature gating, and billing operations.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from functools import wraps
from flask import current_app

from backend.constants import TRIAL_PERIOD_DAYS
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization

# ---------------------------------------------------------------------------
# Feature keys.
#
# A feature key is a string, and until now each call site invented its own
# ("ai_chat", "practice_ai_agents"). Nothing could tell a typo from a deliberate
# entitlement, because the only list that mattered — User.basic_features — only
# listed what a LAPSED user may still do. A key nobody had heard of therefore
# silently meant "not basic", which is the correct default but a poor way to
# discover that a feature was never gated at all.
#
# CVAI is the individual-profile capability set (skill taxonomy, assessments,
# quizzes, guided projects, mock interviews). It is not a separate product and
# not a separate service: it ships inside RecruAI and turns on when an
# individual subscribes. These are the keys that subscription unlocks.
# ---------------------------------------------------------------------------
CVAI_SKILL_ASSESSMENT = "cvai_skill_assessment"
CVAI_QUIZZES = "cvai_quizzes"
CVAI_PROJECTS = "cvai_projects"
CVAI_MOCK_INTERVIEW = "cvai_mock_interview"
CVAI_MENTORSHIP = "cvai_mentorship"

CVAI_FEATURES = (
    CVAI_SKILL_ASSESSMENT,
    CVAI_QUIZZES,
    CVAI_PROJECTS,
    CVAI_MENTORSHIP,
    CVAI_MOCK_INTERVIEW,
)

# What a lapsed individual may still do. Deliberately does NOT include any CVAI
# key: the whole point of subscribing is to switch these on.
BASIC_INDIVIDUAL_FEATURES = (
    "profile_management",
    "job_search",
    "basic_matching",
)


class SubscriptionManager:
    """Centralized subscription management"""

    @staticmethod
    def check_user_access(user: User, feature: str) -> bool:
        """Check if a user can access a specific feature"""
        return user.can_access_feature(feature)

    @staticmethod
    def check_organization_access(org: Organization, feature: str) -> bool:
        """Check if an organization can access a specific feature"""
        return org.can_access_feature(feature)

    @staticmethod
    def can_schedule_interview(user: Optional[User] = None, org: Optional[Organization] = None) -> bool:
        """Check if interview can be scheduled for user or organization"""
        if user and not user.organization:
            return user.can_schedule_interview()
        elif org:
            return org.can_schedule_interview()
        return False

    @staticmethod
    def track_token_usage(user: Optional[User] = None, org: Optional[Organization] = None,
                         provider: str = "", model: str = "", tokens: int = 0,
                         operation_type: str = "") -> None:
        """Track token usage for billing"""
        if user:
            user.track_token_usage(provider, model, tokens, operation_type)
        elif org:
            org.track_token_usage(provider, model, tokens, operation_type)

    @staticmethod
    def track_interview_usage(org: Organization) -> None:
        """Track interview usage for organizations"""
        org.track_interview_usage()

    @staticmethod
    def get_subscription_status(user: Optional[User] = None, org: Optional[Organization] = None) -> Dict[str, Any]:
        """Get subscription status for user or organization"""
        if user:
            return user.get_subscription_status()
        elif org:
            return org.get_subscription_status()
        return {}

    @staticmethod
    def upgrade_to_paid(user: Optional[User] = None, org: Optional[Organization] = None) -> bool:
        """Upgrade user or organization to paid plan"""
        try:
            if user:
                user.subscription_status = "active"
                user.paid_plan = True
            elif org:
                org.subscription_status = "active"
                org.paid_plan = True
            else:
                return False

            db.session.commit()
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to upgrade subscription: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def cancel_subscription(user: Optional[User] = None, org: Optional[Organization] = None) -> bool:
        """Cancel subscription for user or organization"""
        try:
            if user:
                user.subscription_status = "cancelled"
                user.paid_plan = False
            elif org:
                org.subscription_status = "cancelled"
                org.paid_plan = False
            else:
                return False

            db.session.commit()
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to cancel subscription: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def check_trial_expiration(batch_size: int = 1000, max_batches: int = 100) -> Dict[str, int]:
        """Expire trials in bounded batches.

        The scheduler calls this hourly. Loading every trial account into memory
        would be a million-row object graph at scale, so the update is a set of
        short ``UPDATE ... WHERE id IN (...)`` transactions. Returning counts
        lets the worker record ``rows_updated`` and lets a test assert the 30-day
        boundary without inspecting logs.
        """
        if batch_size <= 0:
            batch_size = 1000
        if max_batches <= 0:
            max_batches = 1

        cutoff = datetime.utcnow() - timedelta(days=TRIAL_PERIOD_DAYS)
        totals = {"users": 0, "organizations": 0}

        for model, key in ((User, "users"), (Organization, "organizations")):
            batches = 0
            while batches < max_batches:
                rows = (
                    db.session.query(model.id)
                    .filter(
                        model.subscription_status == "trial",
                        model.trial_start_date.isnot(None),
                        model.trial_start_date <= cutoff,
                    )
                    .limit(batch_size)
                    .all()
                )
                ids = [row[0] for row in rows]
                if not ids:
                    break
                updated = (
                    db.session.query(model)
                    .filter(model.id.in_(ids))
                    .update(
                        {model.subscription_status: "expired"},
                        synchronize_session=False,
                    )
                )
                db.session.commit()
                totals[key] += int(updated or 0)
                batches += 1
                if len(ids) < batch_size:
                    break

        current_app.logger.info(
            "trial expiration: %s users, %s organizations (cutoff=%s)",
            totals["users"],
            totals["organizations"],
            cutoff.isoformat(),
        )
        return totals


def require_subscription(feature: str):
    """
    Decorator to require subscription for API endpoints
    Usage: @require_subscription('ai_chat')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            from backend.models.user import User
            from backend.models.organization import Organization
            from backend.config import Config

            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {"error": "User not found"}, 404

            # Bypass subscription checks in local development environment
            if not Config.IS_PRODUCTION:
                return f(*args, **kwargs)

            # Check access based on user role
            if user.organization:
                # Organization user - check organization subscription
                if not SubscriptionManager.check_organization_access(user.organization, feature):
                    return {
                        "error": "Subscription required",
                        "message": f"Feature '{feature}' requires an active subscription",
                        "subscription_status": SubscriptionManager.get_subscription_status(org=user.organization)
                    }, 403
            else:
                # Individual user - check user subscription
                if not SubscriptionManager.check_user_access(user, feature):
                    return {
                        "error": "Subscription required",
                        "message": f"Feature '{feature}' requires an active subscription",
                        "subscription_status": SubscriptionManager.get_subscription_status(user=user)
                    }, 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def check_content_access(feature: str, free_preview: bool = False):
    """Entitlement for content that may be sampled free, as a function not a decorator.

    Quizzes (C1) and guided projects (C2) both have items marked free to try by
    any signed-in account, because being able to sample one is the only way to
    decide whether to subscribe. The decision depends on the *item*, so it
    cannot be the `@require_subscription` decorator: a decorator runs before the
    route body and would refuse a free preview before the route ever saw it.
    Gating the start endpoint that way left `is_free_preview` set but unreachable.

    Returns (allowed, error_response, status_code). error_response is None when
    allowed, so callers write `allowed, err, code = check_content_access(...)`
    and then `return err, code`.
    """
    if free_preview:
        return True, None, None

    # Mirrors require_subscription: dev is open, so a laptop is not a paywall.
    from backend.config import Config
    if not Config.IS_PRODUCTION:
        return True, None, None

    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return False, {"error": "User not found"}, 404

    if user.organization:
        allowed = SubscriptionManager.check_organization_access(user.organization, feature)
        holder = user.organization
    else:
        allowed = SubscriptionManager.check_user_access(user, feature)
        holder = user

    if allowed:
        return True, None, None

    return False, {
        "error": "Subscription required",
        "message": f"Feature '{feature}' requires an active subscription",
        "subscription_status": SubscriptionManager.get_subscription_status(org=holder)
        if user.organization else
        SubscriptionManager.get_subscription_status(user=user),
    }, 403


def require_interview_access():
    """
    Decorator to require interview scheduling access
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            from backend.models.user import User
            from backend.config import Config

            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {"error": "User not found"}, 404

            # Bypass interview limits in local development environment
            if not Config.IS_PRODUCTION:
                return f(*args, **kwargs)

            # Check interview access
            if not SubscriptionManager.can_schedule_interview(user=user, org=user.organization):
                return {
                    "error": "Interview limit reached",
                    "message": "You've reached your interview limit. Upgrade to schedule more interviews.",
                    "subscription_status": SubscriptionManager.get_subscription_status(
                        user=user, org=user.organization
                    )
                }, 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator