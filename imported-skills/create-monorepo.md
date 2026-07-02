---
name: create-monorepo
description: >
  Creates a complete TypeScript monorepo scaffold from scratch using npm workspaces.
  Generates backend (Node LTS + Express + Prisma ORM) and frontend (React + Vite) packages
  plus a shared package for cross-cutting domain logic. Includes Docker support with
  Dockerfiles for frontend and backend plus a docker-compose file that wires up backend,
  frontend, and a PostgreSQL database. Architecture follows Clean Architecture principles:
  domain → application → infrastructure, keeping business rules free of framework dependencies.
  Use this skill whenever the user asks to: create a monorepo, scaffold a fullstack TypeScript
  project, set up a project with shared domain between frontend and backend, create a Node +
  React project with workspaces, bootstrap a clean-architecture project, or set up Docker +
  Prisma for a new project. Also trigger when the user says "criar monorepo",
  "estrutura monorepo", "projeto fullstack TypeScript", or similar in Portuguese.
  Trigger even if the user just says "new project with backend and frontend in TypeScript".
---

# Create Monorepo Skill

This skill runs a deterministic JavaScript script that builds a complete monorepo in seconds.
No manual steps — one command, everything is created, dependencies installed, and Prisma client generated.

## How to use

1. Ask the user for the project name if not already provided (lowercase, hyphens OK).
2. Run the scaffold script:

```bash
node .claude/skills/create-monorepo.js <project-name>
```

The script must be run from the **current working directory** — it will create `<project-name>/` as a subfolder there.

## What gets created

```
<project-name>/
├── package.json              # npm workspaces root (dev + docker + db scripts)
├── tsconfig.base.json        # shared TypeScript compiler options
├── docker-compose.yml        # postgres + backend + frontend services
├── .nvmrc                    # Node 20 LTS
├── .gitignore
├── .env.example              # DATABASE_URL + PORT template
└── packages/
    ├── shared/               # pure domain — zero framework dependencies
    │   └── src/
    │       ├── domain/       # Entity, ValueObject, IRepository, DomainError
    │       └── application/  # UseCase and ApplicationService contracts
    ├── backend/              # Node LTS + Express + Prisma (port 3001)
    │   ├── prisma/
    │   │   ├── schema.prisma # Prisma schema (PostgreSQL datasource)
    │   │   └── seed.ts       # database seed script
    │   ├── .env.example
    │   ├── Dockerfile        # multi-stage: build → node:alpine runtime
    │   └── src/
    │       ├── domain/
    │       ├── application/
    │       └── infrastructure/
    │           ├── http/             # Express app + router
    │           └── persistence/
    │               └── prisma.ts     # PrismaClient singleton
    └── frontend/             # React 18 + Vite (port 3000)
        ├── Dockerfile        # multi-stage: build → nginx:alpine
        ├── nginx.conf        # SPA fallback + /api proxy to backend service
        └── src/
            ├── domain/
            ├── application/  # React hooks
            ├── infrastructure/api/
            └── ui/           # React components and pages
```

## Architecture principles

- **shared** contains only pure TypeScript — no Node.js, no browser APIs, no frameworks.
- **backend** depends on `shared`. Express and Prisma live only in `infrastructure/`. Business rules in `application/` call interfaces defined in `domain/`.
- **frontend** depends on `shared`. API calls are isolated in `infrastructure/`; hooks in `application/` stay framework-free.
- **domain and application layers never import from infrastructure** — business rules stay testable without a database or browser.

## After running the script

### Local dev (no Docker)

```bash
cd <project-name>
cp packages/backend/.env.example packages/backend/.env
# edit DATABASE_URL if needed

npm run db:migrate      # create first migration (prompts for a name, e.g. "init")
npm run dev:backend     # terminal 1 → http://localhost:3001/api/health
npm run dev:frontend    # terminal 2 → http://localhost:3000
```

### Full Docker stack

```bash
cd <project-name>
npm run docker:up       # builds images, runs migrations, starts everything
# frontend → http://localhost:3000
# backend  → http://localhost:3001/api/health
# postgres → localhost:5432
```

### Database (Prisma)

```bash
npm run db:migrate      # create + apply a migration (dev)
npm run db:generate     # regenerate TypeScript types after schema changes
npm run db:studio       # open Prisma Studio browser UI
npm run db:seed         # run prisma/seed.ts
npm run db:reset        # drop + recreate (dev only)
```

To use PrismaClient in backend code:

```typescript
import { prisma } from '../infrastructure/persistence/prisma.js';
const users = await prisma.user.findMany();
```

## Answering follow-up questions

**"How do I add a new model/table?"**
1. Add the model to `packages/backend/prisma/schema.prisma`
2. Run `npm run db:migrate` (pick a descriptive name)
3. `npm run db:generate` updates TypeScript types
4. Create a repository in `packages/backend/src/infrastructure/persistence/`

**"How do I share code between frontend and backend?"**
Put it in `packages/shared`. Import as `@<project-name>/shared`.

**"How do I deploy?"**
- Docker: push images, run `docker compose up` on the server.
- Manual: `npm run build:backend` → `node packages/backend/dist/main.js`; `npm run build:frontend` → serve `packages/frontend/dist/`. Run `npm run db:migrate:prod` before starting.
