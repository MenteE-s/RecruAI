"""
Recommendation Generator Tool
Uses AI to generate explanations and enhanced recommendations
"""

import logging
from typing import List, Dict, Any, Optional

from backend.ai_providers import get_ai_provider_manager
from ..config import RecommendationConfig


logger = logging.getLogger(__name__)


class RecommendationGenerator:
    """
    Tool for generating AI-powered explanations and enhanced recommendations.
    """

    def __init__(self):
        self.config = RecommendationConfig()
        self.provider_manager = get_ai_provider_manager()
        self.llm_provider = self.provider_manager.llm

    async def generate_profile_explanation(
        self,
        profile_data: Dict[str, Any],
        job_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """
        Generate explanation why a profile matches a job
        """
        prompt = f"""
        Based on the following profile and job posting, explain why this candidate would be a good match.
        Provide a concise explanation focusing on key matching skills, experience, and qualifications.

        Profile:
        {profile_data.get('profile_content', '')}

        Job Posting:
        {job_data.get('job_content', '')}

        Similarity Score: {similarity_score:.2f}

        Explanation (2-3 sentences):
        """

        try:
            response = await self.llm_provider.generate_text(
                prompt=prompt,
                max_tokens=200,
                temperature=0.3
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate profile explanation: {e}")
            return f"This profile matches the job with a similarity score of {similarity_score:.2f}."

    async def generate_job_explanation(
        self,
        job_data: Dict[str, Any],
        profile_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """
        Generate explanation why a job matches a profile
        """
        prompt = f"""
        Based on the following job posting and candidate profile, explain why this job would be a good fit for the candidate.
        Provide a concise explanation focusing on how the job aligns with their skills and experience.

        Job Posting:
        {job_data.get('job_content', '')}

        Candidate Profile:
        {profile_data.get('profile_content', '')}

        Similarity Score: {similarity_score:.2f}

        Explanation (2-3 sentences):
        """

        try:
            response = await self.llm_provider.generate_text(
                prompt=prompt,
                max_tokens=200,
                temperature=0.3
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate job explanation: {e}")
            return f"This job matches your profile with a similarity score of {similarity_score:.2f}."

    async def generate_agent_explanation(
        self,
        agent_data: Dict[str, Any],
        job_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """
        Generate explanation why an agent is recommended for a job interview
        """
        prompt = f"""
        Based on the following AI agent profile and job posting, explain why this agent would be suitable for conducting interviews for this position.
        Focus on how the agent's expertise and interview style match the job requirements.

        AI Agent:
        Name: {agent_data.get('agent_name', '')}
        Industry: {agent_data.get('industry', '')}
        Content: {agent_data.get('agent_content', '')}

        Job Posting:
        {job_data.get('job_content', '')}

        Similarity Score: {similarity_score:.2f}

        Explanation (2-3 sentences):
        """

        try:
            response = await self.llm_provider.generate_text(
                prompt=prompt,
                max_tokens=200,
                temperature=0.3
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate agent explanation: {e}")
            return f"This AI agent is recommended for interviewing candidates for this position with a similarity score of {similarity_score:.2f}."

    def generate_profile_explanation_sync(
        self,
        profile_data: Dict[str, Any],
        job_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """Synchronous version of generate_profile_explanation"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self.generate_profile_explanation(profile_data, job_data, similarity_score)
            )
        finally:
            loop.close()

    def generate_job_explanation_sync(
        self,
        job_data: Dict[str, Any],
        profile_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """Synchronous version of generate_job_explanation"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self.generate_job_explanation(job_data, profile_data, similarity_score)
            )
        finally:
            loop.close()

    def generate_agent_explanation_sync(
        self,
        agent_data: Dict[str, Any],
        job_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        """Synchronous version of generate_agent_explanation"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self.generate_agent_explanation(agent_data, job_data, similarity_score)
            )
        finally:
            loop.close()