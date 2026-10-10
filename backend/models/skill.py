from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso

# How a skill on someone's profile came to be. A self-declared skill is a claim;
# the rest are evidence, and the difference is what makes a profile worth
# trusting to an employer. Server-written only — never accepted from a client.
EVIDENCE_SELF_DECLARED = "self_declared"
EVIDENCE_ASSESSMENT = "assessment"
EVIDENCE_PROJECT = "project"
EVIDENCE_EXPERIENCE = "experience"
EVIDENCE_CERTIFICATION = "certification"

EVIDENCE_SOURCES = (
    EVIDENCE_SELF_DECLARED,
    EVIDENCE_ASSESSMENT,
    EVIDENCE_PROJECT,
    EVIDENCE_EXPERIENCE,
    EVIDENCE_CERTIFICATION,
)

# Sources strong enough to mark a skill verified on their own.
VERIFIED_EVIDENCE = (EVIDENCE_ASSESSMENT, EVIDENCE_CERTIFICATION)


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    # Canonical Title-Case level from skill_taxonomy.LEVELS. Historical rows
    # stored lowercase, which the org profile UI still compared against; use
    # normalize_level() on the way in rather than trusting the client.
    level = db.Column(db.String(50), nullable=True)
    years_experience = db.Column(db.Integer, nullable=True)
    # Canonical taxonomy slug. NULL means the skill is not catalogued (someone
    # typed "Figma tokens" and we have no idea what that is), which is allowed:
    # the name is preserved as typed and resolve() simply will not match it.
    skill_slug = db.Column(db.String(64), nullable=True, index=True)
    evidence_source = db.Column(db.String(32), nullable=True,
                                default=EVIDENCE_SELF_DECLARED)
    # Provenance as JSON, e.g. {"assessment_id": 12, "score_percent": 88.0}.
    # Free-form on purpose: what counts as proof differs per evidence type.
    evidence_detail = db.Column(db.Text, nullable=True)
    # True only for evidence that stands on its own (assessment, certification).
    verified = db.Column(db.Boolean, nullable=False, default=False)
    last_assessed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # delete-orphan cascade: a skill row cannot outlive its user. Without it,
    # deleting an account makes SQLAlchemy null out skills.user_id (NOT NULL)
    # and the delete fails with an IntegrityError.
    user = db.relationship("User", backref=db.backref(
        "skills", cascade="all, delete-orphan"))

    def set_evidence_detail(self, payload):
        import json
        self.evidence_detail = json.dumps(payload) if payload else None

    def get_evidence_detail(self):
        import json
        if not self.evidence_detail:
            return None
        try:
            return json.loads(self.evidence_detail)
        except (json.JSONDecodeError, TypeError):
            return None

    def to_dict(self, include_evidence=True):
        from ..utils.skill_taxonomy import level_rank, normalize_level

        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "level": normalize_level(self.level),
            "level_rank": level_rank(self.level),
            "years_experience": self.years_experience,
            "skill_slug": self.skill_slug,
            "created_at": utc_iso(self.created_at),
        }
        if include_evidence:
            data["evidence_source"] = self.evidence_source
            data["verified"] = bool(self.verified)
            data["last_assessed_at"] = utc_iso(self.last_assessed_at)
        return data