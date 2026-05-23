"""
Recommendation Retriever Tool
Performs similarity search for recommendations
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import cast, or_, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

from ..config import RecommendationConfig
from ...models import ProfileEmbedding, JobEmbedding, AgentEmbedding


logger = logging.getLogger(__name__)


class RecommendationRetriever:
    """
    Tool for retrieving recommendations based on semantic similarity.
    """

    def __init__(self, db_engine: Optional[Engine] = None):
        self.config = RecommendationConfig()
        self.db_engine = db_engine
        self._session_factory = sessionmaker(bind=db_engine) if db_engine else None

    def _get_session(self):
        """Get database session"""
        if not self._session_factory:
            raise ValueError("Database engine not provided")
        return self._session_factory()

    def find_similar_profiles(
        self,
        query_embedding: List[float],
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Find profiles similar to the query embedding (e.g., for job matching)
        """
        session = self._get_session()
        try:
            top_k = top_k if top_k is not None else self.config.TOP_K_RECOMMENDATIONS
            threshold = similarity_threshold if similarity_threshold is not None else self.config.SIMILARITY_THRESHOLD

            # Build query
            query = session.query(
                ProfileEmbedding,
                self._cosine_similarity(ProfileEmbedding.embedding, query_embedding).label('similarity')
            )

            if organization_id:
                query = query.filter(
                    or_(
                        ProfileEmbedding.organization_id == organization_id,
                        ProfileEmbedding.organization_id.is_(None)
                    )
                )

            query = query.filter(
                self._cosine_similarity(ProfileEmbedding.embedding, query_embedding) >= threshold
            ).order_by(
                self._cosine_similarity(ProfileEmbedding.embedding, query_embedding).desc()
            ).limit(top_k)

            results = []
            for profile, similarity in query.all():
                results.append({
                    'user_id': profile.user_id,
                    'organization_id': profile.organization_id,
                    'similarity': float(similarity),
                    'profile_content': profile.profile_content,
                    'skills_count': profile.skills_count,
                    'experience_years': profile.experience_years,
                    'education_level': profile.education_level,
                })

            return results

        finally:
            session.close()

    def find_similar_jobs(
        self,
        query_embedding: List[float],
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Find jobs similar to the query embedding (e.g., for profile matching)
        """
        session = self._get_session()
        try:
            top_k = top_k if top_k is not None else self.config.TOP_K_RECOMMENDATIONS
            threshold = similarity_threshold if similarity_threshold is not None else self.config.SIMILARITY_THRESHOLD

            query = session.query(
                JobEmbedding,
                self._cosine_similarity(JobEmbedding.embedding, query_embedding).label('similarity')
            )

            if organization_id:
                query = query.filter(JobEmbedding.organization_id == organization_id)

            query = query.filter(
                self._cosine_similarity(JobEmbedding.embedding, query_embedding) >= threshold
            ).order_by(
                self._cosine_similarity(JobEmbedding.embedding, query_embedding).desc()
            ).limit(top_k)

            results = []
            for job, similarity in query.all():
                results.append({
                    'job_id': job.job_id,
                    'organization_id': job.organization_id,
                    'similarity': float(similarity),
                    'job_title': job.job_title,
                    'industry': job.industry,
                    'experience_required': job.experience_required,
                    'skills_required': job.skills_required,
                })

            return results

        finally:
            session.close()

    def find_similar_agents(
        self,
        query_embedding: List[float],
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Find agents similar to the query embedding (e.g., for interview matching)
        """
        session = self._get_session()
        try:
            top_k = top_k if top_k is not None else self.config.TOP_K_RECOMMENDATIONS
            threshold = similarity_threshold if similarity_threshold is not None else self.config.SIMILARITY_THRESHOLD

            query = session.query(
                AgentEmbedding,
                self._cosine_similarity(AgentEmbedding.embedding, query_embedding).label('similarity')
            )

            if organization_id:
                query = query.filter(AgentEmbedding.organization_id == organization_id)

            query = query.filter(
                self._cosine_similarity(AgentEmbedding.embedding, query_embedding) >= threshold
            ).order_by(
                self._cosine_similarity(AgentEmbedding.embedding, query_embedding).desc()
            ).limit(top_k)

            results = []
            for agent, similarity in query.all():
                results.append({
                    'agent_id': agent.agent_id,
                    'organization_id': agent.organization_id,
                    'similarity': float(similarity),
                    'agent_name': agent.agent_name,
                    'industry': agent.industry,
                    'interview_type': agent.interview_type,
                })

            return results

        finally:
            session.close()

    def _cosine_similarity(self, vec1, vec2):
        """Calculate cosine similarity between two vectors"""
        # Cast list parameters to vector type so pgvector binds them correctly
        if isinstance(vec2, list):
            from pgvector.sqlalchemy import Vector
            vec2 = cast(vec2, Vector(384))
        # Use cosine_distance function from pgvector SQL extension
        # Cosine similarity = 1 - cosine_distance (higher values = more similar)
        return 1 - func.cosine_distance(vec1, vec2)