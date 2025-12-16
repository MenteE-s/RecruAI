#!/usr/bin/env python3
"""
Test script for AI provider switching
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test different provider configurations
test_configs = [
    {"AI_PROVIDER": "groq", "EMBEDDING_PROVIDER": "openai"},
    {"AI_PROVIDER": "openai", "EMBEDDING_PROVIDER": "openai"},
    {"AI_PROVIDER": "groq", "EMBEDDING_PROVIDER": "local"},
]

for i, config in enumerate(test_configs):
    print(f"\n=== Test {i+1}: {config} ===")

    # Set environment variables
    for key, value in config.items():
        os.environ[key] = value

    # Force reload of config and providers
    import importlib
    modules_to_reload = ['backend.config', 'backend.ai_providers']
    for module in modules_to_reload:
        if module in sys.modules:
            importlib.reload(sys.modules[module])

    from ai_providers import AIProviderManager

    try:
        manager = AIProviderManager()
        manager.initialize()
        info = manager.get_provider_info()
        health = manager.healthcheck()
        print(f"✓ Success: {info}")
        print(f"  Health: {health}")
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()