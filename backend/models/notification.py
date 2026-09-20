from datetime import datetime
from backend.extensions import db
from backend.utils.timezone_utils import utc_iso


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", backref="notifications", foreign_keys=[user_id])

    # Notification type
    type = db.Column(db.String(50), nullable=False)  # 'interview_scheduled', 'interview_cancelled', 'interview_passed', 'profile_favorited', 'profile_viewed', etc.

    # Notification title and message
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Related entity IDs (optional)
    related_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # For profile views/favorites
    related_organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    related_interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=True)
    related_application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=True)
    related_post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)

    # Status fields
    is_read = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    is_favorited = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Notification {self.id} - {self.type} for user {self.user_id}>"

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_at = datetime.utcnow()

    def archive(self):
        """Archive the notification"""
        self.is_archived = True

    def unarchive(self):
        """Unarchive the notification"""
        self.is_archived = False

    def favorite(self):
        """Mark as favorite"""
        self.is_favorited = True

    def delete(self):
        """Soft delete the notification"""
        self.is_deleted = True

    @classmethod
    def create_notification(cls, user_id, notification_type, title, message, **kwargs):
        """Factory method to create notifications"""
        notification = cls(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            related_user_id=kwargs.get('related_user_id'),
            related_organization_id=kwargs.get('related_organization_id'),
            related_interview_id=kwargs.get('related_interview_id'),
            related_application_id=kwargs.get('related_application_id'),
            related_post_id=kwargs.get('related_post_id')
        )
        return notification

    def to_dict(self):
        """Enriched payload: related org (logo/name) and linked job post."""
        from .organization import Organization
        from .application import Application
        from .post import Post

        org = None
        if self.related_organization_id:
            org = Organization.query.get(self.related_organization_id)

        post = None
        if self.related_post_id:
            post = Post.query.get(self.related_post_id)
        elif self.related_application_id:
            app = Application.query.get(self.related_application_id)
            if app:
                post = app.post

        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "is_archived": self.is_archived,
            "is_favorited": self.is_favorited,
            "created_at": utc_iso(self.created_at),
            "read_at": utc_iso(self.read_at),
            "related_user_id": self.related_user_id,
            "related_organization_id": self.related_organization_id,
            "related_interview_id": self.related_interview_id,
            "related_application_id": self.related_application_id,
            "related_post_id": self.related_post_id,
            "related_entities": {
                "user_id": self.related_user_id,
                "organization_id": self.related_organization_id,
                "interview_id": self.related_interview_id,
                "application_id": self.related_application_id,
                "post_id": self.related_post_id,
            },
            "organization": {
                "id": org.id,
                "name": org.name,
                "profile_image": org.profile_image,
            } if org else None,
            "post": {
                "id": post.id,
                "title": post.title,
                "location": post.location,
                "employment_type": post.employment_type,
            } if post else None,
        }