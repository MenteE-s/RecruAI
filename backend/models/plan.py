"""Admin-managed plan catalogue.

A plan is a named bundle of feature keys with a monthly price. The free tiers
exist as rows so admins can edit copy/pricing without a deploy; the default
rows are seeded by migration ``f2a3b4c5d6e7``.

``User.plan`` / ``Organization.plan`` store the plan slug. Entitlements are
resolved through ``can_access_feature``: trial or paid unlocks everything,
lapsed accounts fall back to the plan's feature list plus any per-account
override.
"""

import json
from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class Plan(db.Model):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True)
    # Slugs are unique per scope, not globally: individual and organization
    # catalogues both have a "free" and "premium" plan.
    slug = db.Column(db.String(64), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    scope = db.Column(db.String(16), nullable=False)  # "individual" or "organization"
    price_cents = db.Column(db.Integer, nullable=False, default=0)
    features = db.Column(db.Text, nullable=False, default="[]")  # JSON list of feature keys
    is_default = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("slug", "scope", name="uq_plans_slug_scope"),
    )

    def feature_list(self):
        try:
            value = json.loads(self.features or "[]")
        except (ValueError, TypeError):
            return []
        return value if isinstance(value, list) else []

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "scope": self.scope,
            "price_cents": self.price_cents,
            "price_display": f"${self.price_cents / 100:.2f}",
            "features": self.feature_list(),
            "is_default": bool(self.is_default),
            "is_active": bool(self.is_active),
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
        }
