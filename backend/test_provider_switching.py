#!/usr/bin/env python3
"""
Test script for AI provider switching functionality
"""

import os
import sys

# Test different provider configurations
test_configs = [
    {'AI_PROVIDER': 'groq', 'EMBEDDING_PROVIDER': 'openai'},
    {'AI_PROVIDER': 'openai', 'EMBEDDING_PROVIDER': 'openai'},
    {'AI_PROVIDER': 'groq', 'EMBEDDING_PROVIDER': 'local'},
]

for i, config in enumerate(test_configs, 1):
    print(f"\n=== Test {i}: {config} ===")

    # Set environment variables
    for key, value in config.items():
        os.environ[key] = value

    try:
        # Clear any cached modules
        modules_to_clear = [k for k in sys.modules.keys() if k.startswith('ai_providers')]
        for mod in modules_to_clear:
            del sys.modules[mod]

        from ai_providers import AIProviderManager

        # Create fresh manager instance
        manager = AIProviderManager()
        manager.initialize()

        provider_info = manager.get_provider_info()
        health = manager.healthcheck()

        print(f"✓ Provider info: {provider_info}")
        print(f"✓ Health check: {health}")

        # Check API keys
        from config import Config
        print(f"✓ API Keys - OpenAI: {'Set' if Config.OPENAI_API_KEY else 'Not set'}, Groq: {'Set' if Config.GROQ_API_KEY else 'Not set'}")

        # Test LLM if healthy
        if health['llm']:
            try:
                response = manager.llm.generate("Say 'Hello from {provider_info['llm_provider']}!'")
                print(f"✓ LLM test: {response[:50]}...")
            except Exception as e:
                print(f"✗ LLM test failed: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()

        # Test embedding if healthy
        if health['embedding']:
            try:
                embedding = manager.embedding.embed("test text")
                print(f"✓ Embedding test: dimension {len(embedding)}")
            except Exception as e:
                print(f"✗ Embedding test failed: {e}")

    except Exception as e:
        print(f"✗ Test {i} failed: {e}")
        import traceback
        traceback.print_exc()

print("\n=== Provider switching test complete ===")