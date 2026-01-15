# Think Before Speak Implementation Guide

## Step-by-Step Implementation

This guide provides detailed implementation steps for adding the "think before speak" agentic enhancement to your RecruAI RAG system.

## Phase 1: Create the Thinking Module

### Step 1.1: Create the Thinking Module File

```bash
# Create new file
touch backend/rag/tools/thinking.py
```

### Step 1.2: Implement the ThinkingModule Class

```python
# backend/rag/tools/thinking.py
import logging
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

    def analyze_context(self, query: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze retrieved context to determine relevance and identify gaps.

        Args:
            query: User's original query
            context_chunks: Retrieved context chunks

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
            import json
            analysis = json.loads(response)

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
                          analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate internal reasoning for how to respond to the query.

        Args:
            query: User's original query
            context_chunks: Retrieved context chunks
            analysis: Context analysis results

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
            import json
            reasoning = json.loads(response)

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
            import json
            validation = json.loads(response)

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
        for i, chunk in enumerate(context_chunks[:5]):  # Limit to top 5
            content = chunk.get('content', '')
            source = chunk.get('source_type', 'unknown')
            similarity = chunk.get('similarity_score', 0)

            context_parts.append(
                f"[Source {i+1}: {source} (Relevance: {similarity:.2f})]\n{content}"
            )

        return "\n\n".join(context_parts)
```

## Phase 2: Create Agentic RAG Supervisor

### Step 2.1: Create Agentic Supervisor

```python
# backend/rag/tools/agentic_supervisor.py
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
                'thinking_time': result.get('thinking_step', {}).get('thinking_time', 0),
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

            final_result = retrieval_result.get('final_result', {})
            return {
                'success': True,
                'chunks': final_result.get('sources', []),
                'confidence': final_result.get('confidence', 0),
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
```

## Phase 3: Update API Routes

### Step 3.1: Add Agentic Query Endpoint

```python
# Add to backend/api/rag/routes.py (after the existing query endpoint)

@rag_bp.route('/agentic-query', methods=['POST'])
@jwt_required()
def agentic_query_rag():
    """Enhanced RAG query with think-before-speak functionality"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400

        query = data['query']
        context = data.get('context', '')
        user_context = data.get('user_context', {})
        enable_thinking = data.get('enable_thinking', True)

        # Add current user to context
        current_user_id = get_jwt_identity()
        user_context['user_id'] = current_user_id

        # Import agentic supervisor
        from ...rag.tools.agentic_supervisor import AgenticRAGSupervisor
        agentic_supervisor = AgenticRAGSupervisor()

        # Execute agentic workflow
        result = agentic_supervisor.orchestrate_agentic_workflow(
            query=query,
            context=context,
            user_context=user_context,
            enable_thinking=enable_thinking
        )

        # Handle RAG disabled case
        if result.get('retrieval', {}).get('error') == 'RAG disabled':
            # Fallback to direct AI generation
            try:
                from ...ai_service import get_ai_service
                ai_service = get_ai_service()

                system_prompt = "You are a helpful AI assistant for recruitment and career guidance. Provide accurate, helpful responses based on your knowledge."
                ai_response = ai_service.generate_response(system_prompt, query)

                return jsonify({
                    'success': True,
                    'workflow_id': result.get('workflow_id'),
                    'answer': ai_response,
                    'confidence': 0.5,
                    'sources': [],
                    'rag_disabled': True,
                    'thinking_step': None,
                    'enhanced_by_thinking': False,
                    'processing_time': result.get('performance', {}).get('total_time', 0)
                })
            except Exception as fallback_error:
                logger.error(f"Agentic RAG fallback error: {fallback_error}")
                return jsonify({
                    'error': 'AI service unavailable',
                    'rag_disabled': True
                }), 503

        # Return successful agentic response
        return jsonify({
            'success': True,
            'workflow_id': result.get('workflow_id'),
            'answer': result.get('final_response', {}).get('answer', ''),
            'confidence': result.get('final_response', {}).get('confidence', 0),
            'sources': result.get('final_response', {}).get('sources', []),
            'thinking_step': result.get('thinking_step'),
            'enhanced_by_thinking': result.get('final_response', {}).get('enhanced_by_thinking', False),
            'processing_time': result.get('performance', {}).get('total_time', 0),
            'thinking_time': result.get('performance', {}).get('thinking_time', 0),
            'generation_time': result.get('performance', {}).get('generation_time', 0)
        })

    except Exception as e:
        logger.error(f"Agentic RAG query error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/reasoning/<workflow_id>', methods=['GET'])
@jwt_required()
def get_reasoning(workflow_id):
    """Get detailed reasoning for a specific workflow"""
    try:
        # This would require storing reasoning results in database
        # For now, return a placeholder
        return jsonify({
            'success': True,
            'workflow_id': workflow_id,
            'message': 'Reasoning retrieval not yet implemented',
            'reasoning': None
        })

    except Exception as e:
        logger.error(f"Reasoning retrieval error: {e}")
        return jsonify({'error': str(e)}), 500
```

## Phase 4: Update Generator Tool

### Step 4.1: Enhance Generator for Agentic Mode

```python
# Add to backend/rag/tools/generator.py (modify the existing _build_system_prompt method)

def _build_system_prompt(self, user_context: Optional[Dict[str, Any]] = None) -> str:
    """Build system prompt based on user context and thinking insights."""
    # Check if this is an interview context
    if user_context and user_context.get('context') == 'job_interview':
        return self._build_interview_system_prompt(user_context)

    # Check for agentic thinking insights
    thinking_insights = user_context.get('thinking_insights') if user_context else None

    # Default RAG system prompt
    base_prompt = """You are an intelligent assistant helping with recruitment and career-related queries.
You have access to relevant context information to provide accurate, helpful answers.

Guidelines:
- Use the provided context to ground your answers
- Be specific and cite sources when relevant
- If the context doesn't contain enough information, say so clearly
- Maintain a professional, helpful tone
- For recruitment questions, focus on fair and unbiased responses"""

    # Add thinking-based enhancements
    if thinking_insights:
        strategy = thinking_insights.get('response_strategy', '')
        tone = thinking_insights.get('tone_and_style', 'professional')
        key_points = thinking_insights.get('key_points_to_cover', [])

        if strategy:
            base_prompt += f"\n- Response strategy: {strategy}"
        if tone and tone != 'professional':
            base_prompt += f"\n- Use a {tone} tone"
        if key_points:
            base_prompt += f"\n- Key points to cover: {', '.join(key_points[:3])}"

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
```

## Phase 5: Frontend Integration

### Step 5.1: Create React Component for Thinking Display

```jsx
// src/components/interviews/ThinkingDisplay.jsx
import React, { useState } from "react";
import { FaBrain, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const ThinkingDisplay = ({ thinkingStep, isVisible, onToggle }) => {
  if (!thinkingStep || !isVisible) return null;

  const { analysis, reasoning, validation } = thinkingStep;
  const isValidationGood = validation?.is_acceptable;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FaBrain className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            AI Thinking Process
          </h3>
          {isValidationGood ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <FaExclamationTriangle className="text-yellow-500" />
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Hide
        </button>
      </div>

      {/* Context Analysis */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Context Analysis</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Relevance Score:</span>
            <span className="ml-2 text-blue-600">
              {(analysis?.relevance_score || 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-medium">Context Quality:</span>
            <span className="ml-2 text-blue-600">
              {analysis?.context_quality || "Unknown"}
            </span>
          </div>
        </div>
        {analysis?.key_information?.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">Key Information:</span>
            <ul className="list-disc list-inside mt-1 text-gray-600">
              {analysis.key_information.slice(0, 3).map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Response Strategy</h4>
        <p className="text-sm text-gray-600 mb-2">
          {reasoning?.response_strategy || "No strategy available"}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Tone:</span>
            <span className="ml-2 text-blue-600">
              {reasoning?.tone_and_style || "Professional"}
            </span>
          </div>
          <div>
            <span className="font-medium">Confidence:</span>
            <span className="ml-2 text-blue-600">
              {(reasoning?.confidence_assessment || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Validation */}
      {validation && (
        <div className="border-t pt-3">
          <h4 className="font-medium text-gray-700 mb-2">Quality Validation</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Quality:</span>
              <span className="ml-2 text-blue-600">
                {(validation.quality_score || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-medium">Coherence:</span>
              <span className="ml-2 text-blue-600">
                {(validation.coherence_score || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-medium">Complete:</span>
              <span className="ml-2 text-blue-600">
                {(validation.completeness_score || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingDisplay;
```

### Step 5.2: Update Interview Room Component

```jsx
// Update src/pages/interviews/InterviewRoom.jsx
import React, { useState, useEffect } from "react";
import ThinkingDisplay from "../interviews/ThinkingDisplay";

const InterviewRoom = () => {
  const [messages, setMessages] = useState([]);
  const [currentThinking, setCurrentThinking] = useState(null);
  const [showThinking, setShowThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message) => {
    setIsLoading(true);
    setShowThinking(false); // Reset thinking display

    try {
      const response = await fetch("/api/rag/agentic-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          query: message,
          context: "job_interview",
          enable_thinking: true,
          user_context: {
            context: "job_interview",
            role: "individual",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show thinking process if available
        if (data.thinking_step && data.enhanced_by_thinking) {
          setCurrentThinking(data.thinking_step);
          setShowThinking(true);
        }

        // Add AI response to messages
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: data.answer,
            confidence: data.confidence,
            enhanced_by_thinking: data.enhanced_by_thinking,
            thinking_time: data.thinking_time,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`mb-4 ${
              message.type === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p>{message.content}</p>
              {message.type === "ai" && (
                <div className="text-xs mt-2 opacity-75">
                  Confidence: {(message.confidence * 100).toFixed(0)}%
                  {message.enhanced_by_thinking && (
                    <span className="ml-2">
                      🧠 Thinking: {(message.thinking_time * 1000).toFixed(0)}ms
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Display */}
        <ThinkingDisplay
          thinkingStep={currentThinking}
          isVisible={showThinking}
          onToggle={() => setShowThinking(!showThinking)}
        />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full p-2 border rounded-lg"
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) {
              sendMessage(e.target.value);
              e.target.value = "";
            }
          }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default InterviewRoom;
```

## Phase 6: Testing and Deployment

### Step 6.1: Create Test Script

```python
# scripts/test_agentic_rag.py
import requests
import json
import time

def test_agentic_rag():
    """Test the agentic RAG system"""

    # Test configuration
    base_url = "http://localhost:5000"
    test_token = "your_test_token_here"

    headers = {
        "Authorization": f"Bearer {test_token}",
        "Content-Type": "application/json"
    }

    # Test cases
    test_queries = [
        {
            "query": "What makes this company a good place to work?",
            "context": "job_interview",
            "enable_thinking": True
        },
        {
            "query": "Describe the team culture",
            "context": "job_interview",
            "enable_thinking": False
        }
    ]

    for i, test_case in enumerate(test_queries):
        print(f"\n--- Test Case {i+1} ---")
        print(f"Query: {test_case['query']}")
        print(f"Thinking Enabled: {test_case['enable_thinking']}")

        start_time = time.time()

        try:
            response = requests.post(
                f"{base_url}/api/rag/agentic-query",
                headers=headers,
                json=test_case
            )

            end_time = time.time()

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Response time: {(end_time - start_time):.2f}s")
                print(f"Answer length: {len(data.get('answer', ''))}")
                print(f"Confidence: {data.get('confidence', 0):.2f}")
                print(f"Enhanced by thinking: {data.get('enhanced_by_thinking', False)}")

                if data.get('thinking_step'):
                    thinking = data['thinking_step']
                    print(f"Thinking time: {thinking.get('thinking_time', 0):.2f}s")
                    print(f"Thinking successful: {thinking.get('thinking_successful', False)}")

            else:
                print(f"❌ Failed with status {response.status_code}")
                print(f"Error: {response.text}")

        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_agentic_rag()
```

### Step 6.2: Deployment Checklist

```bash
# Pre-deployment checklist
□ Fix core RAG mock implementations
□ Test agentic workflow locally
□ Run comprehensive test suite
□ Update database migrations
□ Configure environment variables
□ Test API endpoints
□ Verify frontend integration
□ Performance testing
□ Security review
□ Documentation update
```

## Summary

This implementation guide provides:

1. **Complete thinking module** with context analysis, reasoning generation, and validation
2. **Enhanced RAG supervisor** that orchestrates the agentic workflow
3. **Updated API endpoints** for agentic queries
4. **Frontend components** to display thinking process
5. **Testing framework** to validate functionality

The "think before speak" enhancement will make your interview AI more intelligent, transparent, and trustworthy by showing users the reasoning behind its responses.
