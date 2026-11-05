---
name: production-deploy
description: Operational guide and runbook for containerizing, deploying, and managing the AI Resume & ATS Analyzer using multi-stage Docker builds, SQLite volume persistence, and Docker Compose.
---

# Production Deployment & Container Orchestration Runbook

This skill outlines operational procedures for building, deploying, and monitoring the **AI Resume & ATS Analyzer** in production environments.

---

## 1. Container Architecture

The application is packaged as a **self-contained multi-stage Docker container** where the Express server simultaneously serves the compiled Vite React frontend and the backend REST API:

```mermaid
graph TD
    subgraph Build Stage ["Stage 1: Client Builder (node:20-alpine)"]
        SourceUI[Client React Source] --> BuildVite[Vite Production Compilation]
        BuildVite --> DistOutput[Static Assets: /app/client/dist]
    end

    subgraph Runtime Stage ["Stage 2: Server Runner (node:20-alpine)"]
        ServerSrc[Server Node.js Source] --> NativeAddons[Compile better-sqlite3 with python/make]
        DistOutput --> PublicDir[/app/server/public]
        NativeAddons --> ProductionRuntime[Express App on Port 4000]
        PublicDir --> ProductionRuntime
    end

    subgraph Storage ["Persistent Storage"]
        DockerVolume[(Docker Volume: sqlite_data)] <--> DBFile[/app/server/data/resume_analyzer.db]
    end

    ProductionRuntime <--> DBFile
    Client[Browser Client] <-->|Port 4000| ProductionRuntime
```

---

## 2. 1-Click Deployment with Docker Compose

### 2.1 Starting the Production Container
From the repository root:

```bash
# 1. Prepare production environment variables
cp ai-resume-analyzer/server/.env.example .env

# 2. Build and boot container in detached mode
docker compose up -d --build

# 3. Check health and runtime logs
docker compose ps
docker compose logs -f
```

The application is immediately available at `http://localhost:4000` with the API explorer at `http://localhost:4000/api/docs`.

### 2.2 Stopping and Restarting
```bash
# Graceful shutdown (preserves SQLite volume data)
docker compose down

# Rebuild after pulling latest code changes
git pull origin main
docker compose up -d --build
```

---

## 3. Environment Variable Configuration

Configure these variables in `.env` or in your cloud container manager:

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `4000` | Port exposed by Express server. |
| `NODE_ENV` | Yes | `production` | Enables production caching and static asset serving. |
| `GROQ_API_KEY` | Recommended | — | Groq API Key for fast LLaMA 3.3 evaluations. |
| `OPENAI_API_KEY` | Optional | — | OpenAI API Key for GPT-4o structured JSON mode. |
| `ANTHROPIC_API_KEY` | Optional | — | Claude API Key for qualitative analysis. |
| `JWT_SECRET` | Recommended | Random default | Key used to sign user authentication tokens. |
| `DATABASE_PATH` | Optional | `/app/server/data/resume_analyzer.db` | Absolute path to SQLite database. |

---

## 4. SQLite Data Persistence & Backup Procedures

### 4.1 Volume Structure
The SQLite database operates in **WAL (Write-Ahead Logging) mode** and resides in the named Docker volume `ai_resume_sqlite_data` mounted at `/app/server/data`.

### 4.2 Creating an On-Demand Backup
To take a snapshot of the live SQLite database without stopping the container:

```bash
# Create SQLite backup using sqlite3 vacuum into command
docker exec -t ai-resume-analyzer-app node -e "
  const Database = require('better-sqlite3');
  const db = new Database('/app/server/data/resume_analyzer.db');
  db.backup('/app/server/data/backup_' + Date.now() + '.db')
    .then(() => console.log('Backup created successfully.'));
"

# Copy backup to host machine
docker cp ai-resume-analyzer-app:/app/server/data/ ./backups/
```

### 4.3 Restoring from Backup
```bash
docker cp ./backups/resume_analyzer_backup.db ai-resume-analyzer-app:/app/server/data/resume_analyzer.db
docker compose restart
```

---

## 5. Health Checks & Diagnostics

The container defines an automated Docker health check monitoring `/health`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
```

Inspecting container health:
```bash
docker inspect --format='{{json .State.Health}}' ai-resume-analyzer-app
```

---

## 6. Cloud Platform Deployment Recipes

### 6.1 Render / Fly.io / Railway
- Deploy as a Docker service referencing the root `Dockerfile`.
- Attach a **persistent volume** (minimum 1GB) mounted at `/app/server/data`.
- Set `NODE_ENV=production` and your AI provider API keys (`GROQ_API_KEY`, etc.).

### 6.2 AWS ECS / Google Cloud Run
- Push image to AWS ECR or Google Artifact Registry:
  ```bash
  docker build -t gcr.io/your-project/ai-resume-analyzer:latest .
  docker push gcr.io/your-project/ai-resume-analyzer:latest
  ```
- Configure container memory: minimum **512MB RAM** (1GB recommended).
