# MenteE - AI-Powered Solutions Progress Overview

## Company Overview

MenteE is a pioneering company focused on developing cutting-edge AI-powered solutions to revolutionize various industries. As a parent company, MenteE oversees the development and deployment of innovative products designed to enhance productivity, streamline processes, and leverage artificial intelligence for better outcomes. Our portfolio includes RecruAI for recruitment, with upcoming products like cvAI for resume optimization, pptAI for presentation creation, vidAI for video content, and docxbox for document management, among others.

## Products

### RecruAI

**Description:** RecruAI is an advanced AI-powered recruitment platform that connects job seekers with employers through intelligent matching, automated interviews, and comprehensive profile management. It features AI-driven chat interviews, practice sessions, RAG-based document retrieval, and a full-stack application for seamless user experience. Built with Flask backend, React frontend, and PostgreSQL database, RecruAI aims to transform the hiring process with AI assistance.

#### Development Progress

- [x] **Project Setup and Initialization**  
       Established a robust full-stack architecture with Flask backend, React frontend, PostgreSQL database, and Docker support for local development. Includes automated setup scripts (setup.sh for Linux/Mac, setup.bat for Windows) for quick initialization, environment configuration, and database setup.

- [x] **Database Design and Models**  
       Comprehensive data models implemented for users, organizations, job posts, applications, interviews, AI agents, detailed profiles (including sections for education, experience, skills, awards, certifications, etc.), conversation memory, system issues, and token usage tracking. Utilizes Alembic for database migrations with multiple versions for schema evolution.

- [x] **Authentication and User Management**  
       JWT-based authentication system with role-based access control supporting individual users and organizations. Includes secure registration, login, password reset, email verification, and session management with proper CORS and cookie settings for development and production.

- [x] **Core API Development**  
       Extensive RESTful APIs covering: user management and profiles (with detailed sections), organization management and job postings, application tracking, AI-powered interviews with chat messaging and analysis, practice AI agents for interview preparation, RAG system for document ingestion and retrieval, health checks, system issue reporting and statistics, and administrative endpoints.

- [x] **AI Integration**  
       Integrated multiple AI providers (OpenAI, Anthropic, etc.) with switching capabilities for interview simulations, real-time chat responses, document analysis, and practice sessions. Features specialized AI agents for interviews and practice, with conversation memory, analysis reports, and token usage monitoring.

- [x] **Frontend Development**  
       Modern React application built with modern UI libraries, featuring responsive components for authentication flows, comprehensive user profiles, organization dashboards, job search and application interfaces, live AI interview sessions, messaging systems, and administrative panels. Includes file upload capabilities for profiles and documents.

- [x] **Testing and Quality Assurance**  
       Unit tests for AI provider integrations, security testing for authentication and authorization, provider switching functionality, and basic API endpoint validation. Test coverage includes critical security features and AI service reliability.

- [x] **Deployment and CI/CD**  
       Automated deployment pipelines with backend on Railway (auto-deploys from main branch) and frontend on Vercel (auto-deploys from main branch). Supports environment auto-detection for production vs. development, with Docker Compose for local PostgreSQL setup.

- [x] **Documentation**  
       Comprehensive setup guides, troubleshooting documentation, environment configuration details, API references, and deployment instructions. This README serves as the central documentation hub with detailed progress tracking.

- [x] **Security and Compliance**  
       Implemented security utilities for input validation, SQL injection prevention, XSS protection, CORS handling, secure JWT implementation, password hashing, and data encryption. Includes security testing and compliance measures for user data protection.

#### Quick Start (RecruAI)

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
FRONTEND_ORIGIN=https://recru-ai-lime.vercel.app/
API_BASE_URL=https://recruai-production.up.rail.way.app
```

**Frontend (.env)**:

```bash
REACT_APP_API_BASE_URL=https://recruai-production.up.rail.way.app
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

### cvAI

**Description:** cvAI is an AI-driven tool for optimizing and enhancing resumes/CVs, providing intelligent suggestions for content improvement, formatting, keyword optimization, and ATS compatibility to increase job application success rates.

#### Development Progress

- [x] **Project Setup and Initialization**  
       Repository created with basic project structure, initialization scripts, and foundational setup for development.

- [-] **Database Design and Models**  
  In progress - Designing data models for user profiles, resume templates, optimization history, and feedback tracking.

- [-] **Authentication and User Management**  
  In progress - Implementing secure user authentication, account management, and profile handling.

- [-] **Core API Development**  
  In progress - Developing APIs for resume upload, parsing, analysis, suggestion generation, and export functionality.

- [-] **AI Integration**  
  In progress - Integrating AI models for content analysis, keyword extraction, formatting suggestions, and personalized recommendations.

- [-] **Frontend Development**  
  In progress - Building intuitive user interface for resume editing, preview, comparison, and guided optimization.

- [-] **Testing and Quality Assurance**  
  In progress - Setting up comprehensive testing framework including unit tests, integration tests, and user acceptance testing.

- [-] **Deployment and CI/CD**  
  In progress - Configuring automated deployment pipelines and continuous integration for reliable releases.

- [-] **Documentation**  
  In progress - Creating detailed user guides, API documentation, and best practices for resume optimization.

- [-] **Security and Compliance**  
  In progress - Implementing data privacy measures, secure file handling, and compliance with data protection regulations.

### pptAI

**Description:** pptAI leverages AI to assist in creating professional presentations, offering intelligent content generation, slide design suggestions, automated formatting, visual enhancements, and collaborative editing features for impactful slideshows.

#### Development Progress

- [x] **Project Setup and Initialization**  
       Repository created with basic project structure, initialization scripts, and foundational setup for development.

- [-] **Database Design and Models**  
  In progress - Designing data models for presentations, slides, templates, user projects, and collaboration features.

- [-] **Authentication and User Management**  
  In progress - Implementing secure user authentication, account management, and team collaboration support.

- [-] **Core API Development**  
  In progress - Developing APIs for presentation creation, slide management, content generation, and export options.

- [-] **AI Integration**  
  In progress - Integrating AI for content ideation, slide layout suggestions, image generation, and presentation optimization.

- [-] **Frontend Development**  
  In progress - Building interactive user interface for presentation editing, slide design, real-time collaboration, and preview.

- [-] **Testing and Quality Assurance**  
  In progress - Setting up testing framework for UI components, API endpoints, and AI functionality validation.

- [-] **Deployment and CI/CD**  
  In progress - Configuring deployment pipelines and CI/CD processes for seamless updates and releases.

- [-] **Documentation**  
  In progress - Creating user tutorials, API references, and design guidelines for presentation creation.

- [-] **Security and Compliance**  
  In progress - Implementing access controls, data encryption, and compliance with content sharing regulations.

### vidAI

**Description:** vidAI is an AI-powered video creation and editing tool that helps users generate, edit, and enhance video content with automated scripting, voiceover synthesis, visual effects, and intelligent editing suggestions.

#### Development Progress

- [x] **Project Setup and Initialization**  
       Repository created with basic project structure, initialization scripts, and foundational setup for development.

- [-] **Database Design and Models**  
  In progress - Designing data models for video projects, assets, edits, user libraries, and processing queues.

- [-] **Authentication and User Management**  
  In progress - Implementing secure user authentication, account management, and content ownership tracking.

- [-] **Core API Development**  
  In progress - Developing APIs for video upload, processing, editing operations, and export functionality.

- [-] **AI Integration**  
  In progress - Integrating AI for script generation, voice synthesis, scene detection, and automated editing recommendations.

- [-] **Frontend Development**  
  In progress - Building user-friendly interface for video editing, timeline management, effects application, and preview.

- [-] **Testing and Quality Assurance**  
  In progress - Setting up testing for video processing, AI accuracy, and user interface reliability.

- [-] **Deployment and CI/CD**  
  In progress - Configuring deployment for media-heavy applications and CI/CD for frequent updates.

- [-] **Documentation**  
  In progress - Creating video tutorials, API documentation, and user guides for video creation workflows.

- [-] **Security and Compliance**  
  In progress - Implementing content protection, user privacy measures, and compliance with media regulations.

### docxbox

**Description:** docxbox provides AI-enhanced document management and creation capabilities, including intelligent drafting, editing suggestions, collaborative features, version control, and automated formatting for various document types.

#### Development Progress

- [x] **Project Setup and Initialization**  
       Repository created with basic project structure, initialization scripts, and foundational setup for development.

- [-] **Database Design and Models**  
  In progress - Designing data models for documents, versions, collaborators, templates, and metadata.

- [-] **Authentication and User Management**  
  In progress - Implementing secure user authentication, account management, and permission systems.

- [-] **Core API Development**  
  In progress - Developing APIs for document creation, editing, collaboration, and export features.

- [-] **AI Integration**  
  In progress - Integrating AI for content generation, grammar checking, style suggestions, and document analysis.

- [-] **Frontend Development**  
  In progress - Building collaborative document editor interface with real-time editing and commenting.

- [-] **Testing and Quality Assurance**  
  In progress - Setting up testing for document processing, collaboration features, and AI suggestions.

- [-] **Deployment and CI/CD**  
  In progress - Configuring deployment pipelines and CI/CD for document management systems.

- [-] **Documentation**  
  In progress - Creating user manuals, API documentation, and collaboration guidelines.

- [-] **Security and Compliance**  
  In progress - Implementing document encryption, access controls, and compliance with data protection standards.

## Future Plans

MenteE is committed to developing each product incrementally, prioritizing core features and expanding based on user feedback, technological advancements, and market demands. We will update this README regularly to reflect progress on each product. For the latest developments, check individual product repositories or follow our progress updates.

## Contributing

As we develop these products, contributions are welcome. Please refer to individual product repositories for contribution guidelines once they are further along in development.

## License

See LICENCE file for details.
