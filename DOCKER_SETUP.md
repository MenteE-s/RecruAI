# RecruAI Docker Setup Guide

This guide will help team members set up the entire RecruAI stack (Frontend, Backend, Database, Redis, Kafka) using Docker. This ensures everyone has the exact same development environment.

## 📋 Prerequisites

1.  **Docker Desktop**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac/Linux).
2.  **WSL 2 (Windows Users)**: Ensure WSL 2 is installed and Docker is configured to use the WSL 2 engine.
3.  **Git**: To clone the repository.

---

## 🚀 Quick Start (One-Click Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/MenteE-s/RecruAI.git
cd RecruAI
```

### 2. Run the One-Click Script

Instead of running multiple commands, you can use the provided script:

- **Windows**:
  Double-click `run_app.bat` or run:

  ```powershell
  .\run_app.bat
  ```

- **Linux/Mac/WSL**:
  ```bash
  chmod +x run_app.sh
  ./run_app.sh
  ```

This script will:

1. Build and start all Docker containers in the background.
2. Wait for the database to initialize.
3. Automatically run `flask db upgrade` to set up your tables.

### 3. Build & Run Manually (Optional)

If you prefer to run things manually:

```bash
docker-compose up -d --build
docker exec -it recruai_backend flask db upgrade
```

---

## 🛠️ Accessing the Services

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database (Internal)**: `db:5432` (accessible from host at `localhost:5432` with user `recruai` / pass `recruai_pass`)

---

## 📂 Troubleshooting

### 1. Database Connection Issues

If the backend starts before the database is ready, it might fail its healthcheck. Docker Compose is set to retry, but if it gets stuck, run:

```bash
docker-compose restart backend
```

### 2. Checking Logs

To see what's happening inside any service:

```bash
docker-compose logs -f [service_name]
# Example: docker-compose logs -f backend
```

### 3. Resetting Everything

To wipe all data (including the database) and start fresh:

```bash
docker-compose down -v
docker-compose up -d --build
```

---

## 📡 Kafka Events

The system uses Kafka for real-time broadcasts. The topic `recruai_events` is created automatically. You can monitor events using:

```bash
docker exec -it recruai_kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic recruai_events --from-beginning
```
