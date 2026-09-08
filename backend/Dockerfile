# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
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

# Copy application code into /app/backend to support package imports
COPY . /app/backend

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port - driven by .env PORT (default 8000)
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Health check - uses PORT env var
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -c "curl -f http://localhost:${PORT}/api/health || exit 1"

# Run the application with gunicorn - bind port from .env PORT
CMD ["sh", "-c", "gunicorn -w 2 --threads 4 --bind 0.0.0.0:${PORT} backend.app:create_app()"]
