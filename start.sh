#!/bin/bash
cd backend
# Run database migrations
flask db upgrade
# Start the application
gunicorn --bind 0.0.0.0:$PORT app:app