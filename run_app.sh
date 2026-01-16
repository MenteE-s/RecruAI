#!/bin/bash
echo "Starting RecruAI Stack..."

# Build and start containers in the background
docker-compose up -d --build

echo "Waiting for database and backend to be ready..."
# Wait for backend health
sleep 10

echo "Applying database migrations..."
docker exec recruai_backend flask db upgrade

echo ""
echo "==================================================="
echo "SUCCESS: RecruAI is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "==================================================="
