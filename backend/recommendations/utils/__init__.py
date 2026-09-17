"""
Recommendation System Utilities
"""

import logging
from typing import Dict, Any, Optional


logger = logging.getLogger(__name__)


def validate_embedding_data(data: Dict[str, Any], data_type: str) -> bool:
    """
    Validate embedding data based on type
    """
    if data_type == 'profile':
        required_fields = ['user_id']
    elif data_type == 'job':
        required_fields = ['job_id', 'title']
    elif data_type == 'agent':
        required_fields = ['agent_id', 'name']
    else:
        return False

    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field} for {data_type}")
            return False

    return True


def format_recommendation_result(result: Dict[str, Any], result_type: str) -> Dict[str, Any]:
    """
    Format recommendation result for API response
    """
    if result_type == 'profile':
        return {
            'user_id': result['user_id'],
            'similarity_score': result['similarity'],
            'skills_count': result.get('skills_count', 0),
            'experience_years': result.get('experience_years', 0),
            'education_level': result.get('education_level'),
            'explanation': result.get('explanation', ''),
        }
    elif result_type == 'job':
        return {
            'job_id': result['job_id'],
            'job_title': result['job_title'],
            'industry': result['industry'],
            'similarity_score': result['similarity'],
            'experience_required': result.get('experience_required', 0),
            'skills_required': result.get('skills_required', ''),
            'explanation': result.get('explanation', ''),
        }
    elif result_type == 'agent':
        return {
            'agent_id': result['agent_id'],
            'agent_name': result['agent_name'],
            'industry': result['industry'],
            'similarity_score': result['similarity'],
            'interview_type': result.get('interview_type'),
            'explanation': result.get('explanation', ''),
        }

    return result