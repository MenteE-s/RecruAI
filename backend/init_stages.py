#!/usr/bin/env python3
import os
import sys

# Add the backend directory to the path so we can import modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import using the same pattern as app.py
try:
    from .app import create_app
    from .extensions import db
    from .models import Application
except ImportError:
    # Fallback for direct execution
    import importlib
    backend_config = importlib.import_module("backend.config")
    backend_extensions = importlib.import_module("backend.extensions")
    backend_models = importlib.import_module("backend.models")
    backend_app = importlib.import_module("backend.app")

    create_app = backend_app.create_app
    db = backend_extensions.db
    Application = backend_models.Application

app = create_app()

with app.app_context():
    # Get all applications that don't have a pipeline stage set
    apps = Application.query.filter(
        db.or_(
            Application.pipeline_stage.is_(None),
            Application.pipeline_stage == ""
        )
    ).all()

    print(f"Found {len(apps)} applications without pipeline stages")

    for app in apps:
        app.pipeline_stage = "applied"
        print(f"Setting pipeline stage to 'applied' for application {app.id}")

    # Commit all changes
    db.session.commit()
    print(f"Successfully initialized {len(apps)} applications with 'applied' stage")