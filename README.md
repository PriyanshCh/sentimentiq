# SentimentIQ

> **Real-time multi-label sentiment & emotion analysis** — DistilBERT · Spring Boot · React · PostgreSQL · Redis

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network: sentimentiq-net          │
│                                                                 │
│  ┌──────────────┐   /api   ┌──────────────┐  HTTP  ┌─────────┐  │
│  │   Frontend   │ ───────► │   Backend    │ ──────►│   ML    │  │
│  │  React/Nginx │          │  Spring Boot │        │ Service │  │
│  │   :3000→80   │    SSE ◄─│    :8080     │        │  :8000  │  │
│  └──────────────┘          └──────┬───────┘        └─────────┘  │
│                                   │                             │
│                         ┌─────────▼──────────┐                  │
│                         │     PostgreSQL     │                  │
│                         │       :5432        │                  │
│                         └────────────────────┘                  │
│                                   │                             │
│                         ┌─────────▼──────────┐                  │
│                         │       Redis        │                  │
│                         │       :6379        │                  │
│                         └────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

| Service        | Technology                         | Port |
|----------------|------------------------------------|------|
| `frontend`     | React 18 + Vite + Nginx            | 3000 |
| `backend`      | Spring Boot 3.5 (Java 21) + JWT    | 8080 |
| `ml-service`   | FastAPI + DistilBERT (PyTorch)     | 8000 |
| `postgres`     | PostgreSQL 16                      | 5432 |
| `redis`        | Redis 7                            | 6379 |

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- 8 GB RAM recommended (DistilBERT loads ~250 MB per-process)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd sentimentiq

# The .env file is already pre-filled with safe defaults.
# Edit it if you need to change ports or credentials.
cp .env .env   # already exists — just review it
```

### 2. (Optional but recommended) Pre-train the ML model

The ML service starts without a model and returns `503` until a model is trained.
To train before launching:

```bash
cd ml-service
pip install -r requirements.txt      # or use your venv
python train.py                      # downloads GoEmotions, fine-tunes DistilBERT
cd ..
```

The trained model lands in `ml-service/models/sentiment_model/` and is mounted into the container via the `ml_models` Docker volume on first run.

> **Tip:** If you already have a trained model, copy it to `ml-service/models/sentiment_model/` before running `docker compose up`. It will be picked up automatically.

### 3. Launch all services

```bash
docker compose up --build
```

First build takes **5–10 minutes** (Maven + pip installs). Subsequent starts are fast.

| URL | What you see |
|-----|-------------|
| http://localhost:3000 | React dashboard |
| http://localhost:8080/actuator/health | Backend health |
| http://localhost:8000/health | ML service health |
| http://localhost:8000/docs | FastAPI Swagger UI |

### 4. Stop & clean up

```bash
# Stop containers (keep volumes)
docker compose down

# Stop and delete ALL data (volumes)
docker compose down -v
```

---

## Environment Variables

All variables live in `.env` at the project root. Override any of them:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `sentimentiq` | Database name |
| `POSTGRES_USER` | `sentimentiq_user` | DB user |
| `POSTGRES_PASSWORD` | `sentimentiq_pass` | DB password |
| `REDIS_PASSWORD` | `redispass` | Redis auth password |
| `JWT_SECRET` | *(hex string)* | HMAC-SHA key for JWT — **change in production** |
| `JWT_EXPIRATION` | `86400000` | Token TTL in ms (24 h) |
| `FRONTEND_PORT` | `3000` | Host port for the React app |
| `BACKEND_PORT` | `8080` | Host port for the Spring Boot API |
| `ML_PORT` | `8000` | Host port for the FastAPI ML service |

---

## Service Startup Order

Docker Compose uses healthchecks to enforce the following dependency chain:

```
postgres (healthy)  ─┐
redis    (healthy)   ├──► backend (healthy) ──► frontend
ml-service (healthy)─┘
```

The backend waits up to **90 seconds** for all three dependencies before starting.

---

## Development Tips

### Run individual services locally (outside Docker)

```bash
# ML service
cd ml-service && uvicorn app:app --reload

# Backend (needs local Postgres + Redis running)
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev
```

### Inspect logs

```bash
docker compose logs -f backend
docker compose logs -f ml-service
docker compose logs -f postgres
```

### Connect to PostgreSQL

```bash
docker exec -it sentimentiq-postgres psql -U sentimentiq_user -d sentimentiq
```

### Redis CLI

```bash
docker exec -it sentimentiq-redis redis-cli -a redispass
```

---

## Project Structure

```
sentimentiq/
├── docker-compose.yml          # ← orchestrates all 5 services
├── .env                        # ← environment variables (git-ignored)
├── infra/
│   └── postgres/
│       └── init.sql            # ← DB bootstrap (extensions, grants)
├── frontend/                   # React + Vite + Nginx
│   ├── DockerFile
│   ├── nginx.conf              # API proxy + SSE streaming config
│   └── src/
├── backend/                    # Spring Boot 3.5 / Java 21
│   ├── DockerFile
│   └── src/main/resources/
│       └── application.properties
├── ml-service/                 # FastAPI + DistilBERT
│   ├── DockerFile
│   ├── app.py                  # inference server
│   ├── train.py                # GoEmotions fine-tuning
│   └── requirements.txt
```
