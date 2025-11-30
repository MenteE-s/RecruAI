"""
RAG Ingestor Tool
Converts various input types into text chunks for embedding
"""

import logging
import re
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import hashlib

from ..config import RAGConfig


logger = logging.getLogger(__name__)


class IngestorTool:
    """
    Tool for ingesting and processing various content types into text chunks.
    Handles text, PDF, and other document formats.
    """

    def __init__(self):
        self.config = RAGConfig()

    def ingest_text(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        chunking_strategy: str = "semantic"
    ) -> List[Dict[str, Any]]:
        """
        Ingest plain text and convert to chunks.

        Args:
            text: The text content to process
            metadata: Additional metadata for the chunks
            chunking_strategy: Strategy for chunking ('semantic', 'fixed', 'sentence')

        Returns:
            List of chunk dictionaries with metadata
        """
        try:
            # Preprocess text
            cleaned_text = self._preprocess_text(text)

            # Split into chunks based on strategy
            if chunking_strategy == "semantic":
                chunks = self._semantic_chunking(cleaned_text)
            elif chunking_strategy == "sentence":
                chunks = self._sentence_chunking(cleaned_text)
            else:
                chunks = self._fixed_size_chunking(cleaned_text)

            # Create chunk objects with metadata
            chunk_objects = []
            for i, chunk_text in enumerate(chunks):
                if len(chunk_text.strip()) < 10:  # Skip very small chunks
                    continue

                chunk_obj = {
                    'content': chunk_text.strip(),
                    'chunk_index': i,
                    'word_count': len(chunk_text.split()),
                    'char_count': len(chunk_text),
                    'metadata': metadata or {},
                    'processing_info': {
                        'chunking_strategy': chunking_strategy,
                        'original_length': len(text),
                        'chunk_count': len(chunks)
                    }
                }
                chunk_objects.append(chunk_obj)

            logger.info(f"Processed text into {len(chunk_objects)} chunks using {chunking_strategy} strategy")
            return chunk_objects

        except Exception as e:
            logger.error(f"Error ingesting text: {e}")
            raise

    def ingest_pdf(
        self,
        file_path: Union[str, Path],
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Ingest PDF file and convert to text chunks.

        Args:
            file_path: Path to the PDF file
            metadata: Additional metadata for the chunks

        Returns:
            List of chunk dictionaries with metadata
        """
        try:
            # Check file size
            file_path = Path(file_path)
            if file_path.stat().st_size > self.config.MAX_FILE_SIZE_MB * 1024 * 1024:
                raise ValueError(f"File size exceeds maximum limit of {self.config.MAX_FILE_SIZE_MB}MB")

            # Extract text from PDF
            text_content = self._extract_pdf_text(file_path)

            # Add PDF-specific metadata
            pdf_metadata = metadata or {}
            pdf_metadata.update({
                'file_name': file_path.name,
                'file_size': file_path.stat().st_size,
                'file_type': 'pdf',
                'extraction_method': 'pdf_parser'
            })

            # Process the extracted text
            return self.ingest_text(text_content, pdf_metadata, chunking_strategy="semantic")

        except Exception as e:
            logger.error(f"Error ingesting PDF {file_path}: {e}")
            raise

    def ingest_file(
        self,
        file_path: Union[str, Path],
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generic file ingestion method that routes to appropriate handler.

        Args:
            file_path: Path to the file
            metadata: Additional metadata

        Returns:
            List of chunk dictionaries
        """
        file_path = Path(file_path)
        file_extension = file_path.suffix.lower()

        if file_extension == '.pdf':
            return self.ingest_pdf(file_path, metadata)
        elif file_extension in ['.txt', '.md', '.html']:
            text_content = file_path.read_text(encoding='utf-8')
            file_metadata = metadata or {}
            file_metadata.update({
                'file_name': file_path.name,
                'file_type': file_extension[1:],  # Remove the dot
            })
            return self.ingest_text(text_content, file_metadata)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for better chunking and embedding."""
        if not text:
            return ""

        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())

        # Remove control characters but keep newlines
        text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', text)

        # Normalize quotes
        text = re.sub(r'["""]', '"', text)
        text = re.sub(r"[''']", "'", text)

        return text

    def _semantic_chunking(self, text: str) -> List[str]:
        """Split text into semantically meaningful chunks."""
        if len(text) <= self.config.CHUNK_SIZE:
            return [text]

        chunks = []
        sentences = self._split_into_sentences(text)

        current_chunk = ""
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence)

            # If adding this sentence would exceed chunk size, save current chunk
            if current_length + sentence_length > self.config.CHUNK_SIZE and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
                current_length = sentence_length
            else:
                current_chunk += sentence
                current_length += sentence_length

        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _sentence_chunking(self, text: str) -> List[str]:
        """Split text into sentence-based chunks."""
        sentences = self._split_into_sentences(text)
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk + sentence) > self.config.CHUNK_SIZE and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += sentence

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _fixed_size_chunking(self, text: str) -> List[str]:
        """Split text into fixed-size chunks with overlap."""
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.config.CHUNK_SIZE

            # Find a good breaking point (sentence end or word boundary)
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                last_period = text.rfind('.', end - 100, end)
                last_newline = text.rfind('\n', end - 100, end)

                break_point = max(last_period, last_newline)
                if break_point > start:
                    end = break_point + 1

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move start position with overlap
            start = end - self.config.CHUNK_OVERLAP

        return chunks

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences using regex."""
        # Simple sentence splitting - can be enhanced with NLP libraries
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)

        # Filter out empty sentences
        return [s.strip() for s in sentences if s.strip()]

    def _extract_pdf_text(self, file_path: Path) -> str:
        """Extract text from PDF file."""
        try:
            # For now, return a placeholder - in production you'd use PyPDF2, pdfplumber, etc.
            # This is a mock implementation
            logger.warning("PDF extraction not fully implemented - using mock text")
            return f"Mock extracted text from PDF: {file_path.name}\n\nThis is placeholder text that would be replaced with actual PDF parsing logic using libraries like PyPDF2 or pdfplumber."

        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise

    def validate_chunks(self, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate chunk quality and provide statistics."""
        if not chunks:
            return {'valid': False, 'issues': ['No chunks provided']}

        total_words = sum(chunk['word_count'] for chunk in chunks)
        total_chars = sum(chunk['char_count'] for chunk in chunks)
        avg_chunk_size = total_words / len(chunks) if chunks else 0

        issues = []

        # Check for very small chunks
        small_chunks = [i for i, chunk in enumerate(chunks) if chunk['word_count'] < 5]
        if small_chunks:
            issues.append(f"Found {len(small_chunks)} very small chunks (indices: {small_chunks[:5]})")

        # Check for very large chunks
        large_chunks = [i for i, chunk in enumerate(chunks) if chunk['word_count'] > self.config.CHUNK_SIZE * 2]
        if large_chunks:
            issues.append(f"Found {len(large_chunks)} very large chunks (indices: {large_chunks[:5]})")

        return {
            'valid': len(issues) == 0,
            'chunk_count': len(chunks),
            'total_words': total_words,
            'total_chars': total_chars,
            'avg_chunk_size': avg_chunk_size,
            'issues': issues
        }