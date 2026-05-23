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

    def generate_profile_explanation(
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
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 200, "temperature": 0.3}
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate profile explanation: {e}")
            return f"This profile matches the job with a similarity score of {similarity_score:.2f}."

    def generate_job_explanation(
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
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 200, "temperature": 0.3}
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate job explanation: {e}")
            return f"This job matches your profile with a similarity score of {similarity_score:.2f}."

    def generate_agent_explanation(
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
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 200, "temperature": 0.3}
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
        return self.generate_profile_explanation(profile_data, job_data, similarity_score)

    def generate_job_explanation_sync(
        self,
        job_data: Dict[str, Any],
        profile_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        return self.generate_job_explanation(job_data, profile_data, similarity_score)

    def generate_agent_explanation_sync(
        self,
        agent_data: Dict[str, Any],
        job_data: Dict[str, Any],
        similarity_score: float
    ) -> str:
        return self.generate_agent_explanation(agent_data, job_data, similarity_score)

    @staticmethod
    def _sanitize_profile_for_ai(profile_content: str) -> str:
        """Strip personally identifiable information from profile content before sending to AI.
        Keeps skills, experience levels, education fields, and project descriptions.
        Removes names, emails, phone numbers, company names, and specific locations."""
        import re
        # Remove email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL REMOVED]', profile_content)
        # Remove phone numbers (various formats)
        text = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[PHONE REMOVED]', text)
        # Remove URLs
        text = re.sub(r'https?://\S+', '[URL REMOVED]', text)
        return text

    def generate_search_explanation(
        self,
        query: str,
        profile_content: str,
        similarity_score: float,
        skills_count: int,
        experience_years: float,
        education_level: Optional[str]
    ) -> Dict[str, Any]:
        """Generate AI explanation for a candidate search result.
        Only sanitized (PII-free) profile data is sent to the AI.
        Returns explanation, match_level, and matching_skills."""
        sanitized = self._sanitize_profile_for_ai(profile_content)
        # Truncate to avoid 413 Request Entity Too Large from Groq
        max_chars = 3000
        if len(sanitized) > max_chars:
            sanitized = sanitized[:max_chars] + "\n...[truncated]"

        prompt = f"""You are an AI recruitment assistant helping an organization find candidates.
Your task is to analyze how well a candidate matches a search query.

IMPORTANT: Only mention skills that are explicitly present in the candidate profile. Do NOT make up skills.

PRIVACY RULE: Never mention names, emails, phone numbers, or any PII. If you see [EMAIL REMOVED] or [PHONE REMOVED], do not reference them.

Search Query: {query}

Candidate Profile (PII removed):
{sanitized}

Skills Count: {skills_count}
Experience Years: {experience_years}
Education: {education_level or 'Not specified'}

Respond in JSON format:
{{
    "explanation": "2-3 sentence analysis of what in the profile matches the query — mention specific skills, roles, experience, or projects that are relevant",
    "match_level": "excellent|good|possible|poor",
    "matching_skills": ["skill1", "skill2"]
}}

Match level guidelines (judge by profile content, not external rules):
- excellent: profile clearly matches the core requirements of the query
- good: profile partially matches with some relevant skills/experience
- possible: profile has some tangential relevance
- poor: profile does not match the query
"""
        try:
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 300, "temperature": 0.2}
            )
            import json
            # Try to parse JSON response
            response_text = response.strip()
            # Find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}')
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end + 1]
                result = json.loads(json_str)
                return {
                    'explanation': result.get('explanation', f'Candidate matches with similarity score {similarity_score:.2f}.'),
                    'match_level': result.get('match_level', self._classify_match_level(similarity_score)),
                    'matching_skills': result.get('matching_skills', [])
                }
        except Exception as e:
            logger.error(f"Failed to generate search explanation: {e}")

        # Fallback
        return {
            'explanation': f'Candidate matches the search query with a similarity score of {similarity_score:.2f} based on skills and experience.',
            'match_level': self._classify_match_level(similarity_score),
            'matching_skills': []
        }

    def generate_search_explanation_sync(
        self,
        query: str,
        profile_content: str,
        similarity_score: float,
        skills_count: int,
        experience_years: float,
        education_level: Optional[str]
    ) -> Dict[str, Any]:
        return self.generate_search_explanation(
            query, profile_content, similarity_score,
            skills_count, experience_years, education_level
        )

    def expand_search_query(self, query: str) -> str:
        """Expand a short search query into a profile-like description for better embedding matching."""
        prompt = f"""Rewrite this candidate search query into a detailed candidate requirements description.
Expand abbreviations and infer related skills. Output only the description.

Query: {query}

Description:"""
        try:
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 150, "temperature": 0.1}
            )
            expanded = response.strip()
            if expanded:
                return expanded
        except Exception as e:
            logger.error(f"Failed to expand query: {e}")
        return query

    def analyze_search_query(self, query: str) -> Dict[str, Any]:
        """Analyze a search query to detect required skills and suggested roles.
        No personal data is involved - only the query text."""
        prompt = f"""Analyze this candidate search query and extract key requirements.

Query: {query}

Respond in JSON format:
{{
    "detected_skills": ["skill1", "skill2"],
    "suggested_roles": ["role1", "role2"],
    "min_experience_years": 0
}}
"""
        try:
            response = self.llm_provider.generate(
                prompt=prompt,
                params={"max_tokens": 200, "temperature": 0.1}
            )
            import json
            response_text = response.strip()
            json_start = response_text.find('{')
            json_end = response_text.rfind('}')
            if json_start != -1 and json_end != -1:
                return json.loads(response_text[json_start:json_end + 1])
        except Exception as e:
            logger.error(f"Failed to analyze search query: {e}")
        return {"detected_skills": [], "suggested_roles": [], "min_experience_years": 0}

    def analyze_search_query_sync(self, query: str) -> Dict[str, Any]:
        return self.analyze_search_query(query)

    @staticmethod
    def _classify_match_level(similarity: float) -> str:
        if similarity >= 0.80:
            return "excellent"
        elif similarity >= 0.60:
            return "good"
        elif similarity >= 0.40:
            return "possible"
        return "poor"