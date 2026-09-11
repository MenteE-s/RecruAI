# RecruAI — by MenteE

**Asia's best AI job portal — built for Pakistan, expanding across the Gulf.**

RecruAI is an AI-powered hiring and interview platform developed by MenteE. It serves both sides of the hiring process: job seekers and hiring organizations.

## What it does

**For job seekers:**
- Find jobs with AI matching — tailored to your skills, industry, and preferred locations (Pakistan + UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, and the Gulf region)
- Optimize your CV with AI rewrites, ATS scoring, and keyword suggestions
- Practice unlimited mock interviews with realistic AI questions and instant feedback
- Track applications, saved roles, interview schedules, and results in one dashboard
- Build a public shareable profile with analytics
- Manage your billing, notifications, settings, and team access

**For organizations:**
- Post unlimited job listings
- Search and filter candidates by skills and experience
- Send interview invitations directly
- Manage hiring pipelines (applied → screening → interview → offer → hired)
- Assign AI agents to automate screening
- View organization analytics and billing
- Manage team members, billing, and preferences

## Key features (current)
- Job browsing, saved & applied tracking, interview scheduling, practice dashboard, AI agents (individual + org), shareable profiles, resume builder, notifications, analytics, billing, settings
- Organization: profile, team management, job posts, pipeline, candidates, interview management, billing, analytics
- Hybrid mode: PostgreSQL (Docker, port 5433), Kafka (KRaft, localhost:9092), Redis (localhost:6379), backend (port 8000, env-driven via `PORT` in `.env`)

## Claims (aspirational / future growth)
- "25K+ jobs listed / 40K+ CVs optimized / 500+ companies / 7+ countries covered" — these are aspirational growth targets; swap with verified metrics before commercial campaigns.
- Geographic focus is real: the app includes country chips (Pakistan, UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain) and job listings reference real companies and roles across these markets.
- "Best AI job portal" — marketing claim; keep it aspirational until independently verified.

## Technical note
Built with React (frontend), Flask (backend), PostgreSQL (pgvector for embeddings), Kafka (event bus), Redis (cache/session), Docker Compose. Runs on `localhost:3000` (frontend) and `localhost:8000` (backend, set via `.env` `PORT=8000`).
