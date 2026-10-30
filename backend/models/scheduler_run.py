"""Observability records for the dedicated scheduler worker.

The web process does not run APScheduler. ``backend.worker`` owns the schedule
and writes one row per attempted job run, so "did trial expiry actually run?"
is answerable from the database instead of from a container's stdout.
"""

from datetime import datetime

from backend.extensions import db
from backend.utils.timezone_utils import utc_iso


class SchedulerRun(db.Model):
    __tablename__ = "scheduler_runs"

    id = db.Column(db.Integer, primary_key=True)
    job_name = db.Column(db.String(80), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False)  # running, success, error, skipped
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    finished_at = db.Column(db.DateTime, nullable=True)
    rows_updated = db.Column(db.Integer, nullable=False, default=0)
    # Hostname/container id helps when more than one worker is ever deployed.
    worker = db.Column(db.String(255), nullable=True)
    error = db.Column(db.Text, nullable=True)
    detail = db.Column(db.Text, nullable=True)

    __table_args__ = (
        db.Index("ix_scheduler_runs_job_started", "job_name", "started_at"),
        db.Index(
            "ix_scheduler_runs_job_status_finished",
            "job_name",
            "status",
            "finished_at",
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "job_name": self.job_name,
            "status": self.status,
            "started_at": utc_iso(self.started_at),
            "finished_at": utc_iso(self.finished_at),
            "rows_updated": self.rows_updated or 0,
            "worker": self.worker,
            "error": self.error,
        }
