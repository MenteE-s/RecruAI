"""Outbox worker process: delivers queued email/Kafka/notifications.

Run one container per host (or ``--scale outbox-worker=N`` on bigger hosts):

    python -m backend.outbox_worker
    python -m backend.outbox_worker --workers 4 --batch-size 50

Each worker thread loops: atomically claim a batch of due rows, dispatch
them, and record success (payload cleared so OTP codes and invite tokens do
not linger) or failure with exponential backoff. Poison rows go ``dead``
after ``max_attempts`` and never retry; old ``done``/``dead`` rows are
deleted opportunistically.

Claiming is a single conditional UPDATE per row (``status=pending`` ->
``processing`` guarded by the same predicate), so any number of threads or
replicas can share the table without double-processing: exactly one claimer
wins each row. ``locked_by`` records ``hostname/thread`` for operators.
"""

import argparse
import logging
import os
import signal
import socket
import threading
import time  # noqa: F401 — kept for future jitter; harmless
from datetime import datetime, timedelta

from .extensions import db
from .models.outbox_event import (
    STATUS_DEAD,
    STATUS_DONE,
    STATUS_FAILED,
    STATUS_PENDING,
    STATUS_PROCESSING,
    OutboxEvent,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("recruai.outbox-worker")

STOP = threading.Event()


def _config_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _backoff_delay_seconds(attempts: int) -> int:
    # 30s, 60s, 120s, ... capped at 15 minutes. Email greylisting and Resend
    # blips clear in minutes; a poison row still burns max_attempts quickly.
    return min(30 * (2 ** max(0, attempts)), 900)


def claim_batch(worker_id: str, batch_size: int) -> list:
    """Atomically move up to ``batch_size`` due rows to processing.

    Must run inside an app context. Returns the claimed row **ids** (plain
    ints, safe to hand across sessions/threads — ORM instances would expire
    on commit and cannot leave the claiming session).
    """
    now = datetime.utcnow()
    candidates = (
        db.session.query(OutboxEvent.id)
        .filter(
            OutboxEvent.status.in_([STATUS_PENDING, STATUS_FAILED]),
            OutboxEvent.next_run_at <= now,
        )
        .order_by(OutboxEvent.next_run_at.asc(), OutboxEvent.id.asc())
        .limit(batch_size)
        .all()
    )
    claimed = []
    for (row_id,) in candidates:
        updated = (
            db.session.query(OutboxEvent)
            .filter(
                OutboxEvent.id == row_id,
                OutboxEvent.status.in_([STATUS_PENDING, STATUS_FAILED]),
            )
            .update(
                {
                    "status": STATUS_PROCESSING,
                    "locked_by": worker_id,
                    "locked_at": now,
                    "updated_at": now,
                },
                synchronize_session=False,
            )
        )
        if updated:
            claimed.append(row_id)
    db.session.commit()
    return claimed


def process_row(app, event_id: int, worker_id: str) -> str:
    """Dispatch one claimed row inside an app context. Returns final status."""
    from backend.outbox_dispatch import (
        EmailNotConfigured,
        UnknownOutboxType,
        dispatch,
    )

    with app.app_context():
        event = db.session.get(OutboxEvent, event_id)
        if event is None or event.status != STATUS_PROCESSING:
            db.session.rollback()
            return "skipped"
        try:
            dispatch(event)
        except (UnknownOutboxType, EmailNotConfigured) as exc:
            # Permanent: never retry, park as dead immediately.
            event.status = STATUS_DEAD
            event.last_error = str(exc)[:2000]
            event.payload = None
            event.locked_by = None
            event.locked_at = None
            event.updated_at = datetime.utcnow()
            db.session.commit()
            logger.warning("outbox %s dead on arrival: %s", event.event_id, exc)
            return "dead"
        except Exception as exc:  # noqa: BLE001 — one bad row must not kill the worker
            event.attempts = int(event.attempts or 0) + 1
            event.last_error = str(exc)[:2000]
            event.locked_by = None
            event.locked_at = None
            event.updated_at = datetime.utcnow()
            if event.attempts >= int(event.max_attempts or 10):
                event.status = STATUS_DEAD
                db.session.commit()
                logger.warning(
                    "outbox %s dead after %s attempts: %s",
                    event.event_id, event.attempts, exc,
                )
                return "dead"
            event.status = STATUS_FAILED
            event.next_run_at = datetime.utcnow() + timedelta(
                seconds=_backoff_delay_seconds(event.attempts)
            )
            db.session.commit()
            logger.info(
                "outbox %s failed (attempt %s), retry at %s: %s",
                event.event_id, event.attempts, event.next_run_at, exc,
            )
            return "failed"
        else:
            event.status = STATUS_DONE
            event.last_error = None
            # Secrets (OTP codes, invite tokens) must not linger after delivery.
            event.payload = None
            event.locked_by = None
            event.locked_at = None
            event.updated_at = datetime.utcnow()
            db.session.commit()
            return "done"


def release_claim(app, event_id: int) -> None:
    """Return an unprocessed claim to pending (used during shutdown drain)."""
    try:
        with app.app_context():
            event = db.session.get(OutboxEvent, event_id)
            if event is not None and event.status == STATUS_PROCESSING:
                event.status = STATUS_PENDING
                event.locked_by = None
                event.locked_at = None
                event.updated_at = datetime.utcnow()
                db.session.commit()
    except Exception:
        logger.exception("could not release outbox claim %s", event_id)


def cleanup_old_rows() -> int:
    """Delete delivered rows past retention; keeps the table small."""
    done_before = datetime.utcnow() - timedelta(
        seconds=_config_int("OUTBOX_DONE_RETENTION_SECONDS", 86400)
    )
    dead_before = datetime.utcnow() - timedelta(
        seconds=_config_int("OUTBOX_DEAD_RETENTION_SECONDS", 7 * 86400)
    )
    total = 0
    total += (
        db.session.query(OutboxEvent)
        .filter(OutboxEvent.status == STATUS_DONE, OutboxEvent.updated_at < done_before)
        .delete(synchronize_session=False)
    )
    total += (
        db.session.query(OutboxEvent)
        .filter(OutboxEvent.status == STATUS_DEAD, OutboxEvent.updated_at < dead_before)
        .delete(synchronize_session=False)
    )
    db.session.commit()
    return total


def worker_loop(app, worker_index: int, batch_size: int, poll_interval: int):
    worker_id = f"{socket.gethostname()}:{worker_index}"
    logger.info("outbox worker %s started (batch=%s)", worker_id, batch_size)
    idle_rounds = 0
    cleanup_every = max(1, int(300 / max(1, poll_interval)))
    while not STOP.is_set():
        try:
            with app.app_context():
                claimed = claim_batch(worker_id, batch_size)
            if not claimed:
                idle_rounds += 1
                # Opportunistic cleanup roughly every ~5 idle minutes.
                if idle_rounds % cleanup_every == 0:
                    try:
                        with app.app_context():
                            removed = cleanup_old_rows()
                        if removed:
                            logger.info("outbox worker %s cleaned %s old rows", worker_id, removed)
                    except Exception:
                        logger.exception("outbox cleanup failed")
                    finally:
                        db.session.remove()
                STOP.wait(poll_interval)
                continue
            idle_rounds = 0
            for event_id in claimed:
                if STOP.is_set():
                    release_claim(app, event_id)
                    break
                try:
                    process_row(app, event_id, worker_id)
                except Exception:
                    logger.exception("outbox worker %s crashed on row %s", worker_id, event_id)
                finally:
                    db.session.remove()
        except Exception:
            logger.exception("outbox worker %s loop error", worker_id)
            try:
                db.session.remove()
            except Exception:
                pass
            STOP.wait(poll_interval)
    logger.info("outbox worker %s stopped", worker_id)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="RecruAI outbox worker")
    parser.add_argument("--workers", type=int, default=_config_int("OUTBOX_WORKERS", 2))
    parser.add_argument("--batch-size", type=int, default=_config_int("OUTBOX_BATCH_SIZE", 25))
    parser.add_argument("--poll-interval", type=int, default=_config_int("OUTBOX_POLL_INTERVAL", 2))
    args = parser.parse_args(argv)

    from .app import create_app

    app = create_app()
    num_workers = max(1, args.workers)

    def _stop(signum, _frame):
        logger.info("outbox worker received signal %s; draining", signum)
        STOP.set()

    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    threads = [
        threading.Thread(
            target=worker_loop,
            args=(app, i, max(1, args.batch_size), max(1, args.poll_interval)),
            name=f"outbox-worker-{i}",
            daemon=True,
        )
        for i in range(num_workers)
    ]
    logger.info("outbox worker starting with %s parallel workers", num_workers)
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
