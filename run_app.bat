@echo off
echo ============================================
echo  RecruAI - Hybrid Mode
echo  Docker: Kafka + Redis
echo  Local:  PostgreSQL + Backend + Frontend
echo ============================================
echo.

:: Start Docker services (Kafka + Redis)
echo [1/5] Starting Kafka and Redis in Docker...
docker-compose up -d
echo.

:: Wait for Kafka to be ready
echo [2/5] Waiting for Kafka to be ready...
timeout /t 15 /nobreak > nul

:: Create Kafka topic
echo [3/5] Creating Kafka topic...
docker exec recruai_kafka kafka-topics --create --topic recruai_events --bootstrap-server localhost:9092 --if-not-exists --partitions 1 --replication-factor 1
echo.

:: Setup and run backend
echo [4/5] Setting up backend...
cd backend
if not exist "venv" (
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

:: Apply database migrations
echo Applying database migrations...
python manage.py db upgrade
cd ..
echo.

:: Start backend and frontend
echo [5/5] Starting backend and frontend...
echo.
echo ===================================================
echo  Services running:
echo    Kafka:       localhost:9092
echo    Redis:       localhost:6379
echo    PostgreSQL:  localhost:5432 (local)
echo    Backend:     http://localhost:5000
echo    Frontend:    http://localhost:3000
echo ===================================================
echo.

:: Start backend in background
start "RecruAI Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

:: Start frontend
start "RecruAI Frontend" cmd /k "cd frontend && npm start"

echo Backend and Frontend starting in new windows...
pause
