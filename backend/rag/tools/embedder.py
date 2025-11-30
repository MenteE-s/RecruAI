"""
RAG Embedder Tool
Converts text chunks to vector embeddings using OpenAI API
"""

import asyncio
import hashlib
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import threading

try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from ..config import RAGConfig


logger = logging.getLogger(__name__)


class EmbedderTool:
    """
    Tool for generating vector embeddings from text chunks using OpenAI API.
    Handles batching, caching, rate limiting, and error recovery.
    """

    def __init__(self):
        self.config = RAGConfig()

        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Install with: pip install openai")

        if not self.config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = OpenAI(api_key=self.config.OPENAI_API_KEY)

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
        """Simple rate limiter for OpenAI API calls"""

        def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
            self.requests_per_minute = requests_per_minute
            self.requests_per_hour = requests_per_hour
            self.minute_calls = []
            self.hour_calls = []

        def can_make_call(self) -> bool:
            """Check if we can make another API call"""
            now = time.time()

            # Clean old calls
            self.minute_calls = [t for t in self.minute_calls if now - t < 60]
            self.hour_calls = [t for t in self.hour_calls if now - t < 3600]

            return (len(self.minute_calls) < self.requests_per_minute and
                    len(self.hour_calls) < self.requests_per_hour)

        def record_call(self):
            """Record that a call was made"""
            now = time.time()
            self.minute_calls.append(now)
            self.hour_calls.append(now)

        def wait_time(self) -> float:
            """Get how long to wait before next call"""
            if self.can_make_call():
                return 0.0

            now = time.time()
            if self.minute_calls:
                oldest_minute = min(self.minute_calls)
                if now - oldest_minute < 60:
                    return 60 - (now - oldest_minute)

            if self.hour_calls:
                oldest_hour = min(self.hour_calls)
                if now - oldest_hour < 3600:
                    return 3600 - (now - oldest_hour)

            return 1.0  # Default wait time

    def generate_embeddings(
        self,
        chunks: List[Dict[str, Any]],
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate embeddings for a list of text chunks.

        Args:
            chunks: List of chunk dictionaries from IngestorTool
            use_cache: Whether to use embedding cache

        Returns:
            List of chunks with 'embedding' field added
        """
        if not chunks:
            return []

        logger.info(f"Generating embeddings for {len(chunks)} chunks")

        # Check cache first if enabled
        if use_cache:
            chunks = self._apply_cache(chunks)

        # Separate chunks that need embedding
        to_embed = [chunk for chunk in chunks if 'embedding' not in chunk]
        already_embedded = [chunk for chunk in chunks if 'embedding' in chunk]

        if to_embed:
            logger.info(f"Need to embed {len(to_embed)} chunks, {len(already_embedded)} from cache")

            # Generate embeddings in batches
            embedded_chunks = self._generate_embeddings_batch(to_embed)

            # Update cache
            if use_cache:
                self._update_cache(embedded_chunks)

            # Combine results
            result_chunks = embedded_chunks + already_embedded
        else:
            logger.info("All chunks found in cache")
            result_chunks = already_embedded

        return result_chunks

    def _generate_embeddings_batch(
        self,
        chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate embeddings for chunks in optimized batches"""
        if not chunks:
            return []

        # OpenAI allows up to 2048 embeddings per request
        batch_size = min(100, len(chunks))  # Conservative batch size
        embedded_chunks = []

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            batch_texts = [chunk['content'] for chunk in batch]

            try:
                # Wait for rate limit
                wait_time = self._rate_limiter.wait_time()
                if wait_time > 0:
                    logger.info(f"Rate limited, waiting {wait_time:.1f} seconds")
                    time.sleep(wait_time)

                # Make API call
                response = self.client.embeddings.create(
                    input=batch_texts,
                    model=self.config.OPENAI_EMBEDDING_MODEL
                )

                self._rate_limiter.record_call()

                # Process response
                for j, chunk in enumerate(batch):
                    embedding_data = response.data[j]
                    chunk_copy = chunk.copy()
                    chunk_copy['embedding'] = embedding_data.embedding
                    chunk_copy['embedding_model'] = self.config.OPENAI_EMBEDDING_MODEL
                    chunk_copy['embedding_tokens'] = embedding_data.usage.total_tokens if hasattr(embedding_data, 'usage') else None
                    chunk_copy['embedding_generated_at'] = time.time()
                    embedded_chunks.append(chunk_copy)

                logger.info(f"Embedded batch {i//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size}")

            except Exception as e:
                logger.error(f"Error embedding batch {i//batch_size + 1}: {e}")

                # On error, mark chunks as failed but continue
                for chunk in batch:
                    chunk_copy = chunk.copy()
                    chunk_copy['embedding_error'] = str(e)
                    chunk_copy['embedding'] = None
                    embedded_chunks.append(chunk_copy)

        return embedded_chunks

    def _apply_cache(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply embedding cache to chunks"""
        with self._cache_lock:
            for chunk in chunks:
                cache_key = self._get_cache_key(chunk['content'])
                if cache_key in self._embedding_cache:
                    cached_data = self._embedding_cache[cache_key]
                    chunk['embedding'] = cached_data['embedding']
                    chunk['embedding_model'] = cached_data['model']
                    chunk['embedding_from_cache'] = True
                    chunk['embedding_cached_at'] = cached_data['cached_at']

        return chunks

    def _update_cache(self, chunks: List[Dict[str, Any]]):
        """Update embedding cache with new embeddings"""
        with self._cache_lock:
            for chunk in chunks:
                if 'embedding' in chunk and chunk['embedding'] is not None:
                    cache_key = self._get_cache_key(chunk['content'])
                    self._embedding_cache[cache_key] = {
                        'embedding': chunk['embedding'],
                        'model': chunk.get('embedding_model', self.config.OPENAI_EMBEDDING_MODEL),
                        'cached_at': time.time()
                    }

            # Limit cache size to prevent memory issues
            if len(self._embedding_cache) > 10000:
                # Remove oldest 20% of entries
                items = list(self._embedding_cache.items())
                items.sort(key=lambda x: x[1]['cached_at'])
                to_remove = items[:len(items) // 5]
                for key, _ in to_remove:
                    del self._embedding_cache[key]

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text content"""
        # Include model in cache key to avoid mixing different models
        content = f"{self.config.OPENAI_EMBEDDING_MODEL}:{text}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def validate_embeddings(self, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate embedding quality and provide statistics"""
        if not chunks:
            return {'valid': False, 'issues': ['No chunks provided']}

        embedded_count = sum(1 for chunk in chunks if 'embedding' in chunk and chunk['embedding'] is not None)
        failed_count = len(chunks) - embedded_count
        cached_count = sum(1 for chunk in chunks if chunk.get('embedding_from_cache', False))

        issues = []

        if failed_count > 0:
            issues.append(f"{failed_count} chunks failed to embed")

        # Check embedding dimensions
        expected_dims = self.config.OPENAI_EMBEDDING_DIMENSIONS
        wrong_dims = []
        for i, chunk in enumerate(chunks):
            if 'embedding' in chunk and chunk['embedding'] is not None:
                if len(chunk['embedding']) != expected_dims:
                    wrong_dims.append((i, len(chunk['embedding'])))

        if wrong_dims:
            issues.append(f"Wrong embedding dimensions: {wrong_dims}")

        return {
            'valid': len(issues) == 0,
            'total_chunks': len(chunks),
            'embedded_count': embedded_count,
            'failed_count': failed_count,
            'cached_count': cached_count,
            'success_rate': embedded_count / len(chunks) if chunks else 0,
            'issues': issues
        }

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._cache_lock:
            return {
                'cache_size': len(self._embedding_cache),
                'cache_limit': 10000,
                'oldest_entry': min((v['cached_at'] for v in self._embedding_cache.values()), default=None),
                'newest_entry': max((v['cached_at'] for v in self._embedding_cache.values()), default=None)
            }

    def clear_cache(self):
        """Clear the embedding cache"""
        with self._cache_lock:
            self._embedding_cache.clear()
            logger.info("Embedding cache cleared")

    def estimate_cost(self, text_lengths: List[int]) -> Dict[str, Any]:
        """Estimate OpenAI API cost for given text lengths"""
        # OpenAI charges $0.0001 per 1K tokens for ada-002
        # Rough estimate: 1 token ≈ 4 characters
        total_chars = sum(text_lengths)
        estimated_tokens = total_chars / 4
        estimated_cost = (estimated_tokens / 1000) * 0.0001

        return {
            'total_characters': total_chars,
            'estimated_tokens': estimated_tokens,
            'estimated_cost_usd': estimated_cost,
            'cost_per_1k_tokens': 0.0001
        }