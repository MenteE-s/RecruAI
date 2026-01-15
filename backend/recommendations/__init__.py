"""
RecruAI Recommendation System
Intelligent recommendation engine for matching candidates, jobs, and AI agents
"""

__version__ = "1.0.0"
__author__ = "RecruAI Team"

# Import main components for easy access
from .tools.supervisor import RecommendationSupervisor
from .tools.embedder import RecommendationEmbedder
from .tools.retriever import RecommendationRetriever
from .tools.generator import RecommendationGenerator

__all__ = [
    "RecommendationSupervisor",
    "RecommendationEmbedder",
    "RecommendationRetriever",
    "RecommendationGenerator",
]