"""Enqueue side of the transactional outbox.

Call these inside the request's transaction and let the caller commit: the
outbox row lands atomically with the domain row, so a crash can never produce
"user created but no welcome email queued" or the reverse. Functions only add
to ``db.session``; they never commit, flush-except-as-needed, or send.

Payloads are JSON and size-capped like Kafka events: user-controlled fields
(name, title, message) must not fan out unbounded rows.
"""

import json
import logging
import uuid
from datetime import datetime, timedelta

from ..extensions import db
from ..models.outbox_event import (
    EVENT_TYPES,
    STATUS_PENDING,
    TYPE_EMAIL_SEND,
    TYPE_KAFKA_EMIT,
    TYPE_NOTIFICATION_CREATE,
    OutboxEvent,
)

logger = logging.getLogger(__name__)

MAX_PAYLOAD_BYTES = 8192

#: Email kinds the dispatcher understands. The ``payload`` for each kind is
#: documented next to its sender in ``backend/outbox_dispatch.py``.
EMAIL_OTP = "otp"
EMAIL_PASSWORD_RESET = "password_reset"
EMAIL_PASSWORD_CHANGED = "password_changed"
EMAIL_WELCOME = "welcome"
EMAIL_INVITATION = "invitation"
EMAIL_CHANGE_OTP = "change_email_otp"
EMAIL_CHANGE_NOTICE = "change_email_notice"

EMAIL_KINDS = frozenset({
    EMAIL_OTP,
    EMAIL_PASSWORD_RESET,
    EMAIL_PASSWORD_CHANGED,
    EMAIL_WELCOME,
    EMAIL_INVITATION,
    EMAIL_CHANGE_OTP,
    EMAIL_CHANGE_NOTICE,
})


def _check_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("outbox payload must be a dict")
    raw = json.dumps(payload, default=str).encode("utf-8")
    if len(raw) > MAX_PAYLOAD_BYTES:
        raise ValueError(f"outbox payload too large ({len(raw)} bytes)")
    return payload


def enqueue_event(
    event_type: str,
    payload: dict,
    *,
    max_attempts: int = 10,
    delay_seconds: int = 0,
    event_id: str | None = None,
) -> OutboxEvent:
    """Add an outbox row to the current transaction. Caller commits."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"unknown outbox event type: {event_type!r}")
    _check_payload(payload)
    now = datetime.utcnow()
    event = OutboxEvent(
        event_id=event_id or uuid.uuid4().hex,
        type=event_type,
        payload=dict(payload),
        status=STATUS_PENDING,
        attempts=0,
        max_attempts=max(1, int(max_attempts)),
        next_run_at=now + timedelta(seconds=max(0, delay_seconds)) if delay_seconds else now,
        created_at=now,
        updated_at=now,
    )
    db.session.add(event)
    return event


def enqueue_email(kind: str, to_email: str, context: dict | None = None, **kwargs) -> OutboxEvent:
    """Queue a transactional email. ``context`` holds kind-specific fields."""
    if kind not in EMAIL_KINDS:
        raise ValueError(f"unknown email kind: {kind!r}")
    payload = {"kind": kind, "to_email": to_email, "context": dict(context or {})}
    return enqueue_event(TYPE_EMAIL_SEND, payload, **kwargs)


def enqueue_kafka_event(
    event_type: str, data: dict, topic: str | None = None, **kwargs
) -> OutboxEvent:
    """Queue a Kafka publish. Same shape/validation as ``emit_event``."""
    import re

    if not isinstance(event_type, str) or not re.fullmatch(r"[A-Za-z0-9_]{1,64}", event_type):
        raise ValueError(f"invalid kafka event_type: {event_type!r}")
    if not isinstance(data, dict):
        raise ValueError("kafka event data must be a dict")
    payload = {"event_type": event_type, "data": data}
    if topic:
        payload["topic"] = topic
    return enqueue_event(TYPE_KAFKA_EMIT, payload, **kwargs)


def enqueue_notification(
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    **kwargs,
) -> OutboxEvent:
    """Queue an in-app notification insert (extra kwargs become columns)."""
    payload = {
        "user_id": user_id,
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "extra": dict(kwargs),
    }
    # kwargs are notification columns, not outbox scheduling options. Passing
    # them through to enqueue_event() raised TypeError before the row was ever
    # written, so notifications queued from request code were silently lost.
    return enqueue_event(TYPE_NOTIFICATION_CREATE, payload)
