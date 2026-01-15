"""
Recommendation Agent Embedding Model
"""

from datetime import datetime
from typing import Optional

from backend.extensions import db

# Try to import VECTOR for pgvector support, fallback to Text if not available
try:
    from sqlalchemy.dialects.postgresql import VECTOR
    HAS_VECTOR = True
except ImportError:
    HAS_VECTOR = False
    VECTOR = None

from backend.config import Config


class AgentEmbedding(db.Model):
    """
    Model for storing AI agent embeddings
    """
    __tablename__ = "recommendation_agent_embeddings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    agent_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    organization_id = db.Column(db.String(255), nullable=True, index=True)

    # Agent content used for embedding
    agent_content = db.Column(db.Text, nullable=False)  # System prompt and instructions

    # Vector embedding
    if HAS_VECTOR:
        embedding = db.Column(VECTOR(Config.EMBEDDING_DIMENSIONS), nullable=False)
    else:
        embedding = db.Column(db.Text, nullable=False)  # Store as JSON string

    # Metadata
    agent_name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=True)
    interview_type = db.Column(db.String(100), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AgentEmbedding(agent_id={self.agent_id}, name={self.agent_name})>"