"""
Recommendation Profile Embedding Model
"""

from datetime import datetime
from typing import Optional
import json

from backend.extensions import db

# Try to import VECTOR for pgvector support, fallback to Text if not available
try:
    from sqlalchemy.dialects.postgresql import VECTOR
    HAS_VECTOR = True
except ImportError:
    HAS_VECTOR = False
    VECTOR = None

from backend.config import Config


class ProfileEmbedding(db.Model):
    """
    Model for storing user profile embeddings
    """
    __tablename__ = "recommendation_profile_embeddings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    organization_id = db.Column(db.String(255), nullable=True, index=True)

    # Profile content used for embedding
    profile_content = db.Column(db.Text, nullable=False)  # Concatenated profile text

    # Vector embedding
    if HAS_VECTOR:
        embedding = db.Column(VECTOR(Config.EMBEDDING_DIMENSIONS), nullable=False)
    else:
        embedding = db.Column(db.Text, nullable=False)  # Store as JSON string

    # Metadata
    skills_count = db.Column(db.Integer, default=0)
    experience_years = db.Column(db.Float, default=0)
    education_level = db.Column(db.String(50), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ProfileEmbedding(user_id={self.user_id})>"