"""
Recommendation Embedder Tool
Converts profiles, jobs, and agents to vector embeddings
"""

import asyncio
import hashlib
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import threading

from backend.ai_providers import get_ai_provider_manager
from ..config import RecommendationConfig


logger = logging.getLogger(__name__)


class RecommendationEmbedder:
    """
    Tool for generating vector embeddings for recommendation system.
    Handles profiles, jobs, and agents.
    """

    def __init__(self):
        self.config = RecommendationConfig()
        self.provider_manager = get_ai_provider_manager()
        self.embedding_provider = self.provider_manager.embedding

        # Caching and rate limiting
        self._embedding_cache = {}
        self._cache_lock = threading.Lock()
        self._rate_limiter = self._RateLimiter(
            requests_per_minute=self.config.MAX_REQUESTS_PER_MINUTE,
            requests_per_hour=self.config.MAX_REQUESTS_PER_HOUR
        )

        # Thread pool for async processing
        self._executor = ThreadPoolExecutor(max_workers=4)

    class _RateLimiter:
        """Simple rate limiter for API calls"""

        def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
            self.requests_per_minute = requests_per_minute
            self.requests_per_hour = requests_per_hour
            self.minute_calls = []
            self.hour_calls = []

        def _cleanup_old_calls(self):
            """Remove calls older than 1 hour"""
            now = time.time()
            self.minute_calls = [t for t in self.minute_calls if now - t < 60]
            self.hour_calls = [t for t in self.hour_calls if now - t < 3600]

        def can_make_call(self) -> bool:
            """Check if we can make another API call"""
            self._cleanup_old_calls()
            return (len(self.minute_calls) < self.requests_per_minute and
                    len(self.hour_calls) < self.requests_per_hour)

        def record_call(self):
            """Record that a call was made"""
            now = time.time()
            self.minute_calls.append(now)
            self.hour_calls.append(now)

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]

    def _get_cached_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding from cache if available"""
        cache_key = self._get_cache_key(text)
        with self._cache_lock:
            return self._embedding_cache.get(cache_key)

    def _cache_embedding(self, text: str, embedding: List[float]):
        """Cache an embedding"""
        cache_key = self._get_cache_key(text)
        with self._cache_lock:
            self._embedding_cache[cache_key] = embedding

    async def embed_text_async(self, text: str) -> List[float]:
        """Generate embedding for text asynchronously"""
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        # Check cache first
        cached = self._get_cached_embedding(text)
        if cached:
            return cached

        # Rate limiting
        if not self._rate_limiter.can_make_call():
            raise Exception("Rate limit exceeded")

        try:
            # Generate embedding
            embedding = await self.embedding_provider.embed_text(text)
            self._rate_limiter.record_call()

            # Cache the result
            self._cache_embedding(text, embedding)
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text synchronously"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.embed_text_async(text))
        finally:
            loop.close()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if not texts:
            return []

        # Process in batches to respect rate limits
        batch_size = min(10, len(texts))  # Smaller batches for rate limiting
        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_results = []
            for text in batch:
                try:
                    embedding = self.embed_text(text)
                    batch_results.append(embedding)
                except Exception as e:
                    logger.error(f"Failed to embed text: {e}")
                    batch_results.append([])  # Empty embedding on failure
            results.extend(batch_results)

        return results

    def embed_profile(self, profile_data: Dict[str, Any]) -> str:
        """Create embedding-ready text from profile data"""
        parts = []

        # Basic info
        if profile_data.get('first_name') or profile_data.get('last_name'):
            parts.append(f"Name: {profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip())

        # Skills
        skills = profile_data.get('skills', [])
        if skills:
            parts.append(f"Skills: {', '.join(skills)}")

        # Experience
        experiences = profile_data.get('experiences', [])
        if experiences:
            exp_text = []
            for exp in experiences:
                title = exp.get('job_title', '')
                company = exp.get('company_name', '')
                if title or company:
                    exp_text.append(f"{title} at {company}")
            if exp_text:
                parts.append(f"Experience: {'; '.join(exp_text)}")

        # Education
        educations = profile_data.get('educations', [])
        if educations:
            edu_text = []
            for edu in educations:
                degree = edu.get('degree', '')
                field = edu.get('field_of_study', '')
                school = edu.get('school_name', '')
                if degree or field or school:
                    edu_text.append(f"{degree} in {field} from {school}")
            if edu_text:
                parts.append(f"Education: {'; '.join(edu_text)}")

        # Projects
        projects = profile_data.get('projects', [])
        if projects:
            proj_text = []
            for proj in projects:
                name = proj.get('name', '')
                description = proj.get('description', '')
                if name or description:
                    proj_text.append(f"{name}: {description}")
            if proj_text:
                parts.append(f"Projects: {'; '.join(proj_text)}")

        return '\n'.join(parts)

    def embed_job(self, job_data: Dict[str, Any]) -> str:
        """Create embedding-ready text from job data"""
        parts = []

        # Job title and company
        title = job_data.get('title', '')
        company = job_data.get('company_name', '')
        if title:
            parts.append(f"Job Title: {title}")
        if company:
            parts.append(f"Company: {company}")

        # Description
        description = job_data.get('description', '')
        if description:
            parts.append(f"Description: {description}")

        # Requirements
        requirements = job_data.get('requirements', '')
        if requirements:
            parts.append(f"Requirements: {requirements}")

        # Skills
        skills = job_data.get('skills', [])
        if skills:
            parts.append(f"Required Skills: {', '.join(skills)}")

        # Location and type
        location = job_data.get('location', '')
        job_type = job_data.get('job_type', '')
        if location:
            parts.append(f"Location: {location}")
        if job_type:
            parts.append(f"Job Type: {job_type}")

        return '\n'.join(parts)

    def embed_agent(self, agent_data: Dict[str, Any]) -> str:
        """Create embedding-ready text from agent data"""
        parts = []

        # Agent name and industry
        name = agent_data.get('name', '')
        industry = agent_data.get('industry', '')
        if name:
            parts.append(f"Agent Name: {name}")
        if industry:
            parts.append(f"Industry: {industry}")

        # System prompt
        system_prompt = agent_data.get('system_prompt', '')
        if system_prompt:
            parts.append(f"System Prompt: {system_prompt}")

        # Custom instructions
        custom_instructions = agent_data.get('custom_instructions', '')
        if custom_instructions:
            parts.append(f"Custom Instructions: {custom_instructions}")

        return '\n'.join(parts)