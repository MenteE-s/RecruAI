# (RecruAI) README

This repository contains the RecruAI backend and frontend.

## Quick Start

### Automated Setup (Recommended)

**Linux/Mac:**

```bash
./setup.sh
```

**Windows:**

```cmd
setup.bat
```

This will:

- Create environment files from templates
- Start PostgreSQL database with Docker
- Provide next steps for running the application

### Manual Setup

## Environment Configuration

The application automatically detects whether it's running in local development or production:

### Local Development

- **Backend**: Runs on `http://localhost:5000`
- **Frontend**: Runs on `http://localhost:3000`
- **Database**: PostgreSQL on localhost
- **CORS**: Allows `http://localhost:3000`
- **JWT Cookies**: Insecure (for development)

### Production

- **Backend**: Railway app URL (auto-detected)
- **Frontend**: Vercel app URL (auto-detected)
- **Database**: Railway PostgreSQL
- **CORS**: Allows Vercel domain
- **JWT Cookies**: Secure with proper SameSite settings

### Manual Configuration

If you need to override the auto-detection:

**Backend (.env)**:

```bash
# Production override
PRODUCTION=1
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
API_BASE_URL=https://your-railway-app.railway.app
```

**Frontend (.env)**:

```bash
REACT_APP_API_BASE_URL=https://your-railway-app.railway.app
```

## Local Development Setup

For local development we prefer PostgreSQL. You can start a Postgres dev instance via the included Docker Compose and set `DATABASE_URL` accordingly.

### Prerequisites

- Python 3.8+
- Node.js 16+
- Docker (optional, for PostgreSQL)
- PostgreSQL (if not using Docker)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py db upgrade
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Setup

```bash
# Using Docker (recommended)
docker-compose up -d db

# Or set DATABASE_URL manually
export DATABASE_URL="postgresql://user:password@localhost:5432/recruai"
```

## Production Deployment

### Backend (Railway)

- Auto-deploys from main branch
- Environment variables auto-detected
- Database migrations run automatically

### Frontend (Vercel)

- Auto-deploys from main branch
- Uses `REACT_APP_API_BASE_URL` for API calls

### Environment Variables

**Required for Production:**

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT signing key

**Optional:**

- `PRODUCTION`: Force production mode (1)
- `FRONTEND_ORIGIN`: Override CORS origin
- `API_BASE_URL`: Override API base URL

## Troubleshooting

### Common Issues

**500 Error on User Profile:**

- Run database migrations: `cd backend && python manage.py db upgrade`
- Check database connection and schema

**CORS Errors:**

- Verify `FRONTEND_ORIGIN` in production
- Check environment auto-detection

**Environment Detection Issues:**

- Set `PRODUCTION=1` to force production mode
- Check Railway/Vercel environment variables

### Database Issues

```bash
# Reset database
cd backend
python manage.py db downgrade base
python manage.py db upgrade

# Check migration status
python manage.py db current
```

### Logs

- Backend: Check Railway logs
- Frontend: Check Vercel deployment logs
- Database: Check Railway database logs
