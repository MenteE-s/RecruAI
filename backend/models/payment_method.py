from datetime import datetime

from backend.extensions import db


class PaymentMethod(db.Model):
    """Stored card metadata for billing (individual or organization scope).

    SECURITY: only non-sensitive metadata is stored — brand, last 4 digits,
    expiry and cardholder name. The full PAN and CVC must NEVER be persisted
    here (no columns exist for them by design). Full card validation happens
    client-side; only these safe fields are sent to the API.
    """

    __tablename__ = "payment_methods"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization_id = db.Column(
        db.Integer, db.ForeignKey("organizations.id"), nullable=True
    )  # NULL = personal card; set = organization card

    brand = db.Column(db.String(20), nullable=False, default="Card")
    last4 = db.Column(db.String(4), nullable=False)
    exp_month = db.Column(db.Integer, nullable=False)  # 1-12
    exp_year = db.Column(db.Integer, nullable=False)  # 4-digit year
    cardholder_name = db.Column(db.String(120), nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        scope = f"org {self.organization_id}" if self.organization_id else "personal"
        return f"<PaymentMethod {self.id} {self.brand} ****{self.last4} ({scope})>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "brand": self.brand,
            "last4": self.last4,
            "exp_month": f"{self.exp_month:02d}",
            "exp_year": f"{self.exp_year % 100:02d}",
            "cardholder_name": self.cardholder_name,
            "is_default": bool(self.is_default),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
