#!/bin/bash
# Run database migrations (ignore errors if tables exist)
cd backend && python -m flask db upgrade || echo "Migration skipped or failed"
# Start the application
gunicorn --bind 0.0.0.0:$PORT backend.app:app