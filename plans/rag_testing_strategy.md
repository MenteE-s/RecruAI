# RAG System Testing Strategy

## Overview

This document outlines a comprehensive testing strategy for the RecruAI RAG system, including both current functionality validation and agentic "think before speak" feature testing.

## Testing Objectives

1. **Validate Core RAG Functionality**

   - Ensure end-to-end pipeline works correctly
   - Verify data ingestion, embedding, retrieval, and generation
   - Test provider-agnostic AI system

2. **Test Agentic Capabilities**

   - Validate thinking step quality and relevance
   - Test reasoning generation and validation
   - Measure improvement in response quality

3. **Performance and Reliability**
   - Measure response times and throughput
   - Test system under load
   - Validate error handling and recovery

## Test Environment Setup

### Prerequisites

```bash
# Required environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_recruai"
export OPENAI_API_KEY="test_key"
export GROQ_API_KEY="test_key"
export AI_PROVIDER="groq"
export EMBEDDING_PROVIDER="huggingface"
export RAG_ENABLED="1"
```

### Test Database

- Separate test database instance
- Fresh migrations for each test run
- Sample data for testing scenarios

### Mock Services

- Mock AI providers for unit tests
- Mock embedding service for consistent results
- Mock file storage for ingestion tests

## Unit Testing

### 1. EmbedderTool Tests

```python
# test_embedder.py
import pytest
from backend.rag.tools.embedder import EmbedderTool

class TestEmbedderTool:
    def test_generate_embeddings_single_chunk(self):
        """Test embedding generation for single text chunk"""
        embedder = EmbedderTool()
        chunks = [{'content': 'test content', 'chunk_index': 0}]

        result = embedder.generate_embeddings(chunks)

        assert len(result) == 1
        assert 'embedding' in result[0]
        assert len(result[0]['embedding']) > 0

    def test_generate_embeddings_batch(self):
        """Test embedding generation for multiple chunks"""
        embedder = EmbedderTool()
        chunks = [
            {'content': 'first content', 'chunk_index': 0},
            {'content': 'second content', 'chunk_index': 1}
        ]

        result = embedder.generate_embeddings(chunks)

        assert len(result) == 2
        assert all('embedding' in chunk for chunk in result)

    def test_embedding_caching(self):
        """Test that identical content uses cached embeddings"""
        embedder = EmbedderTool()
        chunks = [
            {'content': 'same content', 'chunk_index': 0},
            {'content': 'same content', 'chunk_index': 1}
        ]

        result = embedder.generate_embeddings(chunks, use_cache=True)

        # Second chunk should use cache
        assert result[1].get('embedding_from_cache', False)

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        embedder = EmbedderTool()
        # Test rate limiter behavior
        assert embedder._rate_limiter.can_make_call()
```

### 2. RetrieverTool Tests

```python
# test_retriever.py
import pytest
from backend.rag.tools.retriever import RetrieverTool

class TestRetrieverTool:
    def test_retrieve_similar_chunks(self):
        """Test similarity search functionality"""
        retriever = RetrieverTool(test_db_engine)
        query_embedding = [0.1] * 1536  # Mock embedding

        results = retriever.retrieve_similar(
            query_embedding=query_embedding,
            top_k=5,
            similarity_threshold=0.7
        )

        assert isinstance(results, list)
        assert len(results) <= 5
        for result in results:
            assert 'similarity_score' in result
            assert result['similarity_score'] >= 0.7

    def test_retrieve_by_text(self):
        """Test text-based retrieval"""
        retriever = RetrieverTool(test_db_engine)
        embedder = EmbedderTool()

        results = retriever.retrieve_by_text(
            query_text="test query",
            embedder_tool=embedder,
            top_k=3
        )

        assert isinstance(results, list)
        assert len(results) <= 3

    def test_metadata_filtering(self):
        """Test filtering by metadata"""
        retriever = RetrieverTool(test_db_engine)
        filters = {'source_type': 'resume', 'user_id': 'test_user'}

        results = retriever.search_by_metadata(filters)

        assert isinstance(results, list)
        for result in results:
            assert result['source_type'] == 'resume'
            assert result['user_id'] == 'test_user'
```

### 3. IngestorTool Tests

```python
# test_ingestor.py
import pytest
from backend.rag.tools.ingestor import IngestorTool

class TestIngestorTool:
    def test_text_ingestion_semantic_chunking(self):
        """Test text ingestion with semantic chunking"""
        ingestor = IngestorTool()
        text = "This is a test document. It has multiple sentences. Each sentence should be handled properly."

        chunks = ingestor.ingest_text(
            text=text,
            metadata={'source': 'test'},
            chunking_strategy='semantic'
        )

        assert len(chunks) > 0
        for chunk in chunks:
            assert 'content' in chunk
            assert 'chunk_index' in chunk
            assert 'word_count' in chunk
            assert len(chunk['content']) > 0

    def test_fixed_size_chunking(self):
        """Test fixed-size chunking strategy"""
        ingestor = IngestorTool()
        text = "A" * 2000  # Long text

        chunks = ingestor.ingest_text(
            text=text,
            chunking_strategy='fixed'
        )

        assert len(chunks) > 1
        # Check overlap is working
        for i in range(1, len(chunks)):
            # Should have some overlap with previous chunk
            assert len(chunks[i]['content']) > 0

    def test_pdf_ingestion(self):
        """Test PDF file ingestion"""
        ingestor = IngestorTool()

        # Mock PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf') as tmp:
            # Create mock PDF content
            tmp.write(b"mock pdf content")
            tmp.flush()

            chunks = ingestor.ingest_pdf(tmp.name)

            assert len(chunks) > 0
            assert all('file_name' in chunk['metadata'] for chunk in chunks)
```

### 4. GeneratorTool Tests

```python
# test_generator.py
import pytest
from backend.rag.tools.generator import GeneratorTool

class TestGeneratorTool:
    def test_generate_answer_with_context(self):
        """Test answer generation with context"""
        generator = GeneratorTool()
        query = "What is the company culture like?"
        context_chunks = [
            {
                'content': 'Our company values collaboration and innovation.',
                'similarity_score': 0.9,
                'source_type': 'company_doc'
            }
        ]

        result = generator.generate_answer(
            query=query,
            context_chunks=context_chunks
        )

        assert 'answer' in result
        assert 'confidence' in result
        assert 'sources' in result
        assert len(result['answer']) > 0
        assert 0 <= result['confidence'] <= 1

    def test_interview_mode_generation(self):
        """Test generation in interview context"""
        generator = GeneratorTool()
        query = "Tell me about your experience with Python"
        context_chunks = [
            {
                'content': 'Interview Context: Senior Python Developer position',
                'similarity_score': 0.95
            }
        ]
        user_context = {
            'context': 'job_interview',
            'interview_context': 'Senior Python Developer role'
        }

        result = generator.generate_answer(
            query=query,
            context_chunks=context_chunks,
            user_context=user_context
        )

        assert 'answer' in result
        # Should contain interview-specific content
        assert any(keyword in result['answer'].lower() for keyword in ['experience', 'python', 'role'])
```

## Integration Testing

### 1. End-to-End RAG Pipeline Test

```python
# test_rag_integration.py
import pytest
from backend.rag.tools.supervisor import RAGSupervisor

class TestRAGIntegration:
    def test_complete_ingestion_workflow(self):
        """Test complete document ingestion workflow"""
        supervisor = RAGSupervisor()

        # Test text ingestion
        result = supervisor.orchestrate_workflow(
            input_data="This is a test document for ingestion.",
            input_type='text',
            metadata={'source_type': 'test_doc'}
        )

        assert result['success'] == True
        assert 'final_result' in result
        assert len(result['processing_steps']) > 0

    def test_complete_query_workflow(self):
        """Test complete query workflow"""
        supervisor = RAGSupervisor()

        # First ingest some test data
        supervisor.orchestrate_workflow(
            input_data="Python is a programming language used for web development.",
            input_type='text',
            metadata={'source_type': 'test_doc'}
        )

        # Then query
        result = supervisor.orchestrate_workflow(
            input_data={'query': 'What is Python used for?'},
            input_type='query'
        )

        assert result['success'] == True
        assert 'final_result' in result
        assert 'answer' in result['final_result']
        assert len(result['final_result']['answer']) > 0
```

### 2. API Endpoint Tests

```python
# test_rag_api.py
import pytest
import json
from backend.app import create_app

class TestRAGAPI:
    def test_query_endpoint(self, client):
        """Test RAG query API endpoint"""
        response = client.post('/api/rag/query',
            json={'query': 'Test query'},
            headers={'Authorization': 'Bearer test_token'}
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'answer' in data
        assert 'confidence' in data
        assert 'sources' in data

    def test_ingest_text_endpoint(self, client):
        """Test text ingestion API endpoint"""
        response = client.post('/api/rag/ingest/text',
            json={
                'content': 'Test document content',
                'metadata': {'source': 'test'}
            },
            headers={'Authorization': 'Bearer test_token'}
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] == True
        assert 'chunks_created' in data

    def test_health_check_endpoint(self, client):
        """Test health check API endpoint"""
        response = client.get('/api/rag/health')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'status' in data
        assert 'components' in data
```

## Agentic Feature Testing

### 1. Thinking Module Tests

```python
# test_thinking_module.py
import pytest
from backend.rag.tools.thinking import ThinkingModule

class TestThinkingModule:
    def test_context_analysis(self):
        """Test context analysis functionality"""
        thinking = ThinkingModule()
        query = "What are the company's values?"
        context_chunks = [
            {'content': 'Our company values innovation and teamwork.', 'similarity_score': 0.9}
        ]

        analysis = thinking.analyze_context(query, context_chunks)

        assert 'relevance_score' in analysis
        assert 'identified_gaps' in analysis
        assert 'key_information' in analysis

    def test_reasoning_generation(self):
        """Test reasoning generation"""
        thinking = ThinkingModule()
        query = "Describe the work environment"
        context = [{'content': 'Collaborative and fast-paced environment.'}]
        analysis = {'relevance_score': 0.9, 'key_information': ['collaborative', 'fast-paced']}

        reasoning = thinking.generate_reasoning(query, context, analysis)

        assert 'thought_process' in reasoning
        assert 'response_strategy' in reasoning
        assert 'confidence_assessment' in reasoning

    def test_reasoning_validation(self):
        """Test reasoning quality validation"""
        thinking = ThinkingModule()
        reasoning = {
            'thought_process': 'The context mentions collaborative environment...',
            'response_strategy': 'Focus on collaboration aspects...',
            'confidence_assessment': 0.8
        }

        validation = thinking.validate_reasoning(reasoning)

        assert 'is_valid' in validation
        assert 'quality_score' in validation
        assert 'issues' in validation
```

### 2. Agentic Workflow Tests

```python
# test_agentic_workflow.py
import pytest
from backend.rag.tools.agentic_supervisor import AgenticRAGSupervisor

class TestAgenticWorkflow:
    def test_think_before_speak_workflow(self):
        """Test complete think-before-speak workflow"""
        supervisor = AgenticRAGSupervisor()

        result = supervisor.orchestrate_agentic_workflow(
            query="What makes this company a good place to work?",
            context='job_interview'
        )

        assert 'thinking_step' in result
        assert 'reasoning' in result['thinking_step']
        assert 'validation' in result['thinking_step']
        assert 'final_response' in result
        assert 'response' in result['final_response']

    def test_reasoning_quality_improvement(self):
        """Test that reasoning improves response quality"""
        supervisor = AgenticRAGSupervisor()

        # Compare standard RAG vs agentic RAG
        standard_result = supervisor.orchestrate_workflow(
            input_data={'query': 'Complex question about company culture'},
            input_type='query'
        )

        agentic_result = supervisor.orchestrate_agentic_workflow(
            query='Complex question about company culture',
            context='job_interview'
        )

        # Agentic should have higher confidence and more detailed response
        assert agentic_result['final_response']['confidence'] >= standard_result['final_result']['confidence']
        assert len(agentic_result['final_response']['response']) >= len(standard_result['final_result']['answer'])
```

## Performance Testing

### 1. Load Testing

```python
# test_performance.py
import pytest
import time
import concurrent.futures

class TestPerformance:
    def test_query_response_time(self):
        """Test that queries complete within acceptable time"""
        supervisor = RAGSupervisor()

        start_time = time.time()
        result = supervisor.orchestrate_workflow(
            input_data={'query': 'Test query for performance'},
            input_type='query'
        )
        end_time = time.time()

        response_time = end_time - start_time
        assert response_time < 3.0  # Should complete within 3 seconds
        assert result['success'] == True

    def test_concurrent_requests(self):
        """Test system under concurrent load"""
        supervisor = RAGSupervisor()

        def make_request():
            return supervisor.orchestrate_workflow(
                input_data={'query': 'Concurrent test query'},
                input_type='query'
            )

        # Run 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]

        # All requests should succeed
        assert all(result['success'] for result in results)

    def test_thinking_step_overhead(self):
        """Test performance impact of thinking step"""
        agentic_supervisor = AgenticRAGSupervisor()
        standard_supervisor = RAGSupervisor()

        # Measure standard RAG time
        start = time.time()
        standard_supervisor.orchestrate_workflow(
            input_data={'query': 'Performance test query'},
            input_type='query'
        )
        standard_time = time.time() - start

        # Measure agentic RAG time
        start = time.time()
        agentic_supervisor.orchestrate_agentic_workflow(
            query='Performance test query',
            context='job_interview'
        )
        agentic_time = time.time() - start

        # Thinking step should add less than 1 second overhead
        overhead = agentic_time - standard_time
        assert overhead < 1.0
```

## Test Data Management

### Test Documents

```python
# test_data.py
TEST_DOCUMENTS = {
    'company_culture': {
        'content': 'Our company fosters a collaborative environment where innovation thrives. We value teamwork, continuous learning, and work-life balance.',
        'metadata': {'source_type': 'company_doc', 'category': 'culture'}
    },
    'job_description': {
        'content': 'Senior Python Developer position requiring 5+ years experience, strong knowledge of Django, and excellent problem-solving skills.',
        'metadata': {'source_type': 'job_post', 'category': 'requirements'}
    },
    'interview_guide': {
        'content': 'When conducting technical interviews, focus on practical problem-solving, code quality, and communication skills.',
        'metadata': {'source_type': 'interview_guide', 'category': 'process'}
    }
}

TEST_QUERIES = [
    'What is the company culture like?',
    'What are the requirements for the Python position?',
    'How should I conduct technical interviews?',
    'What benefits does the company offer?',
    'What technologies are used?'
]
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/rag_tests.yml
name: RAG System Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-rag:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_recruai
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run unit tests
        run: |
          cd backend
          pytest tests/unit/rag/ -v --cov=rag

      - name: Run integration tests
        run: |
          cd backend
          pytest tests/integration/rag/ -v

      - name: Run performance tests
        run: |
          cd backend
          pytest tests/performance/rag/ -v

      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Test Execution

### Running Tests Locally

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-mock pytest-asyncio

# Run unit tests
pytest tests/unit/rag/ -v --cov=rag

# Run integration tests
pytest tests/integration/rag/ -v

# Run performance tests
pytest tests/performance/rag/ -v

# Run all RAG tests
pytest tests/rag/ -v --cov=rag --cov-report=html
```

### Test Reports

- Coverage reports generated in HTML format
- Performance metrics saved to JSON
- Test results uploaded to CI system

## Success Criteria

### Functional Criteria

- All unit tests pass (>90% coverage)
- All integration tests pass
- API endpoints return correct responses
- Agentic features work as designed

### Performance Criteria

- Query response time < 3 seconds
- Thinking step overhead < 1 second
- System handles 10+ concurrent requests
- 99% uptime under normal load

### Quality Criteria

- Reasoning quality score > 0.8
- Response improvement measurable
- User acceptance testing passes
- No critical bugs in production

This comprehensive testing strategy ensures the RAG system works correctly and the agentic features provide real value to users.
