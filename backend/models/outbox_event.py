"""Durable outbox for background work.

The API only validates, writes the domain row + outbox row in the same
transaction, and returns. One or more ``outbox-worker`` processes claim due
rows, execute them (Resend email, Kafka publish, notification fan-out), retry
with exponential backoff, and park poison rows as ``dead`` instead of
blocking the queue.

Delivery is at-least-once: a crash between "sent" and "marked done" can
duplicate an email. Handlers must therefore be safe to run twice (Resend
sends are idempotent enough for OTP/welcome/notice mail; invitation tokens
are single-use on accept, not on send).
"""

from datetime import datetime

from backend.extensions import db
from backend.utils.timezone_utils import utc_iso

#: Row is waiting for a worker.
STATUS_PENDING = "pending"
#: A worker currently owns the row.
STATUS_PROCESSING = "processing"
#: Handler succeeded; payload is cleared (see below).
STATUS_DONE = "done"
#: Handler failed; will be retried at ``next_run_at``.
STATUS_FAILED = "failed"
#: Exhausted ``max_attempts``; needs operator attention, never retried.
STATUS_DEAD = "dead"

STATUSES = frozenset({STATUS_PENDING, STATUS_PROCESSING, STATUS_FAILED, STATUS_DONE, STATUS_DEAD})

#: Event types the dispatcher understands. Unknown types are failed fast so a
#: bad enqueue never spins the retry loop.
TYPE_EMAIL_SEND = "email.send"
TYPE_KAFKA_EMIT = "kafka.emit"
TYPE_NOTIFICATION_CREATE = "notification.create"

EVENT_TYPES = frozenset({TYPE_EMAIL_SEND, TYPE_KAFKA_EMIT, TYPE_NOTIFICATION_CREATE})


class OutboxEvent(db.Model):
    __tablename__ = "outbox_events"

    id = db.Column(db.Integer, primary_key=True)
    # Unique idempotency key: producers may pass their own (e.g. invitation id
    # + purpose); otherwise a random uuid4 hex.
    event_id = db.Column(db.String(64), nullable=False, unique=True)
    type = db.Column(db.String(64), nullable=False)
    # JSON payload; cleared on success so secrets (OTP codes, invite tokens)
    # do not linger in the table after delivery.
    payload = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(16), nullable=False, default=STATUS_PENDING)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    max_attempts = db.Column(db.Integer, nullable=False, default=10)
    next_run_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_error = db.Column(db.Text, nullable=True)
    locked_by = db.Column(db.String(255), nullable=True)
    locked_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.Index("ix_outbox_status_next_run", "status", "next_run_at"),
        db.Index("ix_outbox_type", "type"),
        db.Index("ix_outbox_created_at", "created_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "type": self.type,
            "status": self.status,
            "attempts": self.attempts,
            "max_attempts": self.max_attempts,
            "next_run_at": utc_iso(self.next_run_at),
            "last_error": self.last_error,
            "created_at": utc_iso(self.created_at),
        }
