"""
Recommendation Job Embedding Model
"""

from datetime import datetime
from typing import Optional

from backend.extensions import db

# Try to import Vector for pgvector support, fallback to Text if not available
try:
    from pgvector.sqlalchemy import Vector
    HAS_VECTOR = True
except ImportError:
    HAS_VECTOR = False
    Vector = None

from backend.config import Config


class JobEmbedding(db.Model):
    """
    Model for storing job post embeddings
    """
    __tablename__ = "recommendation_job_embeddings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    job_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    organization_id = db.Column(db.String(255), nullable=True, index=True)

    # Job content used for embedding
    job_content = db.Column(db.Text, nullable=False)  # Job description and requirements

    # Vector embedding
    if HAS_VECTOR:
        embedding = db.Column(Vector(Config().EMBEDDING_DIMENSIONS), nullable=False)
    else:
        embedding = db.Column(db.Text, nullable=False)  # Store as JSON string

    # Metadata
    job_title = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=True)
    experience_required = db.Column(db.Float, default=0)
    skills_required = db.Column(db.Text, nullable=True)  # JSON list of skills

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JobEmbedding(job_id={self.job_id}, title={self.job_title})>"