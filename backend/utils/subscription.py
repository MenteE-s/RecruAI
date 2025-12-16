"""
Subscription management utilities for RecruAI
Handles subscription status checking, feature gating, and billing operations.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from functools import wraps
from flask import current_app

from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization


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
    def check_trial_expiration() -> None:
        """Check for expired trials and update status (to be called by scheduler)"""
        try:
            # Update expired user trials
            expired_users = User.query.filter(
                User.subscription_status == "trial",
                User.trial_start_date < datetime.utcnow() - timedelta(days=7)
            ).all()

            for user in expired_users:
                user.subscription_status = "expired"

            # Update expired organization trials
            expired_orgs = Organization.query.filter(
                Organization.subscription_status == "trial",
                Organization.trial_start_date < datetime.utcnow() - timedelta(days=7)
            ).all()

            for org in expired_orgs:
                org.subscription_status = "expired"

            db.session.commit()
            current_app.logger.info(f"Updated {len(expired_users)} users and {len(expired_orgs)} organizations with expired trials")

        except Exception as e:
            current_app.logger.error(f"Failed to check trial expiration: {e}")
            db.session.rollback()


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

            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {"error": "User not found"}, 404

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


def require_interview_access():
    """
    Decorator to require interview scheduling access
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            from backend.models.user import User

            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {"error": "User not found"}, 404

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