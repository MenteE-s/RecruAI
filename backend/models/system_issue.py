from datetime import datetime

from ..extensions import db


class SystemIssue(db.Model):
    __tablename__ = "system_issues"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    issue_type = db.Column(db.String(50), nullable=False)  # 'bug', 'feature_request', 'improvement', 'other'
    severity = db.Column(db.String(20), nullable=False)  # 'low', 'medium', 'high', 'critical'
    status = db.Column(db.String(20), default="open")  # 'open', 'investigating', 'in_progress', 'resolved', 'closed'

    # User who reported the issue
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user_email = db.Column(db.String(120), nullable=True)  # For anonymous reports

    # Resolution details
    resolution = db.Column(db.Text, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reporter = db.relationship("User", foreign_keys=[user_id], backref="reported_issues")
    resolver = db.relationship("User", foreign_keys=[resolved_by], backref="resolved_issues")

    def __repr__(self):
        return f"<SystemIssue {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "issue_type": self.issue_type,
            "severity": self.severity,
            "status": self.status,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "resolution": self.resolution,
            "resolved_by": self.resolved_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "reporter": {
                "id": self.reporter.id if self.reporter else None,
                "name": self.reporter.name if self.reporter else None,
                "email": self.reporter.email if self.reporter else None,
            } if self.reporter else None,
            "resolver": {
                "id": self.resolver.id if self.resolver else None,
                "name": self.resolver.name if self.resolver else None,
                "email": self.resolver.email if self.resolver else None,
            } if self.resolver else None,
        }