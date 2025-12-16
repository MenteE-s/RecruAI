"""
RAG Generator Tool
Generates answers using LLM based on retrieved context (provider-agnostic)
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from ...ai_providers import get_ai_provider_manager
from ..config import RAGConfig


logger = logging.getLogger(__name__)


class GeneratorTool:
    """
    Tool for generating grounded answers using retrieved context and LLM.
    Uses provider-agnostic interface for high-quality response generation.
    """

    def __init__(self):
        self.config = RAGConfig()
        self.provider_manager = get_ai_provider_manager()
        self.llm_provider = self.provider_manager.llm

        # Rate limiting (provider-specific limits)
        self._request_count = 0
        self._last_reset = datetime.utcnow()

    def generate_answer(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate an answer using retrieved context chunks.

        Args:
            query: The user's question
            context_chunks: Retrieved relevant chunks with metadata
            user_context: User-specific context (role, preferences, etc.)
            max_tokens: Maximum tokens for response
            temperature: Creativity/randomness (0.0-1.0)

        Returns:
            Dictionary containing answer, metadata, and confidence
        """
        try:
            # Prepare context from chunks
            context_text = self._prepare_context(context_chunks)

            # Build system prompt
            system_prompt = self._build_system_prompt(user_context)

            # Build user prompt
            user_prompt = self._build_user_prompt(query, context_text)

            # Check rate limits
            self._check_rate_limit()

            # Use provider-agnostic LLM
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            params = {
                "max_tokens": max_tokens or self.config.OPENAI_MAX_TOKENS,
                "temperature": temperature or self.config.OPENAI_TEMPERATURE,
            }

            # Add provider-specific parameters
            if self.config.AI_PROVIDER in ["openai", "groq"]:
                params.update({
                    "top_p": 0.9,
                    "frequency_penalty": 0.1,
                    "presence_penalty": 0.1
                })

            answer = self.llm_provider.chat(messages, params)

            self._request_count += 1

            # Calculate confidence based on context relevance
            confidence = self._calculate_confidence(query, context_chunks, answer)

            # Extract sources
            sources = self._extract_sources(context_chunks)

            return {
                'answer': answer,
                'confidence': confidence,
                'sources': sources,
                'model': self.config.AI_PROVIDER,
                'tokens_used': None,  # Not available from all providers
                'finish_reason': 'completed',
                'generated_at': datetime.utcnow().isoformat(),
                'context_chunks_used': len(context_chunks),
                'query': query
            }

        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return {
                'error': str(e),
                'answer': "I apologize, but I encountered an error while generating a response. Please try again.",
                'confidence': 0.0,
                'sources': [],
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_summary(
        self,
        content: str,
        summary_type: str = "concise",
        max_length: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a summary of the given content.

        Args:
            content: Text content to summarize
            summary_type: Type of summary ('concise', 'detailed', 'bullet_points')
            max_length: Maximum length constraint

        Returns:
            Summary with metadata
        """
        try:
            prompts = {
                'concise': "Provide a concise summary of the following text in 2-3 sentences:",
                'detailed': "Provide a detailed summary of the following text, covering all key points:",
                'bullet_points': "Summarize the following text using bullet points, highlighting the main ideas:"
            }

            system_prompt = "You are a professional summarizer. Create clear, accurate summaries that capture the essential information."
            user_prompt = f"{prompts.get(summary_type, prompts['concise'])}\n\n{content}"

            if max_length:
                user_prompt += f"\n\nKeep the summary under {max_length} words."

            self._check_rate_limit()

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            params = {
                "max_tokens": min(max_length * 2 if max_length else 500, 1000),
                "temperature": 0.3  # More focused for summaries
            }

            summary = self.llm_provider.chat(messages, params)

            self._request_count += 1

            return {
                'summary': summary,
                'summary_type': summary_type,
                'original_length': len(content),
                'summary_length': len(summary),
                'compression_ratio': len(summary) / len(content) if content else 0,
                'model': self.config.AI_PROVIDER,
                'tokens_used': None,  # Not available from all providers
                'generated_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return {
                'error': str(e),
                'summary': "Unable to generate summary due to an error.",
                'generated_at': datetime.utcnow().isoformat()
            }

    def _prepare_context(self, context_chunks: List[Dict[str, Any]]) -> str:
        """Prepare context text from retrieved chunks."""
        if not context_chunks:
            return "No relevant context found."

        # Sort by similarity score if available
        sorted_chunks = sorted(
            context_chunks,
            key=lambda x: x.get('similarity_score', 0),
            reverse=True
        )

        # Build context with source attribution
        context_parts = []
        for i, chunk in enumerate(sorted_chunks[:5]):  # Limit to top 5 chunks
            source_info = f"Source {i+1}"
            if chunk.get('source_type'):
                source_info += f" ({chunk['source_type']})"

            similarity = chunk.get('similarity_score', 0)
            if similarity > 0:
                source_info += f" - Relevance: {similarity:.2f}"

            context_parts.append(f"[{source_info}]\n{chunk['content']}\n")

        return "\n".join(context_parts)

    def _build_system_prompt(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Build system prompt based on user context."""
        # Check if this is an interview context
        if user_context and user_context.get('context') == 'job_interview':
            return self._build_interview_system_prompt(user_context)

        # Default RAG system prompt
        base_prompt = """You are an intelligent assistant helping with recruitment and career-related queries.
You have access to relevant context information to provide accurate, helpful answers.

Guidelines:
- Use the provided context to ground your answers
- Be specific and cite sources when relevant
- If the context doesn't contain enough information, say so clearly
- Maintain a professional, helpful tone
- For recruitment questions, focus on fair and unbiased responses"""

        if user_context:
            role = user_context.get('role', 'individual')
            if role == 'organization':
                base_prompt += "\n- You are assisting an organization with recruitment needs"
            elif role == 'individual':
                base_prompt += "\n- You are assisting a job seeker with career guidance"

            plan = user_context.get('plan', 'trial')
            if plan == 'trial':
                base_prompt += "\n- This user is on a trial plan, provide helpful but limited responses"

        return base_prompt


    def _build_interview_system_prompt(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Build system prompt specifically for interview AI"""

        interview_context = user_context.get('interview_context', '') if user_context else ''

        base_prompt = f"""
You are a SENIOR PROFESSIONAL INTERVIEWER conducting a structured job interview.

Your role is to efficiently evaluate whether the candidate is suitable for THIS SPECIFIC ROLE.

INTERVIEW AUTHORITY & CONTROL:
- You lead the interview and control the flow
- Stay firm, neutral, and professional at all times
- Do NOT argue, insult, or emotionally react
- If answers are weak or irrelevant, reduce depth and move forward
- You may conclude the interview early if the candidate is clearly unqualified

QUESTIONING STYLE:
- Ask direct, job-specific questions
- Challenge vague answers by asking for clarity
- Demand concrete examples and measurable outcomes
- Use role-focused phrasing:
  - "For this role, explain..."
  - "Based on the job requirements..."
  - "Give a specific example where you..."

INTERVIEW STRUCTURE:
- Start with relevant background and experience
- Probe technical or functional skills using real scenarios
- Ask behavioral questions tied to job responsibilities
- Evaluate motivation and alignment with THIS POSITION
- Always ask 1 focused follow-up question if the answer lacks depth

CANDIDATE MANAGEMENT:
- If candidate asks questions, briefly acknowledge and redirect
- Keep discussion strictly relevant to job requirements
- If the candidate is clearly not meeting expectations, stay neutral and proceed efficiently

DECISION BEHAVIOR:
- Do NOT provide feedback or rejection signals during the interview
- Internally assess competence, clarity, and role-fit
- Be time-aware and outcome-driven

CRITICAL RULES:
- Be professional, not conversational
- Be decisive, not rude
- Prioritize evaluation over friendliness
- If evidence shows poor fit, shorten the interview respectfully
- Always base questions on the provided job description and company context

{interview_context}

Remember:
You are evaluating this candidate for THIS ROLE only.
Your job is to assess fit quickly, fairly, and professionally — then move on.
"""

        return base_prompt

    def _build_user_prompt(self, query: str, context: str) -> str:
        """Build user prompt with query and context."""

        # Detect interview mode
        if "Interview Context:" in context or "AI Interviewer Profile:" in context:
            return f"""
INTERVIEW CONTEXT:
{context}

CANDIDATE RESPONSE:
{query}

INSTRUCTIONS:
- Treat this as a live interview response
- Evaluate clarity, relevance, and depth
- If the answer is vague, incomplete, or off-topic, probe further
- Ask ONE focused follow-up question based on job requirements
- Do NOT provide feedback, hints, or encouragement
- Stay professional, neutral, and time-efficient
"""
    # Default RAG mode
        return f"""
    CONTEXT:
    {context}

    USER QUESTION:
    {query}

    INSTRUCTIONS:
    - Answer strictly based on the provided context
    - If context is insufficient, state that clearly
    - Do not assume missing information
    """

    def _build_interview_user_prompt(self, candidate_message: str, context: str) -> str:
        """Build user prompt specifically for interview conversations."""
    
        return f"""
INTERVIEW MODE — SENIOR INTERVIEWER

CANDIDATE RESPONSE:
"{candidate_message}"

INTERVIEW CONTEXT:
{context}

INSTRUCTIONS:
- You control the interview flow and remain neutral and professional
- Evaluate the response strictly against the job requirements
- If the answer is vague, incomplete, or irrelevant, probe once for clarity
- Ask direct, job-specific questions that test real experience
- Reference the role, responsibilities, and company context when relevant
- Do NOT provide feedback, validation, or encouragement
- Do NOT argue or show emotion
- If the candidate appears unqualified, shorten the interaction efficiently
- Always ask exactly ONE focused follow-up question

Respond as a senior professional interviewer assessing fit for THIS SPECIFIC ROLE.
"""

    def _calculate_confidence(self, query: str, context_chunks: List[Dict[str, Any]], answer: str) -> float:
        """Calculate confidence score for the generated answer."""
        if not context_chunks:
            return 0.0

        # Simple confidence calculation based on:
        # 1. Average similarity score of context chunks
        # 2. Number of relevant chunks
        # 3. Answer length (longer answers might indicate more comprehensive responses)

        avg_similarity = sum(chunk.get('similarity_score', 0) for chunk in context_chunks) / len(context_chunks)
        chunk_count_factor = min(len(context_chunks) / 5, 1.0)  # Max benefit from 5 chunks
        answer_length_factor = min(len(answer.split()) / 100, 1.0)  # Max benefit from 100 words

        confidence = (avg_similarity * 0.5) + (chunk_count_factor * 0.3) + (answer_length_factor * 0.2)

        return min(confidence, 1.0)  # Cap at 1.0

    def _extract_sources(self, context_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract source information from context chunks."""
        sources = []
        for chunk in context_chunks:
            source = {
                'chunk_id': chunk.get('chunk_id'),
                'document_id': chunk.get('document_id'),
                'source_type': chunk.get('source_type'),
                'similarity_score': chunk.get('similarity_score'),
                'content_preview': chunk.get('content', '')[:100] + '...' if len(chunk.get('content', '')) > 100 else chunk.get('content', '')
            }
            sources.append(source)

        return sources

    def _check_rate_limit(self):
        """Check and handle rate limits."""
        now = datetime.utcnow()

        # Reset counter every minute
        if (now - self._last_reset).seconds >= 60:
            self._request_count = 0
            self._last_reset = now

        # GPT-4 has higher limits than embeddings, but let's be conservative
        if self._request_count >= 50:  # 50 requests per minute
            sleep_time = 60 - (now - self._last_reset).seconds
            if sleep_time > 0:
                logger.info(f"Rate limited, sleeping for {sleep_time} seconds")
                import time
                time.sleep(sleep_time)
                self._request_count = 0
                self._last_reset = datetime.utcnow()

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics."""
        return {
            'requests_this_minute': self._request_count,
            'last_reset': self._last_reset.isoformat(),
            'model': self.config.OPENAI_COMPLETION_MODEL,
            'max_tokens': self.config.OPENAI_MAX_TOKENS,
            'temperature': self.config.OPENAI_TEMPERATURE
        }

    def validate_answer(self, answer: Dict[str, Any]) -> Dict[str, Any]:
        """Validate generated answer quality."""
        issues = []

        if not answer.get('answer'):
            issues.append("Empty answer generated")

        if answer.get('confidence', 0) < 0.3:
            issues.append("Low confidence score")

        if len(answer.get('sources', [])) == 0:
            issues.append("No sources provided")

        answer_length = len(answer.get('answer', ''))
        if answer_length < 10:
            issues.append("Answer too short")
        elif answer_length > 4000:
            issues.append("Answer too long")

        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'answer_length': answer_length,
            'source_count': len(answer.get('sources', [])),
            'confidence': answer.get('confidence', 0)
        }