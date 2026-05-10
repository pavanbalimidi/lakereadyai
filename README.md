# AI Readiness Scanner

Enterprise-grade web product that connects to **Databricks (Unity Catalog)**, **Snowflake**, or a built-in **Mock** source, walks the catalog, and generates an **AI Readiness Report** with a 0–100 score, prioritized findings, and a roadmap to unlock RAG, agents, and analytics.

This is **Phase 1** of the 5-phase product spec in [`cluade.md`](./cluade.md). The architecture is intentionally extensible so Phases 2–5 (auto entity builder, RAG accelerator, AI copilot, governance platform) plug in via the connector and analyzer interfaces.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Next.js 15     │ →   │  FastAPI        │ →   │  Connector layer │
│  App Router     │     │  /v1 REST API   │     │  Databricks      │
│  Tailwind v4    │     │  + JWT auth     │     │  Snowflake       │
│  shadcn/Tremor  │     │  + Auth.js SSO  │     │  Mock (demo)     │
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
   Auth.js (email,        Postgres + Celery       Anthropic Claude
   Entra, Okta)           (scan jobs)             (AI analyzer)
```

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Tremor · TanStack Query · framer-motion |
| Auth | Auth.js (NextAuth v5): Credentials + Microsoft Entra + Okta |
| Backend | FastAPI · Pydantic v2 · SQLAlchemy 2 · Celery · structlog |
| Storage | Postgres 16 · Redis 7 |
| AI | Anthropic Claude (`claude-opus-4-7`) with prompt caching |
| Connectors | `databricks-sdk` · `snowflake-connector-python` · MockConnector |
| Infra | Docker Compose · Fly.io · Vercel · Terraform stubs |

## Quick start (local, no Docker — recommended for dev)

The default config uses **SQLite** so you don't need Postgres or Redis to evaluate the product. Scans run inline via FastAPI BackgroundTasks when Celery/Redis aren't reachable.

```powershell
copy .env.example .env       # set AUTH_SECRET (openssl rand -base64 32) and ANTHROPIC_API_KEY

# Backend
cd apps/api
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000, sign up with any email, create a **Mock** connection, click **Run scan** — a full report appears in ~5 seconds.

## Quick start (Docker, all services)

For a production-shaped local stack with real Postgres + Redis + Celery:

```powershell
copy .env.example .env
# Set DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/aiready in .env
pnpm install
pnpm compose:up
```

## Deployment

- **Vercel** for the web app: see [`infra/vercel/vercel.json`](infra/vercel/vercel.json).
- **Fly.io** for the API + worker: see [`infra/fly/`](infra/fly/).
- **Postgres**: Fly Postgres or any managed Postgres (Neon, Supabase, RDS).
- **Redis**: Upstash or Fly Redis.
- **Terraform** stubs to provision both: [`infra/terraform/main.tf`](infra/terraform/main.tf).

## Project layout

```
apps/
  api/                FastAPI service
    app/
      main.py
      config.py
      db/             SQLAlchemy session + base
      models/         User, Connection, Scan, Report
      schemas/        Pydantic v2 schemas
      routers/        /v1 REST surface
      services/
        connectors/   Databricks, Snowflake, Mock (pluggable)
        scoring.py    Deterministic scoring engine
        ai_analyzer.py Claude augmentation
        scanner.py    Orchestration
        security.py   JWT + bcrypt
      workers/        Celery app + tasks
  web/                Next.js 15 app
    src/
      app/
        (auth)/       /login /signup
        (dashboard)/  /dashboard /connections /scans /governance ...
        api/proxy/    JWT-bridging proxy to FastAPI
      auth.ts         NextAuth v5 config (Credentials + Entra + Okta)
      components/ui/  shadcn/ui primitives
      lib/            client + utils
infra/
  docker-compose.yml
  fly/                Fly.io configs
  vercel/             Vercel config
  terraform/          Terraform stubs
```

## How scoring works

Six pillars, weighted into a single 0–100 readiness score:

| Pillar | Weight | What it checks |
| --- | --- | --- |
| Metadata | 20% | Table & column descriptions |
| Schema quality | 20% | Primary keys, partitioning, layout |
| Governance | 20% | PII detection, tagging, masking |
| RAG readiness | 20% | Vector indices over text columns |
| Semantic layer | 10% | Business entities (Phase 2 hook) |
| Operational health | 10% | Pipeline freshness, lineage |

The deterministic engine produces a baseline; Claude augments it with narrative and additional findings/recommendations grounded in the inventory snapshot. If `ANTHROPIC_API_KEY` is unset, the system degrades gracefully to deterministic-only output.

## Roadmap (Phases 2–5)

Phase 2 (auto entity builder), Phase 3 (RAG accelerator), Phase 4 (AI copilot), Phase 5 (governance platform) plug in as additional services on the existing connector + analyzer base classes. See [`cluade.md`](./cluade.md).
