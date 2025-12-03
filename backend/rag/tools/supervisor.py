"""
RAG Supervisor/Orchestrator Tool
Directs workflow and decides which tools to call based on input type
"""

import logging
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

from ..config import RAGConfig


logger = logging.getLogger(__name__)


class RAGSupervisor:
    """
    Supervisor tool that orchestrates the RAG workflow.
    Routes inputs to appropriate tools and manages the overall process.
    """

    def __init__(self):
        self.config = RAGConfig()
        self._activity_log = []

    def route_input(self, input_type: str, metadata: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Route input to appropriate processing tools based on type.

        Args:
            input_type: Type of input ('text', 'pdf', 'audio', 'video', 'image', 'query')
            metadata: Additional metadata about the input

        Returns:
            List of tool names to use for processing
        """
        tools = []

        # Route based on input type
        if input_type == 'text':
            tools = ['ingestor', 'embedder']
        elif input_type == 'pdf':
            tools = ['ingestor', 'embedder']  # Ingestor handles PDF parsing
        elif input_type == 'audio':
            tools = ['transcriber', 'ingestor', 'embedder']
        elif input_type == 'video':
            tools = ['transcriber', 'ingestor', 'embedder']  # Extract audio first
        elif input_type == 'image':
            tools = ['ocr', 'ingestor', 'embedder']
        elif input_type == 'query':
            tools = ['retriever', 'generator']
        elif input_type == 'batch':
            tools = ['ingestor', 'embedder']  # For batch processing
        else:
            logger.warning(f"Unknown input type: {input_type}")
            tools = ['ingestor', 'embedder']  # Default fallback

        # Add safety and metadata tools if needed
        if metadata and metadata.get('needs_safety_check', False):
            tools.append('safety')

        if metadata and metadata.get('needs_metadata_enrichment', True):
            tools.insert(0, 'metadata_manager')  # Add at beginning

        return tools

    def orchestrate_workflow(
        self,
        input_data: Union[str, Dict[str, Any]],
        input_type: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Orchestrate the complete RAG workflow from input to output.

        Args:
            input_data: The actual input data (text, file path, etc.)
            input_type: Type of input
            metadata: Additional metadata
            user_context: User-specific context (permissions, preferences, etc.)

        Returns:
            Dictionary containing results and metadata
        """
        start_time = time.time()
        workflow_id = f"rag_{int(time.time())}_{hash(str(input_data)) % 10000}"

        try:
            # Log workflow start
            self.log_activity(
                workflow_id,
                'workflow_start',
                {'input_type': input_type, 'metadata': metadata},
                None
            )

            # Route to appropriate tools
            tools_needed = self.route_input(input_type, metadata)

            # Initialize result container
            result = {
                'workflow_id': workflow_id,
                'input_type': input_type,
                'tools_used': tools_needed,
                'processing_steps': [],
                'final_result': None,
                'metadata': metadata or {},
                'errors': [],
                'performance': {}
            }

            # Execute workflow based on input type
            if input_type in ['text', 'pdf', 'audio', 'video', 'image']:
                # Ingestion workflow
                result = self._execute_ingestion_workflow(
                    input_data, input_type, tools_needed, result, user_context
                )
            elif input_type == 'query':
                # Query workflow
                result = self._execute_query_workflow(
                    input_data, tools_needed, result, user_context
                )
            elif input_type == 'batch':
                # Batch processing workflow
                result = self._execute_batch_workflow(
                    input_data, tools_needed, result, user_context
                )
            else:
                raise ValueError(f"Unsupported input type: {input_type}")

            # Calculate performance metrics
            end_time = time.time()
            result['performance'] = {
                'total_time': end_time - start_time,
                'tools_executed': len(result['processing_steps']),
                'success': len(result['errors']) == 0
            }

            # Log workflow completion
            self.log_activity(
                workflow_id,
                'workflow_complete',
                result['performance'],
                result.get('final_result')
            )

            return result

        except Exception as e:
            # Log error
            self.log_activity(
                workflow_id,
                'workflow_error',
                {'error': str(e), 'input_type': input_type},
                None
            )

            logger.error(f"Workflow {workflow_id} failed: {e}")
            return {
                'workflow_id': workflow_id,
                'error': str(e),
                'input_type': input_type,
                'success': False,
                'performance': {'total_time': time.time() - start_time}
            }

    def _execute_ingestion_workflow(
        self,
        input_data: Union[str, Dict[str, Any]],
        input_type: str,
        tools_needed: List[str],
        result: Dict[str, Any],
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute ingestion workflow for documents and media"""
        current_data = input_data

        for tool_name in tools_needed:
            try:
                step_result = self._execute_tool(tool_name, current_data, {
                    'input_type': input_type,
                    'user_context': user_context,
                    'workflow_metadata': result['metadata']
                })

                result['processing_steps'].append({
                    'tool': tool_name,
                    'success': step_result.get('success', True),
                    'timestamp': datetime.utcnow().isoformat(),
                    'output_summary': self._summarize_step_output(step_result)
                })

                # Pass output to next tool if successful
                if step_result.get('success', True) and 'output' in step_result:
                    current_data = step_result['output']

            except Exception as e:
                error_msg = f"Tool {tool_name} failed: {str(e)}"
                result['errors'].append(error_msg)
                logger.error(error_msg)
                break

        result['final_result'] = current_data
        return result

    def _execute_query_workflow(
        self,
        input_data: Union[str, Dict[str, Any]],
        tools_needed: List[str],
        result: Dict[str, Any],
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute query workflow for RAG retrieval and generation"""
        query = input_data if isinstance(input_data, str) else input_data.get('query', '')

        # Step 1: Retrieve relevant chunks
        retrieval_result = self._execute_tool('retriever', {
            'query': query,
            'user_context': user_context,
            'filters': input_data.get('filters', {}) if isinstance(input_data, dict) else {}
        }, {'workflow_metadata': result['metadata']})

        result['processing_steps'].append({
            'tool': 'retriever',
            'success': retrieval_result.get('success', True),
            'timestamp': datetime.utcnow().isoformat(),
            'chunks_retrieved': len(retrieval_result.get('chunks', []))
        })

        if not retrieval_result.get('success', True):
            result['errors'].append("Retrieval failed")
            return result

        # Step 2: Generate answer using retrieved context
        context_chunks = retrieval_result.get('chunks', [])
        generation_result = self._execute_tool('generator', {
            'query': query,
            'context': context_chunks,
            'user_context': user_context
        }, {'workflow_metadata': result['metadata']})

        result['processing_steps'].append({
            'tool': 'generator',
            'success': generation_result.get('success', True),
            'timestamp': datetime.utcnow().isoformat(),
            'answer_length': len(generation_result.get('answer', ''))
        })

        if generation_result.get('success', True):
            result['final_result'] = {
                'answer': generation_result.get('answer', ''),
                'sources': context_chunks,
                'confidence': generation_result.get('confidence', 0.0)
            }
        else:
            result['errors'].append("Generation failed")

        return result

    def _execute_batch_workflow(
        self,
        input_data: Union[str, Dict[str, Any]],
        tools_needed: List[str],
        result: Dict[str, Any],
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute batch processing workflow"""
        # Implementation for batch processing multiple documents
        batch_items = input_data if isinstance(input_data, list) else [input_data]
        results = []

        for item in batch_items:
            item_result = self.orchestrate_workflow(
                item, 'text', result['metadata'], user_context
            )
            results.append(item_result)

        result['final_result'] = {
            'batch_size': len(batch_items),
            'successful': sum(1 for r in results if r.get('success', False)),
            'results': results
        }

        return result

    def _execute_tool(self, tool_name: str, input_data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific tool with given input and context"""
        # This is a placeholder - actual tool execution will be implemented
        # when individual tools are created
        logger.info(f"Executing tool: {tool_name} with input type: {type(input_data)}")

        # Mock successful execution for now
        return {
            'success': True,
            'output': input_data,
            'tool': tool_name,
            'execution_time': 0.1
        }

    def _summarize_step_output(self, step_result: Dict[str, Any]) -> str:
        """Create a summary of step output for logging"""
        if not step_result.get('success', False):
            return "Failed"

        output = step_result.get('output', '')
        if isinstance(output, str):
            return f"Processed {len(output)} characters"
        elif isinstance(output, list):
            return f"Generated {len(output)} items"
        elif isinstance(output, dict):
            return f"Generated {len(output)} keys"
        else:
            return f"Output type: {type(output)}"

    def log_activity(
        self,
        workflow_id: str,
        activity_type: str,
        input_data: Any,
        output_data: Any
    ) -> None:
        """
        Log activity for monitoring and debugging.

        Args:
            workflow_id: Unique identifier for the workflow
            activity_type: Type of activity ('workflow_start', 'tool_execution', etc.)
            input_data: Input data for the activity
            output_data: Output/result data
        """
        activity = {
            'workflow_id': workflow_id,
            'activity_type': activity_type,
            'timestamp': datetime.utcnow().isoformat(),
            'input_summary': self._summarize_data(input_data),
            'output_summary': self._summarize_data(output_data)
        }

        self._activity_log.append(activity)

        # Keep only last 1000 activities to prevent memory issues
        if len(self._activity_log) > 1000:
            self._activity_log = self._activity_log[-1000:]

        logger.info(f"Activity logged: {workflow_id} - {activity_type}")

    def _summarize_data(self, data: Any) -> str:
        """Create a summary string for logging purposes"""
        if data is None:
            return "None"
        elif isinstance(data, str):
            return f"String({len(data)} chars)"
        elif isinstance(data, (list, tuple)):
            return f"List({len(data)} items)"
        elif isinstance(data, dict):
            return f"Dict({len(data)} keys)"
        else:
            return f"{type(data).__name__}"

    def get_activity_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent activity log entries"""
        return self._activity_log[-limit:]

    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific workflow"""
        for activity in reversed(self._activity_log):
            if activity['workflow_id'] == workflow_id:
                return activity
        return None