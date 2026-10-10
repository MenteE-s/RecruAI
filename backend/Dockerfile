# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /usr/local
RUN find /usr/local -type d -exec chmod 755 {} + && \
    find /usr/local -type f -exec chmod 644 {} + && \
    chmod +x /usr/local/bin/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=backend.app \
    PYTHONPATH=/app

# Copy application code into /app/backend to support package imports.
#
# Build context is the REPOSITORY ROOT, so both paths are relative to it. This
# changed from `COPY . /app/backend` because the context used to be ./backend,
# which left scripts/ out of the image entirely — including
# grant_subscription.py, which is the only way to make an account a subscriber
# while billing is deferred, and which therefore has to be runnable in the
# deployed container. See .dockerignore at the repo root for what is kept out.
COPY backend/ /app/backend/
COPY scripts/ /app/scripts/

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port - driven by .env PORT (default 8000)
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Health check - uses PORT env var.
#
# X-Forwarded-Proto matters. Flask-Talisman runs with force_https in production
# and redirects any request it believes is plain http, so /api/health answered
# 302 from inside the container. `curl -f` treats 3xx as success, so this check
# reported "healthy" without the app or the database ever answering — a dead
# database looked fine. Sending the header nginx already sets in front of us
# makes this request look like the production one, and the check becomes real:
# verified that it returns 503 when the database is genuinely unreachable.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -c "curl -fsS -H 'X-Forwarded-Proto: https' -o /dev/null http://localhost:${PORT}/api/health || exit 1"

# Run the application with gunicorn - bind port from .env PORT
# NOTE: factory target must be quoted — bare create_app() parens are
# parsed as subshell syntax by sh and the container crash-loops.
CMD ["sh", "-c", "gunicorn -w 2 --threads 4 --bind 0.0.0.0:${PORT} 'backend.app:create_app()'"]
