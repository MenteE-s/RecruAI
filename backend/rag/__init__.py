"""
RecruAI Universal RAG System
Retrieval-Augmented Generation for intelligent content processing
"""

__version__ = "1.0.0"
__author__ = "RecruAI Team"

# Import main components for easy access
from .tools.supervisor import RAGSupervisor
from .tools.ingestor import IngestorTool
from .tools.embedder import EmbedderTool
from .tools.retriever import RetrieverTool
from .tools.generator import GeneratorTool

__all__ = [
    "RAGSupervisor",
    "IngestorTool",
    "EmbedderTool",
    "RetrieverTool",
    "GeneratorTool",
]