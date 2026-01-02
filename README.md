---
title: "NFL Games"
description: "NFL game schedules, scores, standings, and game data service"
port: 3203
type: "Feature App"
status: "active"
---

# NFL Games

NFL game schedules, scores, standings, and game data service.

## Quick Start

### Prerequisites
- Node.js >= 20.0.0, pnpm >= 9.12.0, Docker & PostgreSQL

### Install & Run
```bash
pnpm install
pnpm dev              # Frontend + API
pnpm dev:api          # API only
pnpm dev:frontend     # Frontend only
```

## Development

```bash
pnpm test             # Run tests
pnpm lint             # Lint & type-check
pnpm build            # Production build
```

## Database

```bash
pnpm db:setup         # Initialize DB & run migrations
pnpm db:reset         # ⚠️ Delete all data
pnpm db:seed          # Populate test data
```

## Structure

```
├── frontend/          # React UI (Vite)
├── api/              # Fastify API
├── prisma/           # Database schema
└── package.json      # Root scripts
```

## API Endpoints

See `api/src/routes/` for implementation details.

## Deployment

Docker build: `docker build -t zyp/nfl-games:1.0.0 .`
AWS ECS: See PUBLISHING-AND-DEPLOYMENT.md

## Support

📚 **Start here:** [`KNOWLEDGE-BASE.md`](../../KNOWLEDGE-BASE.md) - AI-optimized documentation index

**Key documents:**
- [`CLAUDE.md`](../../CLAUDE.md) - 4-layer architecture quick reference
- [`DEVELOPMENT-STANDARDS.md`](../../DEVELOPMENT-STANDARDS.md) - Code standards
- [`CICD-DEV.md`](../../CICD-DEV.md) - Local git CI/CD setup
- [`FINAL-FEATURE-ARCHITECTURE.md`](../../FINAL-APPS-FEATURE-ARCHITECTURE.md) - Complete specification
- [`DATABASE-SCHEMA-GUIDE.md`](../../DATABASE-SCHEMA-GUIDE.md) - Database design
