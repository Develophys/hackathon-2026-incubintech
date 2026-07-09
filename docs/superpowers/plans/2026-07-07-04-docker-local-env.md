# Docker Local Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `apps/api` and `apps/web` as actual production builds inside Docker, wired to a containerized Postgres via `docker-compose.yml` — a local prod-parity environment that catches "works in dev server, breaks in the real build" problems before the live demo.

**Architecture:** Multi-stage Dockerfiles using `turbo prune` (the standard Turborepo Docker pattern) to build a minimal, isolated dependency+source subset per app before compiling. `docker-compose.yml` wires `postgres` → `api` → `web` with health-check-gated startup. This is local-only prod-parity, not the real deploy pipeline (that's Gui's domain per `general-documentations/roadmap/gui.md`), but the same Dockerfiles are the natural starting point for it.

**Tech Stack:** Docker, Docker Compose, `turbo prune`, `nginx:alpine` (static serving for the built PWA), `prisma migrate deploy`.

## Global Constraints

- Requires Plans 01, 02, and 03 complete — this plan builds their output, it doesn't add application code.
- Secrets (`DATABASE_URL` inside the containers, and later the LLM API key in Plan 05) come from a gitignored `docker/.env.docker`, never baked into an image layer (spec Section E).
- This compose setup is local-only prod-parity — it is explicitly not the cloud deployment pipeline (spec Section E, `general-documentations/roadmap/gui.md`).
- Both Dockerfiles' base image is `node:24-alpine`, matching root `.nvmrc` (Plan 01 Task 1, bumped to `24` after Plan 02's real CI run failed on Node 20 — Prisma 7.8's transitive `@prisma/streams-local` dependency requires Node `>=22.0.0`). `apps/web` doesn't strictly need this floor itself, but matching `.nvmrc` keeps one Node version as the single source of truth across local dev, CI, and Docker.

---

### Task 1: Root `.dockerignore`

**Files:**
- Create: `.dockerignore` (repo root)

**Interfaces:**
- Produces: a clean Docker build context — without this, `COPY . .` in Task 2/3's pruner stage would copy host `node_modules`, `dist`, and `.git` into the image, bloating the build and risking stale artifacts.

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
**/node_modules
dist
**/dist
.turbo
**/.turbo
.git
**/*.tsbuildinfo
.env
.env.*
!.env.example
docker/.env.docker
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add root .dockerignore for Docker build contexts"
```

---

### Task 2: Backend Dockerfile (`docker/api.Dockerfile`)

**Files:**
- Create: `docker/api.Dockerfile`

**Interfaces:**
- Consumes: `apps/api` (Plan 02), `packages/domain` + `packages/config` (Plan 01).
- Produces: an image that runs `prisma migrate deploy` then `node dist/src/main.js` on container start, listening on port 3000.

- [ ] **Step 1: Create `docker/api.Dockerfile`**

```dockerfile
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @zelo/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /app/out/full/ .
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
RUN pnpm --filter @zelo/api exec prisma generate
RUN pnpm exec turbo run build --filter=@zelo/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /app .
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @zelo/api exec prisma migrate deploy && node apps/api/dist/src/main.js"]
```

`turbo prune @zelo/api --docker` (in the `pruner` stage) generates `/app/out/json/` (only the `package.json` files needed for `@zelo/api` and its workspace dependencies — `@zelo/domain`, `@zelo/config`) and `/app/out/full/` (the pruned source tree). Installing from `out/json/` first means `pnpm install` only re-runs when a dependency actually changes, not on every source edit — this is what makes the image layer-cacheable. `--ignore-scripts` is required on this first install: `apps/api/package.json`'s `postinstall: prisma generate` would otherwise fire against `out/json/`, which has no `prisma/schema.prisma` yet (that only arrives with `out/full/`), failing with "Could not find Prisma Schema."

Neither `prisma generate` nor `prisma migrate deploy` takes a `--schema` flag in Prisma 7 (Plan 02) — both read the schema and migrations location from `apps/api/prisma.config.ts`, which travels with the pruned source tree since it's part of `apps/api`. `prisma generate` now runs explicitly *before* the `turbo run build` step (rather than after, as it would with Prisma 5/6's old `prisma-client-js` provider) because `tsc` needs the generated client at `apps/api/generated/prisma` to type-check `PrismaService`'s import — the build would fail without it. The placeholder `ENV DATABASE_URL` immediately before `prisma generate` is required because Prisma 7's config loader validates that `prisma.config.ts`'s `env("DATABASE_URL")` resolves to a real value even for `generate` (which never opens a connection) — without it the build fails with `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`. This placeholder is build-time only and does not appear in the `runner` stage; the real `DATABASE_URL` for `prisma migrate deploy` in `CMD` comes from `docker-compose.yml` (Task 4) at container start. The CMD's entry point is `dist/src/main.js`, not `dist/main.js` — Plan 02 Task 2 Step 9 widens `apps/api/tsconfig.json`'s `rootDir` to `.` (from `src`) to accommodate the generated Prisma client's real TypeScript source, which shifts `tsc`'s emitted output from `dist/main.js` to `dist/src/main.js`.

- [ ] **Step 2: Verify the image builds standalone**

Run (from the repo root): `docker build -f docker/api.Dockerfile -t zelo-api:local .`
Expected: completes with `Successfully tagged zelo-api:local` (or BuildKit's equivalent final success line). This step only proves the image builds — Task 4 verifies it runs correctly against a real Postgres.

- [ ] **Step 3: Commit**

```bash
git add docker/api.Dockerfile
git commit -m "feat(docker): add backend Dockerfile using turbo prune"
```

---

### Task 3: Frontend Dockerfile (`docker/web.Dockerfile`) + nginx config

**Files:**
- Create: `docker/web.Dockerfile`
- Create: `docker/nginx.conf`

**Interfaces:**
- Consumes: `apps/web` (Plan 03), `packages/domain` + `packages/config` (Plan 01).
- Produces: an nginx image serving the built PWA on port 80, with SPA fallback routing (so React Router's client-side routes don't 404 on refresh).

- [ ] **Step 1: Create `docker/nginx.conf`**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location = /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

`try_files ... /index.html` is the SPA fallback: any path React Router owns client-side (not a real static file) still serves `index.html`, letting the router take over. `sw.js` is explicitly set to `no-cache` so the PWA's service worker updates are never served stale.

- [ ] **Step 2: Create `docker/web.Dockerfile`**

```dockerfile
FROM node:24-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @zelo/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm exec turbo run build --filter=@zelo/web

FROM nginx:1.27-alpine AS runner
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`VITE_API_BASE_URL` is a build ARG, not a runtime env var — Vite bakes `import.meta.env.VITE_*` values into the static bundle at build time, so it has to be available when `vite build` runs, not when the nginx container starts.

- [ ] **Step 3: Verify the image builds standalone**

Run (from the repo root): `docker build -f docker/web.Dockerfile --build-arg VITE_API_BASE_URL=http://localhost:3000 -t zelo-web:local .`
Expected: completes with a success message. Task 4 verifies it serves correctly.

- [ ] **Step 4: Commit**

```bash
git add docker/web.Dockerfile docker/nginx.conf
git commit -m "feat(docker): add frontend Dockerfile with nginx SPA serving"
```

---

### Task 4: `docker-compose.yml` and environment wiring

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/.env.example`

**Interfaces:**
- Consumes: `docker/api.Dockerfile` (Task 2), `docker/web.Dockerfile` (Task 3).
- Produces: `docker compose up` bringing up all three services with correct startup order — this is the command Plans 05/06 (and the demo-day runbook) rely on.

- [ ] **Step 1: Create `docker/.env.example`**

```
POSTGRES_DB=zelo
POSTGRES_USER=zelo
POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgresql://zelo:devpassword@postgres:5432/zelo?schema=public
```

`DATABASE_URL` is precomputed here rather than reconstructed from the other three vars inside `docker-compose.yml`. Compose's `${VAR}`/`$${VAR}` substitution in an `environment:` mapping value is resolved by Compose itself at parse time from the host/Compose environment (or a literal `.env` file next to the compose file) — it is never fed by `env_file:`, and it is never re-expanded by a shell inside the container the way a healthcheck's `CMD-SHELL` command is. So a reconstructed `DATABASE_URL: postgresql://${POSTGRES_USER}:...` line would silently render blank (no `.env` file exists in this repo), and escaping it to `$${POSTGRES_USER}` would not fix it either — it would just insert the literal, un-expanded string `${POSTGRES_USER}` into the container's env. The only vars genuinely available to the `api`/`postgres` containers themselves are the ones supplied via `env_file: .env.docker`, so `DATABASE_URL` has to be one of those precomputed literals rather than assembled from the others by Compose.

- [ ] **Step 2: Create the real (gitignored) `docker/.env.docker` from the example**

Run: `cp docker/.env.example docker/.env.docker`
Expected: `docker/.env.docker` now exists with the same content (already covered by the root `.gitignore`'s `.env.*` rule from Plan 01 Task 1, and explicitly listed in Task 1's `.dockerignore` of this plan).

- [ ] **Step 3: Create `docker/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file: .env.docker
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  api:
    build:
      context: ..
      dockerfile: docker/api.Dockerfile
    env_file: .env.docker
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"

  web:
    build:
      context: ..
      dockerfile: docker/web.Dockerfile
      args:
        VITE_API_BASE_URL: http://localhost:3000
    depends_on:
      - api
    ports:
      - "8080:80"

volumes:
  pgdata:
```

- [ ] **Step 4: Commit**

```bash
git add docker/docker-compose.yml docker/.env.example
git commit -m "feat(docker): add docker-compose wiring postgres, api, and web"
```

---

### Task 5: End-to-end verification

**Files:** none created — verification only.

- [ ] **Step 1: Bring the full stack up**

Run (from `docker/`): `docker compose up --build -d`
Expected: three containers start (`docker-postgres-1`, `docker-api-1`, `docker-web-1` or similar names). Check with:
`docker compose ps`
Expected: all three show state `running` (or `healthy` for postgres).

- [ ] **Step 2: Verify Postgres is healthy**

Run: `docker compose ps postgres`
Expected: `STATUS` column shows `healthy`.

- [ ] **Step 3: Verify the API applied migrations and is reachable**

Run: `docker compose logs api | grep -i "migrate\|listening"`
Expected: log lines showing Prisma's migration output (e.g. "No pending migrations to apply" — from Plan 02's empty `init` migration) followed by `Zelo API listening on port 3000`.

Run: `curl -s http://localhost:3000/health`
Expected: `{"status":"ok","database":true}` — this proves the containerized API reached the containerized Postgres, not the host's ad hoc container from Plan 02 Task 2.

- [ ] **Step 4: Verify the web container serves the built PWA**

Run: `curl -s http://localhost:8080 | grep -o '<div id="root">'`
Expected: match found.

Run: `curl -s -I http://localhost:8080/manifest.webmanifest | head -1`
Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 5: Verify SPA fallback routing works**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some/nonexistent/client/route`
Expected: `200` (nginx's `try_files` fallback serves `index.html` instead of a 404 — this is what lets React Router handle unknown paths client-side).

- [ ] **Step 6: Tear down**

Run: `docker compose down`
Expected: all three containers stop and are removed. Add `-v` (`docker compose down -v`) only if you also want to wipe the `pgdata` volume — don't do this by default, since it discards local demo data.

- [ ] **Step 7: Commit** (only if any file changed during verification — typically none will)

If `git status --short` shows no changes, skip this step.

---

### Task 6: Documentation

**Files:**
- Modify: root `README.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Append a "## Local Docker Environment" section to root `README.md`**

```markdown

## Local Docker Environment

Runs actual production builds of `apps/api` and `apps/web` against a containerized Postgres — use this to catch build-only issues before a demo, not for day-to-day development (use `pnpm --filter @zelo/api dev` / `pnpm --filter @zelo/web dev` for that).

```bash
cd docker
cp .env.example .env.docker   # first time only
docker compose up --build -d
```

- API: http://localhost:3000 (health check: `curl http://localhost:3000/health`)
- Web: http://localhost:8080
- Postgres: localhost:5432 (credentials in `docker/.env.docker`)

Tear down with `docker compose down` (add `-v` to also wipe the Postgres volume).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document local Docker Compose environment"
```

---

## Definition of Done

- `cd docker && docker compose up --build -d` brings up `postgres`, `api`, and `web` with no manual intervention beyond copying `.env.example`.
- `curl http://localhost:3000/health` (through the containerized API, against the containerized Postgres) returns `{"status":"ok","database":true}`.
- `curl http://localhost:8080` serves the built PWA, including a working `manifest.webmanifest` and SPA fallback routing for client-side routes.
- No secret values are baked into any image layer — `docker/.env.docker` is gitignored and injected at container-start time only.
- `docker compose down` cleanly tears down the stack.
