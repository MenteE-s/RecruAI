"""Dispatch side of the transactional outbox (runs in the worker only).

``dispatch(event)`` executes one outbox row and raises on failure so the
worker can retry with backoff. ``email_not_configured`` is permanent: without
a Resend key no retry will ever succeed, so the row goes straight to dead
instead of clogging the queue.
"""

import logging

logger = logging.getLogger(__name__)


class EmailNotConfigured(RuntimeError):
    """Resend is not configured; retrying is pointless."""


class UnknownOutboxType(RuntimeError):
    """The row's type has no handler; fail fast, never retry."""


def _send_email(payload: dict) -> None:
    from .utils import email_service as emails
    from .utils.outbox import (
        EMAIL_CHANGE_NOTICE,
        EMAIL_CHANGE_OTP,
        EMAIL_INVITATION,
        EMAIL_OTP,
        EMAIL_PASSWORD_CHANGED,
        EMAIL_PASSWORD_RESET,
        EMAIL_WELCOME,
    )

    kind = payload.get("kind")
    to_email = payload.get("to_email")
    ctx = payload.get("context") or {}
    if not kind or not to_email:
        raise UnknownOutboxType(f"email event missing kind/to_email: {payload!r}")

    if kind == EMAIL_OTP:
        ok, err = emails.send_otp_email(to_email, ctx.get("name", ""), ctx["code"])
    elif kind == EMAIL_CHANGE_OTP:
        ok, err = emails.send_otp_email(
            to_email, ctx.get("name", ""), ctx["code"], context="change_email"
        )
    elif kind == EMAIL_PASSWORD_RESET:
        ok, err = emails.send_password_reset_email(to_email, ctx.get("name", ""), ctx["code"])
    elif kind == EMAIL_PASSWORD_CHANGED:
        ok, err = emails.send_password_changed_email(to_email, ctx.get("name", ""))
    elif kind == EMAIL_WELCOME:
        ok, err = emails.send_welcome_email(to_email, ctx.get("name", ""), ctx.get("role", "individual"))
    elif kind == EMAIL_INVITATION:
        ok, err = emails.send_organization_invitation_email(
            to_email,
            ctx.get("organization_name", ""),
            ctx.get("inviter_name", ""),
            ctx.get("role", ""),
            ctx["token"],
            ctx.get("expires_days", 7),
        )
    elif kind == EMAIL_CHANGE_NOTICE:
        ok, err = emails.send_email_change_notice(to_email, ctx.get("name", ""), ctx["new_email"])
    else:
        raise UnknownOutboxType(f"unknown email kind: {kind!r}")

    if not ok:
        if err == "email_not_configured":
            raise EmailNotConfigured(f"Resend not configured; cannot send {kind} to {to_email}")
        raise RuntimeError(f"email send failed ({kind} -> {to_email}): {err}")


def _emit_kafka(payload: dict) -> None:
    from .utils.kafka_service import kafka_service

    event_type = payload.get("event_type")
    data = payload.get("data")
    topic = payload.get("topic")
    if not event_type or not isinstance(data, dict):
        raise UnknownOutboxType(f"kafka event missing event_type/data: {payload!r}")
    if not kafka_service.emit_event(event_type, data, topic=topic):
        raise RuntimeError(f"kafka publish failed for {event_type}")


def _create_notification(payload: dict) -> None:
    from .extensions import db
    from .models import Notification

    user_id = payload.get("user_id")
    if not user_id:
        raise UnknownOutboxType(f"notification event missing user_id: {payload!r}")
    notification = Notification.create_notification(
        user_id=user_id,
        notification_type=payload.get("notification_type", "general"),
        title=payload.get("title", ""),
        message=payload.get("message", ""),
        **(payload.get("extra") or {}),
    )
    db.session.add(notification)
    db.session.commit()


def dispatch(event) -> None:
    """Execute one outbox row. Raises on failure (worker retries)."""
    from .models.outbox_event import (
        TYPE_EMAIL_SEND,
        TYPE_KAFKA_EMIT,
        TYPE_NOTIFICATION_CREATE,
    )

    if event.type == TYPE_EMAIL_SEND:
        _send_email(event.payload or {})
    elif event.type == TYPE_KAFKA_EMIT:
        _emit_kafka(event.payload or {})
    elif event.type == TYPE_NOTIFICATION_CREATE:
        _create_notification(event.payload or {})
    else:
        raise UnknownOutboxType(f"unknown outbox type: {event.type!r}")
