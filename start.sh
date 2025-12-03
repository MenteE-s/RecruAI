#!/bin/bash
cd backend
# Run database migrations (ignore errors if tables exist)
python -m flask db upgrade 2>/dev/null || echo "Migration completed or skipped"
# Start the application
gunicorn --bind 0.0.0.0:$PORT app:app