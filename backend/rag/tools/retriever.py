"""
RAG Retriever Tool
Performs similarity search on vector embeddings using pgvector
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import text, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

from ..config import RAGConfig
from ..models import EmbeddingStore


logger = logging.getLogger(__name__)


class RetrieverTool:
    """
    Tool for retrieving relevant document chunks based on semantic similarity.
    Uses pgvector for efficient vector similarity search.
    """

    def __init__(self, db_engine: Optional[Engine] = None):
        self.config = RAGConfig()
        self.db_engine = db_engine
        self._session_factory = sessionmaker(bind=db_engine) if db_engine else None

    def retrieve_similar(
        self,
        query_embedding: List[float],
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve top-k most similar chunks to the query embedding.

        Args:
            query_embedding: Vector embedding of the query
            top_k: Number of results to return (default: config.TOP_K_RESULTS)
            similarity_threshold: Minimum similarity score (default: config.SIMILARITY_THRESHOLD)
            filters: Additional filters (source_type, user_id, organization_id, etc.)

        Returns:
            List of similar chunks with metadata and similarity scores
        """
        if not self.db_engine:
            raise ValueError("Database engine not provided")

        top_k = top_k or self.config.TOP_K_RESULTS
        similarity_threshold = similarity_threshold or self.config.SIMILARITY_THRESHOLD

        try:
            with self._session_factory() as session:
                # Build the query with pgvector similarity search
                query = session.query(
                    EmbeddingStore,
                    func.cosine_similarity(EmbeddingStore.embedding, query_embedding).label('similarity')
                )

                # Apply filters
                if filters:
                    query = self._apply_filters(query, filters)

                # Order by similarity (descending) and limit results
                query = query.order_by(text('similarity DESC')).limit(top_k)

                results = []
                for embedding_store, similarity in query.all():
                    if similarity >= similarity_threshold:
                        # Get the associated document chunk
                        chunk_data = self._get_chunk_data(session, embedding_store.chunk_id)

                        if chunk_data:
                            result = {
                                'chunk_id': embedding_store.chunk_id,
                                'document_id': embedding_store.document_id,
                                'content': chunk_data['content'],
                                'similarity_score': float(similarity),
                                'source_type': embedding_store.source_type,
                                'user_id': embedding_store.user_id,
                                'organization_id': embedding_store.organization_id,
                                'metadata': chunk_data.get('metadata', {}),
                                'word_count': chunk_data.get('word_count', 0),
                                'char_count': chunk_data.get('char_count', 0),
                                'processed_at': chunk_data.get('processed_at'),
                            }
                            results.append(result)

                logger.info(f"Retrieved {len(results)} similar chunks with similarity >= {similarity_threshold}")
                return results

        except Exception as e:
            logger.error(f"Error retrieving similar chunks: {e}")
            raise

    def retrieve_by_text(
        self,
        query_text: str,
        embedder_tool,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar chunks by text query (combines embedding + retrieval).

        Args:
            query_text: The text query to search for
            embedder_tool: Instance of EmbedderTool to generate query embedding
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score
            filters: Additional filters

        Returns:
            List of similar chunks with metadata
        """
        try:
            # Generate embedding for the query
            query_chunks = embedder_tool.generate_embeddings([{
                'content': query_text,
                'chunk_index': 0,
                'word_count': len(query_text.split()),
                'char_count': len(query_text),
                'metadata': {}
            }], use_cache=True)

            if not query_chunks or 'embedding' not in query_chunks[0]:
                raise ValueError("Failed to generate embedding for query")

            query_embedding = query_chunks[0]['embedding']

            # Perform similarity search
            return self.retrieve_similar(
                query_embedding=query_embedding,
                top_k=top_k,
                similarity_threshold=similarity_threshold,
                filters=filters
            )

        except Exception as e:
            logger.error(f"Error retrieving by text query: {e}")
            raise

    def retrieve_hybrid(
        self,
        query_text: str,
        embedder_tool,
        keyword_filters: Optional[Dict[str, Any]] = None,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining semantic similarity with keyword matching.

        Args:
            query_text: The text query
            embedder_tool: EmbedderTool instance
            keyword_filters: Keyword-based filters
            semantic_weight: Weight for semantic similarity (0-1)
            keyword_weight: Weight for keyword matching (0-1)
            top_k: Number of results to return

        Returns:
            List of results with combined scores
        """
        if not self.db_engine:
            raise ValueError("Database engine not provided")

        try:
            # Get semantic results
            semantic_results = self.retrieve_by_text(
                query_text=query_text,
                embedder_tool=embedder_tool,
                top_k=top_k * 2 if top_k else None,  # Get more for reranking
                filters=keyword_filters
            )

            # For now, just return semantic results
            # TODO: Implement keyword scoring and combination
            return semantic_results[:top_k] if top_k else semantic_results

        except Exception as e:
            logger.error(f"Error in hybrid retrieval: {e}")
            raise

    def search_by_metadata(
        self,
        filters: Dict[str, Any],
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search chunks by metadata filters without semantic similarity.

        Args:
            filters: Metadata filters (source_type, user_id, organization_id, etc.)
            limit: Maximum number of results

        Returns:
            List of matching chunks
        """
        if not self.db_engine:
            raise ValueError("Database engine not provided")

        try:
            with self._session_factory() as session:
                query = session.query(EmbeddingStore)

                # Apply filters
                query = self._apply_filters(query, filters)
                query = query.limit(limit)

                results = []
                for embedding_store in query.all():
                    chunk_data = self._get_chunk_data(session, embedding_store.chunk_id)
                    if chunk_data:
                        result = {
                            'chunk_id': embedding_store.chunk_id,
                            'document_id': embedding_store.document_id,
                            'content': chunk_data['content'],
                            'source_type': embedding_store.source_type,
                            'user_id': embedding_store.user_id,
                            'organization_id': embedding_store.organization_id,
                            'metadata': chunk_data.get('metadata', {}),
                            'word_count': chunk_data.get('word_count', 0),
                            'char_count': chunk_data.get('char_count', 0),
                            'processed_at': chunk_data.get('processed_at'),
                        }
                        results.append(result)

                logger.info(f"Found {len(results)} chunks matching metadata filters")
                return results

        except Exception as e:
            logger.error(f"Error searching by metadata: {e}")
            raise

    def get_statistics(self) -> Dict[str, Any]:
        """Get retrieval statistics and database info."""
        if not self.db_engine:
            return {'error': 'Database engine not provided'}

        try:
            with self._session_factory() as session:
                # Count total embeddings
                total_embeddings = session.query(EmbeddingStore).count()

                # Count by source type
                source_counts = session.query(
                    EmbeddingStore.source_type,
                    func.count(EmbeddingStore.id)
                ).group_by(EmbeddingStore.source_type).all()

                # Get date range
                date_range = session.query(
                    func.min(EmbeddingStore.created_at),
                    func.max(EmbeddingStore.created_at)
                ).first()

                return {
                    'total_embeddings': total_embeddings,
                    'source_type_breakdown': dict(source_counts),
                    'date_range': {
                        'earliest': date_range[0].isoformat() if date_range[0] else None,
                        'latest': date_range[1].isoformat() if date_range[1] else None
                    },
                    'database_connected': True
                }

        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {
                'error': str(e),
                'database_connected': False
            }

    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Apply metadata filters to the query."""
        if 'source_type' in filters:
            query = query.filter(EmbeddingStore.source_type == filters['source_type'])

        if 'user_id' in filters:
            query = query.filter(EmbeddingStore.user_id == filters['user_id'])

        if 'organization_id' in filters:
            query = query.filter(EmbeddingStore.organization_id == filters['organization_id'])

        if 'document_id' in filters:
            query = query.filter(EmbeddingStore.document_id == filters['document_id'])

        # Add more filters as needed
        return query

    def _get_chunk_data(self, session, chunk_id: int) -> Optional[Dict[str, Any]]:
        """Get document chunk data by ID."""
        # This is a placeholder - in production, you'd have a DocumentChunk model
        # For now, return mock data
        try:
            # Mock implementation - replace with actual DocumentChunk query
            return {
                'content': f"Mock content for chunk {chunk_id}",
                'metadata': {'chunk_id': chunk_id},
                'word_count': 50,
                'char_count': 300,
                'processed_at': '2024-01-01T00:00:00Z'
            }
        except Exception:
            return None

    def validate_query_embedding(self, embedding: List[float]) -> Dict[str, Any]:
        """Validate query embedding dimensions and quality."""
        expected_dims = self.config.OPENAI_EMBEDDING_DIMENSIONS

        issues = []

        if len(embedding) != expected_dims:
            issues.append(f"Embedding has {len(embedding)} dimensions, expected {expected_dims}")

        # Check for all zeros
        if all(x == 0 for x in embedding):
            issues.append("Embedding is all zeros")

        # Check for reasonable value range (-1 to 1 for normalized embeddings)
        min_val, max_val = min(embedding), max(embedding)
        if min_val < -1.1 or max_val > 1.1:
            issues.append(f"Embedding values out of range: [{min_val:.3f}, {max_val:.3f}]")

        return {
            'valid': len(issues) == 0,
            'dimensions': len(embedding),
            'value_range': [min_val, max_val],
            'issues': issues
        }