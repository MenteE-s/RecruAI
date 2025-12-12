#!/bin/bash
# RecruAI Environment Setup Script

echo "🚀 RecruAI Environment Setup"
echo "============================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Setup backend environment
echo "📦 Setting up backend environment..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "ℹ️  backend/.env already exists"
fi

# Setup frontend environment
echo "🌐 Setting up frontend environment..."
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from template"
else
    echo "ℹ️  frontend/.env already exists"
fi

# Check if Docker is available for database
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Starting PostgreSQL database..."
    docker-compose up -d db
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    echo "✅ Database should be ready"
else
    echo "⚠️  Docker not available. Please start PostgreSQL manually or install Docker."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and frontend/.env with your configuration"
echo "2. Run: cd backend && python manage.py db upgrade"
echo "3. Run: cd frontend && npm install && npm start"
echo "4. In another terminal: cd backend && python app.py"
echo ""
echo "For production deployment:"
echo "- Push to main branch (Railway auto-deploys)"
echo "- Frontend deploys automatically to Vercel"
echo "- Environment variables are auto-detected"