from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class CompanyFollow(db.Model):
    __tablename__ = "company_follows"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "organization_id", name="uq_company_follow_user_org"),
    )

    user = db.relationship("User", backref="company_follows")
    organization = db.relationship("Organization", backref="followers")

    def to_dict(self, with_latest_post=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "followed_at": utc_iso(self.created_at),
            "organization": self.organization.to_public_dict() if self.organization else None,
        }
        if with_latest_post and self.organization:
            # Query explicitly to get the newest ACTIVE post (relationship order not guaranteed)
            from .post import Post

            latest = (
                Post.query.filter_by(organization_id=self.organization_id, status="active")
                .order_by(Post.created_at.desc())
                .first()
            )
            open_roles = Post.query.filter_by(organization_id=self.organization_id, status="active").count()
            data["latest_post"] = latest.to_dict() if latest else None
            data["open_roles"] = open_roles
        return data
