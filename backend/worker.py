"""Scheduler worker process.

Run exactly one of these per environment:

    python -m backend.worker

It is a separate container/service from the API (see docker-compose.aws.yml).
The API never starts APScheduler. ``pg_try_advisory_lock`` protects against a
second worker being started by accident, and every run is recorded in
``scheduler_runs`` for ``GET /api/health/scheduler``.
"""

import logging
import signal
import sys

from .app import create_app
from .scheduler import build_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("recruai.scheduler")


def main() -> int:
    app = create_app()
    scheduler = build_scheduler(app, blocking=True)

    def _stop(signum, _frame):
        logger.info("scheduler received signal %s; shutting down", signum)
        try:
            scheduler.shutdown(wait=False)
        except Exception:
            pass

    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    logger.info(
        "scheduler worker starting with jobs: %s",
        ", ".join(sorted(job.id for job in scheduler.get_jobs())),
    )
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("scheduler worker stopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
