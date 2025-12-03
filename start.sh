#!/bin/bash
# Set Python path to include backend directory
export PYTHONPATH=/app:$PYTHONPATH
# Run database migrations
cd backend && python -m flask db upgrade 2>/dev/null || echo "Migration completed or skipped"
# Start the application
gunicorn --bind 0.0.0.0:$PORT backend.app:app