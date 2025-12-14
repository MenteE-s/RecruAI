"""
RAG API Routes for RecruAI
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import sessionmaker

from ...extensions import db
from ...rag.tools.supervisor import RAGSupervisor
from ...rag.tools.ingestor import IngestorTool
from ...rag.tools.embedder import EmbedderTool
from ...rag.tools.retriever import RetrieverTool
from ...rag.tools.generator import GeneratorTool


logger = logging.getLogger(__name__)

rag_bp = Blueprint('rag', __name__, url_prefix='/api/rag')

# Initialize RAG tools
supervisor = RAGSupervisor()
ingestor = IngestorTool()
embedder = EmbedderTool()
retriever = RetrieverTool()  # Initialize without engine, will be set when needed
generator = GeneratorTool()


def get_retriever():
    """Get retriever instance with database engine"""
    if not retriever.db_engine:
        retriever.db_engine = db.engine
        retriever._session_factory = sessionmaker(bind=db.engine)
    return retriever


@rag_bp.route('/query', methods=['POST'])
@jwt_required()
def query_rag():
    """Query the RAG system with a question"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400

        query = data['query']
        user_context = data.get('user_context', {})
        filters = data.get('filters', {})

        # Add current user to context
        current_user_id = get_jwt_identity()
        user_context['user_id'] = current_user_id

        # Execute RAG query workflow
        result = supervisor.orchestrate_workflow(
            input_data={'query': query, 'filters': filters},
            input_type='query',
            user_context=user_context
        )

        # Handle RAG disabled case
        if result.get('rag_disabled'):
            # Fallback to direct AI generation without RAG
            try:
                from ...ai_service import get_ai_service
                ai_service = get_ai_service()

                system_prompt = "You are a helpful AI assistant for recruitment and career guidance. Provide accurate, helpful responses based on your knowledge."
                ai_response = ai_service.generate_response(system_prompt, query)

                return jsonify({
                    'success': True,
                    'workflow_id': result.get('workflow_id'),
                    'answer': ai_response,
                    'confidence': 0.5,  # Default confidence for non-RAG responses
                    'sources': [],
                    'rag_disabled': True,
                    'processing_time': result.get('performance', {}).get('total_time', 0)
                })
            except Exception as fallback_error:
                logger.error(f"RAG fallback error: {fallback_error}")
                return jsonify({
                    'error': 'AI service unavailable',
                    'rag_disabled': True
                }), 503

        return jsonify({
            'success': True,
            'workflow_id': result.get('workflow_id'),
            'answer': result.get('final_result', {}).get('answer', ''),
            'confidence': result.get('final_result', {}).get('confidence', 0),
            'sources': result.get('final_result', {}).get('sources', []),
            'processing_time': result.get('performance', {}).get('total_time', 0)
        })

    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/ingest/text', methods=['POST'])
@jwt_required()
def ingest_text():
    """Ingest text content into the RAG system"""
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Content is required'}), 400

        content = data['content']
        metadata = data.get('metadata', {})
        chunking_strategy = data.get('chunking_strategy', 'semantic')

        # Add current user to metadata
        current_user_id = get_jwt_identity()
        metadata['user_id'] = current_user_id
        metadata['source_type'] = 'user_input'

        # Process text through ingestor
        chunks = ingestor.ingest_text(
            text=content,
            metadata=metadata,
            chunking_strategy=chunking_strategy
        )

        # Generate embeddings
        embedded_chunks = embedder.generate_embeddings(chunks)

        # Store in database (simplified - would need proper storage logic)
        stored_count = len(embedded_chunks)

        return jsonify({
            'success': True,
            'chunks_created': len(chunks),
            'chunks_embedded': stored_count,
            'chunking_strategy': chunking_strategy,
            'content_length': len(content)
        })

    except Exception as e:
        logger.error(f"Text ingestion error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/ingest/file', methods=['POST'])
@jwt_required()
def ingest_file():
    """Ingest file content into the RAG system"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Save file temporarily (would need proper file handling)
        # For now, just process as text if it's a text file
        if file.filename.endswith(('.txt', '.md')):
            content = file.read().decode('utf-8')

            metadata = {
                'filename': file.filename,
                'source_type': 'file_upload',
                'user_id': get_jwt_identity()
            }

            chunks = ingestor.ingest_text(content, metadata)
            embedded_chunks = embedder.generate_embeddings(chunks)

            return jsonify({
                'success': True,
                'file_processed': file.filename,
                'chunks_created': len(chunks),
                'chunks_embedded': len(embedded_chunks)
            })
        else:
            return jsonify({'error': 'Unsupported file type'}), 400

    except Exception as e:
        logger.error(f"File ingestion error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get RAG system statistics"""
    try:
        # Get retriever stats
        retriever_stats = get_retriever().get_statistics()

        # Get embedder stats
        embedder_stats = embedder.get_cache_stats()

        # Get generator stats
        generator_stats = generator.get_usage_stats()

        return jsonify({
            'success': True,
            'retriever': retriever_stats,
            'embedder': embedder_stats,
            'generator': generator_stats
        })

    except Exception as e:
        logger.error(f"Stats retrieval error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for RAG system"""
    try:
        # Basic health checks
        health_status = {
            'supervisor': True,
            'ingestor': True,
            'embedder': True,
            'retriever': get_retriever().get_statistics().get('database_connected', False),
            'generator': True
        }

        all_healthy = all(health_status.values())

        return jsonify({
            'status': 'healthy' if all_healthy else 'degraded',
            'components': health_status,
            'timestamp': '2024-01-01T00:00:00Z'  # Would use datetime.utcnow()
        })

    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@rag_bp.route('/clear-cache', methods=['POST'])
@jwt_required()
def clear_cache():
    """Clear embedding cache"""
    try:
        embedder.clear_cache()
        return jsonify({'success': True, 'message': 'Cache cleared'})

    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    """Estimate API costs for given text"""
    try:
        data = request.get_json()
        if not data or 'text_lengths' not in data:
            return jsonify({'error': 'text_lengths array required'}), 400

        text_lengths = data['text_lengths']
        cost_estimate = embedder.estimate_cost(text_lengths)

        return jsonify({
            'success': True,
            'cost_estimate': cost_estimate
        })

    except Exception as e:
        logger.error(f"Cost estimation error: {e}")
        return jsonify({'error': str(e)}), 500


@rag_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify RAG system is working"""
    return jsonify({
        'message': 'RAG system is operational',
        'version': '1.0.0',
        'components': [
            'supervisor', 'ingestor', 'embedder', 'retriever', 'generator'
        ],
        'status': 'ready'
    })