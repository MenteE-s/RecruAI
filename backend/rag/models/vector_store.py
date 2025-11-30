"""
Vector Store Models for RAG System
"""

from datetime import datetime
from typing import Optional, Dict, Any
import json

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Index
from sqlalchemy.ext.declarative import declarative_base

# Try to import VECTOR for pgvector support, fallback to Text if not available
try:
    from sqlalchemy.dialects.postgresql import VECTOR
    HAS_VECTOR = True
except ImportError:
    HAS_VECTOR = False
    VECTOR = None

from ..config import RAGConfig

Base = declarative_base()


class DocumentChunk(Base):
    """
    Model for storing document chunks with metadata
    """
    __tablename__ = "rag_document_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(255), nullable=False, index=True)  # Unique document identifier
    chunk_index = Column(Integer, nullable=False)  # Position in document
    content = Column(Text, nullable=False)  # The actual text chunk
    content_hash = Column(String(64), nullable=False, index=True)  # For deduplication

    # Metadata
    source_type = Column(String(50), nullable=False)  # 'resume', 'job_description', 'interview', etc.
    source_id = Column(String(255), nullable=True)  # ID from source system
    user_id = Column(String(255), nullable=True)  # Associated user ID
    organization_id = Column(String(255), nullable=True)  # Associated organization ID

    # Content metadata
    word_count = Column(Integer, nullable=False)
    char_count = Column(Integer, nullable=False)
    language = Column(String(10), default='en')

    # Processing metadata
    processed_at = Column(DateTime, default=datetime.utcnow)
    embedding_model = Column(String(100), nullable=True)
    chunking_strategy = Column(String(50), nullable=True)

    # Additional metadata as JSON
    chunk_metadata = Column(Text, nullable=True)  # JSON string for flexible metadata

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, document_id={self.document_id}, chunk_index={self.chunk_index})>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "content": self.content,
            "content_hash": self.content_hash,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "word_count": self.word_count,
            "char_count": self.char_count,
            "language": self.language,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "embedding_model": self.embedding_model,
            "chunking_strategy": self.chunking_strategy,
            "metadata": json.loads(self.chunk_metadata) if self.chunk_metadata else None,
        }

    @classmethod
    def create_chunk(
        cls,
        document_id: str,
        chunk_index: int,
        content: str,
        source_type: str,
        source_id: Optional[str] = None,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> 'DocumentChunk':
        """Factory method to create a document chunk"""
        import hashlib

        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

        return cls(
            document_id=document_id,
            chunk_index=chunk_index,
            content=content,
            content_hash=content_hash,
            source_type=source_type,
            source_id=source_id,
            user_id=user_id,
            organization_id=organization_id,
            word_count=len(content.split()),
            char_count=len(content),
            language='en',  # TODO: Implement language detection
            embedding_model=RAGConfig.OPENAI_EMBEDDING_MODEL,
            chunking_strategy='semantic',  # TODO: Make configurable
            chunk_metadata=json.dumps(metadata) if metadata else None,
        )


class EmbeddingStore(Base):
    """
    Model for storing vector embeddings linked to document chunks
    """
    __tablename__ = "rag_embedding_store"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chunk_id = Column(Integer, nullable=False, index=True)  # Foreign key to DocumentChunk
    document_id = Column(String(255), nullable=False, index=True)  # Denormalized for faster queries

    # Vector embedding (using pgvector if available, otherwise Text for JSON storage)
    if HAS_VECTOR:
        embedding = Column(VECTOR(RAGConfig.OPENAI_EMBEDDING_DIMENSIONS), nullable=False)
    else:
        embedding = Column(Text, nullable=False)  # Store as JSON string for now

    # Metadata for filtering and search
    source_type = Column(String(50), nullable=False, index=True)
    user_id = Column(String(255), nullable=True, index=True)
    organization_id = Column(String(255), nullable=True, index=True)

    # Quality metrics
    embedding_confidence = Column(Float, default=1.0)  # Confidence score for the embedding

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<EmbeddingStore(id={self.id}, chunk_id={self.chunk_id}, document_id={self.document_id})>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        # Handle embedding field based on storage type
        if HAS_VECTOR:
            embedding_value = self.embedding
        else:
            embedding_value = json.loads(self.embedding) if self.embedding else None

        return {
            "id": self.id,
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "source_type": self.source_type,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "embedding": embedding_value,
            "embedding_confidence": self.embedding_confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def create_embedding(
        cls,
        chunk_id: int,
        document_id: str,
        embedding_vector: list,
        source_type: str,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        confidence: float = 1.0
    ) -> 'EmbeddingStore':
        """Factory method to create an embedding record"""
        # Handle embedding storage based on available vector support
        if HAS_VECTOR:
            embedding_value = embedding_vector
        else:
            embedding_value = json.dumps(embedding_vector)  # Store as JSON string

        return cls(
            chunk_id=chunk_id,
            document_id=document_id,
            embedding=embedding_value,
            source_type=source_type,
            user_id=user_id,
            organization_id=organization_id,
            embedding_confidence=confidence,
        )


# Create indexes for better query performance
Index('idx_document_chunks_document_id', DocumentChunk.document_id)
Index('idx_document_chunks_source_type', DocumentChunk.source_type)
Index('idx_document_chunks_user_id', DocumentChunk.user_id)
Index('idx_document_chunks_content_hash', DocumentChunk.content_hash)

Index('idx_embedding_store_chunk_id', EmbeddingStore.chunk_id)
Index('idx_embedding_store_document_id', EmbeddingStore.document_id)
Index('idx_embedding_store_source_type', EmbeddingStore.source_type)
Index('idx_embedding_store_user_id', EmbeddingStore.user_id)

# Vector similarity index (requires pgvector extension)
# This will be created via migration when pgvector is available