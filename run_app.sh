#!/bin/bash
echo "============================================"
echo " RecruAI - Hybrid Mode"
echo " Docker: Kafka + Redis"
echo " Local:  PostgreSQL + Backend + Frontend"
echo "============================================"
echo ""

# Start Docker services (Kafka + Redis)
echo "[1/5] Starting Kafka and Redis in Docker..."
docker-compose up -d
echo ""

# Wait for Kafka to be ready
echo "[2/5] Waiting for Kafka to be ready..."
sleep 15

# Create Kafka topic
echo "[3/5] Creating Kafka topic..."
docker exec recruai_kafka kafka-topics --create --topic recruai_events --bootstrap-server localhost:9092 --if-not-exists --partitions 1 --replication-factor 1
echo ""

# Setup and run backend
echo "[4/5] Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py db upgrade
cd ..
echo ""

# Start backend and frontend
echo "[5/5] Starting backend and frontend..."
echo ""
echo "==================================================="
echo " Services running:"
echo "   Kafka:       localhost:9092"
echo "   Redis:       localhost:6379"
echo "   PostgreSQL:  localhost:5432 (local)"
echo "   Backend:     http://localhost:5000"
echo "   Frontend:    http://localhost:3000"
echo "==================================================="
echo ""

# Start backend in background
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "Press Ctrl+C to stop all services..."
wait
