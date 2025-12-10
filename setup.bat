@echo off
REM RecruAI Environment Setup Script for Windows

echo 🚀 RecruAI Environment Setup
echo =============================

REM Check if we're in the project root
if not exist "docker-compose.yml" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Setup backend environment
echo 📦 Setting up backend environment...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env from template
) else (
    echo ℹ️  backend\.env already exists
)

REM Setup frontend environment
echo 🌐 Setting up frontend environment...
if not exist "frontend\.env" (
    copy frontend\.env.example frontend\.env
    echo ✅ Created frontend\.env from template
) else (
    echo ℹ️  frontend\.env already exists
)

REM Check if Docker is available for database
docker --version >nul 2>&1 && docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Starting PostgreSQL database...
    docker-compose up -d db
    echo ⏳ Waiting for database to be ready...
    timeout /t 5 /nobreak >nul
    echo ✅ Database should be ready
) else (
    echo ⚠️  Docker not available. Please start PostgreSQL manually or install Docker.
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env and frontend\.env with your configuration
echo 2. Run: cd backend ^& python manage.py db upgrade
echo 3. Run: cd frontend ^& npm install ^& npm start
echo 4. In another terminal: cd backend ^& python app.py
echo.
echo For production deployment:
echo - Push to main branch (Railway auto-deploys)
echo - Frontend deploys automatically to Vercel
echo - Environment variables are auto-detected
echo.
pause