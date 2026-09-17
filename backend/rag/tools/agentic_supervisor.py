import logging
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from .supervisor import RAGSupervisor
from .thinking import ThinkingModule
from .retriever import RetrieverTool
from .embedder import EmbedderTool
from .generator import GeneratorTool

logger = logging.getLogger(__name__)

class AgenticRAGSupervisor(RAGSupervisor):
    """
    Enhanced RAG Supervisor with "think before speak" capabilities.
    Extends the base supervisor with agentic reasoning.
    """

    def __init__(self):
        super().__init__()
        self.thinking_module = ThinkingModule()

    def orchestrate_agentic_workflow(
        self,
        query: str,
        context: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
        enable_thinking: bool = True
    ) -> Dict[str, Any]:
        """
        Orchestrate the complete agentic RAG workflow.

        Args:
            query: User's query
            context: Additional context (e.g., interview context)
            user_context: User-specific context
            enable_thinking: Whether to enable thinking step

        Returns:
            Complete response with thinking step and final answer
        """
        start_time = time.time()
        workflow_id = f"agentic_{int(time.time())}_{hash(query) % 10000}"

        try:
            # Initialize result structure
            result = {
                'workflow_id': workflow_id,
                'query': query,
                'context': context,
                'enable_thinking': enable_thinking,
                'thinking_step': None,
                'final_response': None,
                'performance': {},
                'errors': []
            }

            # Step 1: Retrieve relevant context (using existing RAG pipeline)
            retrieval_result = self._retrieve_context(query, user_context)
            result['retrieval'] = retrieval_result

            if not retrieval_result.get('success', False):
                result['errors'].append("Context retrieval failed")
                return result

            context_chunks = retrieval_result.get('chunks', [])

            # Step 2: Thinking step (if enabled)
            if enable_thinking and context_chunks:
                thinking_result = self._execute_thinking_step(
                    query, context_chunks, context, user_context
                )
                result['thinking_step'] = thinking_result

                # Check if thinking was successful
                if not thinking_result.get('validation', {}).get('is_acceptable', False):
                    logger.warning(f"Thinking validation failed for workflow {workflow_id}")
                    # Continue with response but note the issue
                    result['errors'].append("Thinking validation failed")

            # Step 3: Generate final response
            generation_result = self._generate_agentic_response(
                query, context_chunks, result.get('thinking_step'), user_context
            )
            result['final_response'] = generation_result

            # Calculate performance metrics
            end_time = time.time()
            result['performance'] = {
                'total_time': end_time - start_time,
                'thinking_time': result.get('thinking_step', {}).get('thinking_time', 0) if result.get('thinking_step') else 0,
                'generation_time': generation_result.get('generation_time', 0),
                'success': len(result['errors']) == 0
            }

            return result

        except Exception as e:
            logger.error(f"Agentic workflow {workflow_id} failed: {e}")
            return {
                'workflow_id': workflow_id,
                'error': str(e),
                'success': False,
                'performance': {'total_time': time.time() - start_time}
            }

    def _retrieve_context(self, query: str, user_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Retrieve relevant context using existing RAG pipeline."""
        try:
            # Use the existing query workflow from parent class
            retrieval_result = self.orchestrate_workflow(
                input_data={'query': query},
                input_type='query',
                user_context=user_context
            )

            if retrieval_result.get('rag_disabled'):
                return {
                    'success': False,
                    'chunks': [],
                    'error': 'RAG disabled'
                }

            # In the current supervisor, the orchestrate_workflow returns final_result which has sources
            # Let's adjust based on the actual orchestrate_workflow implementation in supervisor.py
            # Looking at supervisor.py, it calls _handle_query_workflow which calls generator.generate_answer
            # which returns sources.
            
            # The orchestrate_workflow implementation might vary, let's look at it again.
            return {
                'success': True,
                'chunks': retrieval_result.get('final_result', {}).get('sources', []),
                'confidence': retrieval_result.get('final_result', {}).get('confidence', 0),
                'retrieval_time': retrieval_result.get('performance', {}).get('total_time', 0)
            }

        except Exception as e:
            logger.error(f"Context retrieval failed: {e}")
            return {
                'success': False,
                'chunks': [],
                'error': str(e)
            }

    def _execute_thinking_step(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        context: Optional[str],
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute the complete thinking step."""
        thinking_start = time.time()

        try:
            # Step 1: Analyze context
            analysis = self.thinking_module.analyze_context(query, context_chunks)

            # Step 2: Generate reasoning
            reasoning = self.thinking_module.generate_reasoning(
                query, context_chunks, analysis
            )

            # Step 3: Validate reasoning
            validation = self.thinking_module.validate_reasoning(reasoning)

            thinking_time = time.time() - thinking_start

            return {
                'analysis': analysis,
                'reasoning': reasoning,
                'validation': validation,
                'thinking_time': thinking_time,
                'context_used': len(context_chunks),
                'thinking_successful': validation.get('is_acceptable', False)
            }

        except Exception as e:
            logger.error(f"Thinking step failed: {e}")
            return {
                'analysis': {'error': str(e)},
                'reasoning': {'error': str(e)},
                'validation': {'is_valid': False, 'error': str(e)},
                'thinking_time': time.time() - thinking_start,
                'thinking_successful': False
            }

    def _generate_agentic_response(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        thinking_step: Optional[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate response using thinking insights."""
        generation_start = time.time()

        try:
            # Create enhanced generator with thinking insights
            generator = GeneratorTool()

            # Prepare enhanced user context with thinking
            enhanced_user_context = user_context.copy() if user_context else {}
            if thinking_step:
                enhanced_user_context['thinking_insights'] = {
                    'response_strategy': thinking_step.get('reasoning', {}).get('response_strategy', ''),
                    'tone_and_style': thinking_step.get('reasoning', {}).get('tone_and_style', ''),
                    'key_points_to_cover': thinking_step.get('reasoning', {}).get('key_points_to_cover', []),
                    'confidence_assessment': thinking_step.get('reasoning', {}).get('confidence_assessment', 0.5)
                }

            # Generate response
            generation_result = generator.generate_answer(
                query=query,
                context_chunks=context_chunks,
                user_context=enhanced_user_context
            )

            generation_time = time.time() - generation_start
            generation_result['generation_time'] = generation_time

            # Add thinking metadata if available
            if thinking_step:
                generation_result['enhanced_by_thinking'] = True
                generation_result['thinking_confidence'] = thinking_step.get('reasoning', {}).get('confidence_assessment', 0.5)
            else:
                generation_result['enhanced_by_thinking'] = False

            return generation_result

        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return {
                'error': str(e),
                'answer': 'I apologize, but I encountered an error generating my response.',
                'confidence': 0.0,
                'sources': [],
                'generation_time': time.time() - generation_start,
                'enhanced_by_thinking': False
            }
