#!/bin/bash
cd backend
# Run database migrations (ignore errors if tables exist)
python -m flask db upgrade || echo "Migration skipped or failed"
# Start the application
gunicorn --bind 0.0.0.0:$PORT app:app