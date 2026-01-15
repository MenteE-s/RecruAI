import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from ...ai_providers import get_ai_provider_manager

logger = logging.getLogger(__name__)

class ThinkingModule:
    """
    Module for implementing "think before speak" functionality.
    Analyzes context, generates reasoning, and validates response quality.
    """

    def __init__(self):
        self.provider_manager = get_ai_provider_manager()
        self.llm_provider = self.provider_manager.llm

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response with formatting resilience"""
        try:
            # Clean common artifacts
            text = text.strip()
            
            # Try parsing directly first
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Find the first { and last }
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                try:
                    cleaned_json = text[start:end+1]
                    # Simple cleanup for common LLM issues (missing commas etc could still fail, but this helps)
                    return json.loads(cleaned_json)
                except json.JSONDecodeError:
                    pass
            
            raise

    def analyze_context(self, query: str, context_chunks: List[Dict[str, Any]], system_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze retrieved context to determine relevance and identify gaps.

        Args:
            query: User's original query
            context_chunks: Retrieved context chunks
            system_context: Optional context about the system state/goal

        Returns:
            Analysis results with relevance scores and identified gaps
        """
        try:
            # Prepare context summary
            context_summary = self._prepare_context_summary(context_chunks)

            # Build analysis prompt
            analysis_prompt = f"""
            Analyze the following context for answering the user's query:

            USER QUERY: {query}
            {f"SYSTEM CONTEXT: {system_context}" if system_context else ""}

            AVAILABLE CONTEXT:
            {context_summary}

            Provide analysis in JSON format:
            {{
                "relevance_score": 0.0-1.0,
                "key_information": ["list", "of", "key", "points"],
                "identified_gaps": ["missing", "information", "areas"],
                "context_quality": "high/medium/low",
                "sufficient_for_answer": true/false
            }}
            """

            # Get analysis from LLM
            response = self.llm_provider.chat([
                {"role": "system", "content": "You are an expert at analyzing information relevance and completeness."},
                {"role": "user", "content": analysis_prompt}
            ], {"temperature": 0.1})

            # Parse JSON response
            analysis = self._extract_json(response)

            # Add metadata
            analysis['analyzed_at'] = datetime.utcnow().isoformat()
            analysis['context_chunks_used'] = len(context_chunks)

            return analysis

        except Exception as e:
            logger.error(f"Error in context analysis: {e}")
            return {
                "relevance_score": 0.5,
                "key_information": [],
                "identified_gaps": ["Analysis failed"],
                "context_quality": "low",
                "sufficient_for_answer": False,
                "error": str(e)
            }

    def generate_reasoning(self, query: str, context_chunks: List[Dict[str, Any]],
                          analysis: Dict[str, Any], system_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate internal reasoning for how to respond to the query.

        Args:
            query: User's original query
            context_chunks: Retrieved context chunks
            analysis: Context analysis results
            system_context: Optional context about the system state/goal

        Returns:
            Reasoning with thought process and response strategy
        """
        try:
            # Prepare context for reasoning
            context_text = self._prepare_context_text(context_chunks)

            # Build reasoning prompt
            reasoning_prompt = f"""
            You are an AI assistant preparing to answer a question. Think through your approach step by step.

            USER QUERY: {query}
            {f"SYSTEM CONTEXT: {system_context}" if system_context else ""}

            CONTEXT ANALYSIS: {analysis}

            AVAILABLE CONTEXT:
            {context_text}

            Generate your reasoning in JSON format:
            {{
                "thought_process": "Step-by-step thinking about how to answer",
                "response_strategy": "What approach to take for the response",
                "key_points_to_cover": ["point1", "point2", "point3"],
                "tone_and_style": "professional/casual/technical/etc",
                "confidence_assessment": 0.0-1.0,
                "potential_concerns": ["any", "issues", "to", "address"],
                "recommended_structure": "How to structure the response"
            }}
            """

            # Get reasoning from LLM
            response = self.llm_provider.chat([
                {"role": "system", "content": "You are an expert at reasoning and planning responses. Think step by step and be thorough."},
                {"role": "user", "content": reasoning_prompt}
            ], {"temperature": 0.2})

            # Parse JSON response
            reasoning = self._extract_json(response)

            # Add metadata
            reasoning['generated_at'] = datetime.utcnow().isoformat()
            reasoning['query'] = query

            return reasoning

        except Exception as e:
            logger.error(f"Error in reasoning generation: {e}")
            return {
                "thought_process": "Reasoning generation failed",
                "response_strategy": "Direct answer",
                "key_points_to_cover": [],
                "tone_and_style": "professional",
                "confidence_assessment": 0.3,
                "potential_concerns": ["Reasoning failed"],
                "recommended_structure": "Simple response",
                "error": str(e)
            }

    def validate_reasoning(self, reasoning: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate the quality and coherence of generated reasoning.

        Args:
            reasoning: Generated reasoning to validate

        Returns:
            Validation results with quality scores and issues
        """
        try:
            # Build validation prompt
            validation_prompt = f"""
            Validate the quality of this AI reasoning:

            REASONING TO VALIDATE:
            {reasoning}

            Provide validation in JSON format:
            {{
                "is_valid": true/false,
                "quality_score": 0.0-1.0,
                "coherence_score": 0.0-1.0,
                "completeness_score": 0.0-1.0,
                "issues": ["list", "of", "identified", "issues"],
                "strengths": ["list", "of", "good", "points"],
                "recommendations": ["suggestions", "for", "improvement"]
            }}
            """

            # Get validation from LLM
            response = self.llm_provider.chat([
                {"role": "system", "content": "You are an expert at evaluating AI reasoning quality. Be thorough and fair."},
                {"role": "user", "content": validation_prompt}
            ], {"temperature": 0.1})

            # Parse JSON response
            validation = self._extract_json(response)

            # Add metadata
            validation['validated_at'] = datetime.utcnow().isoformat()

            # Determine if reasoning is acceptable
            validation['is_acceptable'] = (
                validation.get('quality_score', 0) > 0.6 and
                validation.get('coherence_score', 0) > 0.6 and
                len(validation.get('issues', [])) < 3
            )

            return validation

        except Exception as e:
            logger.error(f"Error in reasoning validation: {e}")
            return {
                "is_valid": False,
                "quality_score": 0.3,
                "coherence_score": 0.3,
                "completeness_score": 0.3,
                "issues": ["Validation failed"],
                "strengths": [],
                "recommendations": ["Fix validation system"],
                "is_acceptable": False,
                "error": str(e)
            }

    def _prepare_context_summary(self, context_chunks: List[Dict[str, Any]]) -> str:
        """Prepare a summary of context chunks for analysis."""
        if not context_chunks:
            return "No context available."

        summary_parts = []
        for i, chunk in enumerate(context_chunks[:5]):  # Limit to top 5
            similarity = chunk.get('similarity_score', 0)
            source = chunk.get('source_type', 'unknown')
            content = chunk.get('content', '')[:200]  # First 200 chars

            summary_parts.append(
                f"Chunk {i+1} (Source: {source}, Similarity: {similarity:.2f}): {content}..."
            )

        return "\n\n".join(summary_parts)

    def _prepare_context_text(self, context_chunks: List[Dict[str, Any]]) -> str:
        """Prepare full context text for reasoning."""
        if not context_chunks:
            return "No context available."

        context_parts = []
        # Limit to top 5 chunks and truncate large chunks to avoid token limits
        for i, chunk in enumerate(context_chunks[:5]):  
            content = chunk.get('content', '')
            source = chunk.get('source_type', 'unknown')
            similarity = chunk.get('similarity_score', 0)

            # Truncate content if it's too long (roughly 3000 chars per chunk max)
            if len(content) > 3000:
                content = content[:3000] + "... [TRUNCATED]"

            context_parts.append(
                f"[Source {i+1}: {source} (Relevance: {similarity:.2f})]\n{content}"
            )

        return "\n\n".join(context_parts)
