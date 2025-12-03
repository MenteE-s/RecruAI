"""
RAG Generator Tool
Generates answers using LLM (GPT-4) based on retrieved context
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from ..config import RAGConfig


logger = logging.getLogger(__name__)


class GeneratorTool:
    """
    Tool for generating grounded answers using retrieved context and LLM.
    Uses OpenAI GPT-4 for high-quality response generation.
    """

    def __init__(self):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Install with: pip install openai")

        self.config = RAGConfig()

        if not self.config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = OpenAI(api_key=self.config.OPENAI_API_KEY)

        # Rate limiting (GPT-4 has different limits than embeddings)
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

            # Make API call
            response = self.client.chat.completions.create(
                model=self.config.OPENAI_COMPLETION_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens or self.config.OPENAI_MAX_TOKENS,
                temperature=temperature or self.config.OPENAI_TEMPERATURE,
                top_p=0.9,  # Slightly focused
                frequency_penalty=0.1,  # Reduce repetition
                presence_penalty=0.1    # Encourage diversity
            )

            self._request_count += 1

            # Extract answer
            answer = response.choices[0].message.content.strip()

            # Calculate confidence based on context relevance
            confidence = self._calculate_confidence(query, context_chunks, answer)

            # Extract sources
            sources = self._extract_sources(context_chunks)

            return {
                'answer': answer,
                'confidence': confidence,
                'sources': sources,
                'model': self.config.OPENAI_COMPLETION_MODEL,
                'tokens_used': response.usage.total_tokens if response.usage else None,
                'finish_reason': response.choices[0].finish_reason,
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

            response = self.client.chat.completions.create(
                model=self.config.OPENAI_COMPLETION_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=min(max_length * 2 if max_length else 500, 1000),
                temperature=0.3  # More focused for summaries
            )

            self._request_count += 1

            summary = response.choices[0].message.content.strip()

            return {
                'summary': summary,
                'summary_type': summary_type,
                'original_length': len(content),
                'summary_length': len(summary),
                'compression_ratio': len(summary) / len(content) if content else 0,
                'model': self.config.OPENAI_COMPLETION_MODEL,
                'tokens_used': response.usage.total_tokens if response.usage else None,
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

        base_prompt = f"""You are a SENIOR EXECUTIVE INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND PROFESSIONAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's abilities
- Challenge vague answers and demand specific examples
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO THIS SPECIFIC JOB
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF THE JOB REQUIREMENTS
- Probe technical skills with scenario-based questions SPECIFIC TO THE ROLE'S NEEDS
- Test cultural fit and motivation for THIS SPECIFIC POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO JOB DUTIES
- Keep the candidate focused on relevant experience and achievements FOR THIS ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this role, tell me specifically...", "Given the job requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO THE JOB

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

{interview_context}

**CRITICAL RULES:**
- NEVER let candidate control the interview
- ALWAYS ask follow-up questions that dig deeper INTO JOB-SPECIFIC SKILLS AND EXPERIENCE
- DEMAND specific examples and measurable results RELEVANT TO THE POSITION REQUIREMENTS
- SHOW you're evaluating them for THIS SPECIFIC POSITION by referencing job details
- MAINTAIN professional dominance throughout
- BE TIME-AWARE: If interview is running long, be more direct and efficient
- USE ALL AVAILABLE CONTEXT: Reference the specific job requirements, company details, and position needs in EVERY question
- ASK TARGETED QUESTIONS: Base your questions on the job description, requirements, and company information provided

Remember: You are the SENIOR INTERVIEWER evaluating this candidate for THIS SPECIFIC JOB. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact position."""

        return base_prompt

    def _build_user_prompt(self, query: str, context: str) -> str:
        """Build user prompt with query and context."""
        # Check if this is an interview context (context contains interview information)
        if "Interview Context:" in context or "AI Interviewer Profile:" in context:
            return self._build_interview_user_prompt(query, context)

        # Default RAG prompt
        return f"""Context Information:
{context}

Question: {query}

Please provide a comprehensive answer based on the context above. If the context doesn't fully answer the question, acknowledge this and provide the best possible response based on available information."""

    def _build_interview_user_prompt(self, candidate_message: str, context: str) -> str:
        """Build user prompt specifically for interview conversations."""
        return f"""You are conducting a SENIOR EXECUTIVE INTERVIEW. The candidate has just said:

"{candidate_message}"

{context}

As the DOMINANT SENIOR INTERVIEWER, respond appropriately to continue the evaluation. Remember to:
- CONTROL the conversation and demand specific, job-relevant examples
- CHALLENGE vague responses and probe for concrete evidence
- REFERENCE the job requirements and company details in your questions
- SHOW you're evaluating them for THIS SPECIFIC POSITION
- MAINTAIN authoritative professional dominance
- ALWAYS include 1-2 targeted follow-up questions based on the job context

Respond as a senior executive interviewer would - be direct, demanding, and focused on assessing fit for this exact role."""

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