# Fly.io + Neon Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get `apps/api` running on Fly.io against a real Neon Postgres database, redeployed automatically on every push to `main` that passes CI.

**Architecture:** A Docker-based Fly.io deploy reusing Plan 04's `docker/api.Dockerfile` (executed here as a prerequisite, ahead of the rest of Plan 04). Neon's pooled connection string (`DATABASE_URL`) serves runtime queries via the existing `@prisma/adapter-pg` wiring; its direct connection string (`DIRECT_DATABASE_URL`) serves `prisma migrate deploy`, which the container's existing `CMD` already runs on every start. A new `deploy` job in the existing `.github/workflows/ci.yml` runs `flyctl deploy` after `build-lint-test` passes on `main`, then smoke-tests the live `/health` endpoint.

**Tech Stack:** Fly.io (`flyctl`), Neon (managed Postgres), Docker, GitHub Actions, Prisma 7.8.

## Global Constraints

- `apps/web` → Vercel deployment is explicitly out of scope for this plan — `apps/web` doesn't exist yet (Plan 03 hasn't run). A separate plan covers it later.
- Neon's **pooled** connection string is `DATABASE_URL` (runtime queries, via `PrismaService`'s existing `PrismaPg` adapter — no change to `prisma.service.ts` itself). Neon's **direct** connection string is `DIRECT_DATABASE_URL` (used only by `apps/api/prisma.config.ts` for `prisma migrate deploy`, which needs a direct connection for its schema-lock mechanism).
- The `deploy` CI job only runs on an actual push to `main` (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`), gated on `needs: build-lint-test` — never on pull requests.
- No secret value (Neon connection strings, `FLY_API_TOKEN`) is ever typed into an agent conversation or committed to a file. `fly.toml` itself has no secrets and is safe to commit. Every step that needs a secret gives the human an exact command template to run themselves in their own terminal/GitHub UI.
- Rollback is a documented manual command sequence (`fly releases` + `fly deploy --image <ref>`), not automated — a rollback should be a deliberate human action.
- Both Fly.io and Neon accounts already exist — no account-signup steps are needed, only project/app provisioning.

---

### Task 1: Docker build prerequisite (root `.dockerignore` + `docker/api.Dockerfile`)

**Files:**
- Create: `.dockerignore` (repo root)
- Create: `docker/api.Dockerfile`

**Interfaces:**
- Produces: a buildable Docker image for `apps/api`, the same image `fly.toml` (Task 3) points at. This is Plan 04's Task 1 + Task 2, executed here as a prerequisite — Plan 04's own Task 3 (web Dockerfile) and Task 4 (docker-compose) are NOT part of this task and stay deferred until `apps/web` exists.

- [ ] **Step 1: Create `.dockerignore`**

Create `.dockerignore` at the repo root:

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

- [ ] **Step 3: Create `docker/api.Dockerfile`**

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
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @zelo/api exec prisma generate
RUN pnpm exec turbo run build --filter=@zelo/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /app .
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @zelo/api exec prisma migrate deploy && node apps/api/dist/src/main.js"]
```

`node:24-alpine` (not `node:20-alpine`) matches root `.nvmrc` — Prisma 7.8's transitive `@prisma/streams-local` dependency requires Node `>=22`, discovered during Plan 02's CI verification. The `CMD`'s entry point is `dist/src/main.js`, not `dist/main.js` — `apps/api/tsconfig.json`'s `rootDir` was widened to `.` in Plan 02 to include the generated Prisma client's real TypeScript source, which shifted `tsc`'s emitted output accordingly. Neither `prisma generate` nor `prisma migrate deploy` takes a `--schema` flag in Prisma 7 — both read from `apps/api/prisma.config.ts`.

- [ ] **Step 4: Verify the image builds standalone**

Run (from the repo root): `docker build -f docker/api.Dockerfile -t zelo-api:local .`
Expected: completes with `Successfully tagged zelo-api:local` (or BuildKit's equivalent final success line).

- [ ] **Step 5: Commit**

```bash
git add docker/api.Dockerfile
git commit -m "feat(docker): add backend Dockerfile using turbo prune"
```

---

### Task 2: Split Prisma's migration URL from the runtime URL

**Files:**
- Modify: `apps/api/prisma.config.ts`
- Modify: `apps/api/.env.example`

**Interfaces:**
- Consumes: `apps/api/prisma.config.ts` (Plan 02 Task 2 Step 4), which currently points `datasource.url` at `env("DATABASE_URL")`.
- Produces: `prisma.config.ts` reading `DIRECT_DATABASE_URL` instead — `PrismaService` (unchanged) keeps reading `DATABASE_URL` directly from `process.env` for runtime queries. Task 5's Fly secrets set both.

- [ ] **Step 1: Modify `apps/api/prisma.config.ts`**

Change:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_DATABASE_URL"),
  },
});
```

`DIRECT_DATABASE_URL` replaces `DATABASE_URL` here specifically because Prisma Migrate needs a direct (unpooled) connection for its schema-lock mechanism — running migrations through Neon's connection pooler is a known source of intermittent failures. `PrismaService` (`apps/api/src/shared/prisma/prisma.service.ts`) is unaffected by this change; it reads `process.env.DATABASE_URL` (the pooled string) directly, not through `prisma.config.ts`.

- [ ] **Step 2: Modify `apps/api/.env.example`**

```
DATABASE_URL="postgresql://zelo:devpassword@localhost:5432/zelo?schema=public"
DIRECT_DATABASE_URL="postgresql://zelo:devpassword@localhost:5432/zelo?schema=public"
PORT=3000
AI_PROVIDER=claude
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
```

Locally, both env vars point at the same local Postgres instance — the pooled/direct distinction only matters against Neon (Task 5).

- [ ] **Step 3: Verify migrations still work locally with the new config**

Start a temporary local Postgres (skip if one from a previous task is still running):

```bash
docker run --name zelo-postgres-verify -e POSTGRES_USER=zelo -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=zelo -p 5432:5432 -d postgres:16-alpine
```

Create a local `.env` from the updated example (not committed — already gitignored):

```bash
cp apps/api/.env.example apps/api/.env
```

Run: `pnpm --filter @zelo/api exec prisma migrate deploy`
Expected: `No pending migrations to apply` (or applies cleanly if any are pending) — confirms `prisma.config.ts` successfully reads `DIRECT_DATABASE_URL` and connects.

Run: `pnpm --filter @zelo/api test`
Expected: PASS — all existing tests still pass (confirms `PrismaService` still connects fine via `DATABASE_URL`, unaffected by this change).

- [ ] **Step 4: Tear down the temporary Postgres container**

```bash
docker stop zelo-postgres-verify && docker rm zelo-postgres-verify
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma.config.ts apps/api/.env.example
git commit -m "feat(api): split Prisma's migration URL (direct) from the runtime URL (pooled)"
```

---

### Task 3: `fly.toml`

**Files:**
- Create: `fly.toml` (repo root)

**Interfaces:**
- Consumes: `docker/api.Dockerfile` (Task 1).
- Produces: the Fly.io app configuration Task 4's CI job and Task 5's manual `fly apps create`/`flyctl deploy` both reference.

- [ ] **Step 1: Create `fly.toml`**

```toml
app = "zelo-api"
primary_region = "gru"

[build]
  dockerfile = "docker/api.Dockerfile"

[env]
  PORT = "3000"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  [[services.ports]]
    port = 80
    handlers = ["http"]

[[services.http_checks]]
  path = "/health"
  interval = "15s"
  timeout = "5s"
```

`app = "zelo-api"` and `primary_region = "gru"` (São Paulo) are defaults — Fly app names are globally unique, so if `zelo-api` is taken, Task 5's `fly apps create` step picks an alternative and this file is updated to match before the first deploy. `fly.toml` has no secrets in it and is safe to commit.

- [ ] **Step 2: Validate the TOML is well-formed**

Run: `npx -y @iarna/toml -e "console.log(require('@iarna/toml').parse(require('fs').readFileSync('fly.toml','utf8')))"`
Expected: prints the parsed config object with no error — this is a syntax check only; Task 5's `fly apps create`/first deploy is the real validation against Fly.io itself.

If `flyctl` is already installed and authenticated in this environment (check with `fly version`), prefer: `fly config validate` — Expected: `Validating fly.toml` followed by a success message. Use whichever of the two succeeds; both are syntax/schema checks, not deploys.

- [ ] **Step 3: Commit**

```bash
git add fly.toml
git commit -m "feat(deploy): add Fly.io app configuration"
```

---

### Task 4: CI deploy job

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `build-lint-test` job (existing).
- Produces: a `deploy` job that runs `flyctl deploy` against `fly.toml` (Task 3) after `build-lint-test` passes on a push to `main`, then smoke-tests the live `/health` endpoint.

- [ ] **Step 1: Confirm the current `build-lint-test` job name**

Run: `grep -A1 "^jobs:" .github/workflows/ci.yml`
Expected: shows `build-lint-test:` as the job name — this task's new job's `needs:` must match this exactly.

- [ ] **Step 2: Add the `deploy` job**

Modify `.github/workflows/ci.yml` — add a new top-level job under `jobs:`, as a sibling of `build-lint-test`:

```yaml
  deploy:
    needs: build-lint-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup flyctl
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only --config fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Verify deployment
        run: curl -sf https://zelo-api.fly.dev/health | grep -q '"status":"ok"'
```

`needs: build-lint-test` means this job only runs after the full test suite (including the Postgres-backed tests) passes. The `if:` guard means it only runs on a real push to `main`, never on pull requests — PRs still get `build-lint-test` from the workflow's existing `pull_request` trigger, just not `deploy`. `--remote-only` builds the image on Fly's own remote builders, so this runner doesn't need Docker-in-Docker. The final step fails the workflow loudly if the deployed app doesn't come up healthy, rather than trusting `flyctl deploy`'s exit code alone. If Task 5 ends up with a different app name than `zelo-api`, update the smoke-test URL here to match.

- [ ] **Step 3: Validate the YAML is well-formed**

Run: `npx -y js-yaml .github/workflows/ci.yml`
Expected: prints the parsed YAML structure back to stdout with no error.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Fly.io deploy job"
```

This job cannot be exercised for real until Task 5 provisions the Fly app and secrets — it will fail on the next push to `main` until then. Task 5 covers that provisioning and the first real deploy.

---

### Task 5: Provision Fly.io + Neon and run the first real deploy

**Files:**
- Modify: root `README.md` (Step 8 — rollback documentation)

Everything else in this task is provisioning and verification only, run by you directly (not dispatched to a subagent) since every step needs your own Fly.io/Neon account access — no secret value should be typed into this conversation.

**Interfaces:**
- Consumes: `fly.toml` (Task 3), the `deploy` CI job (Task 4).
- Produces: a live `zelo-api` app on Fly.io connected to a real Neon database, confirmed reachable at `/health`.

- [ ] **Step 1: Get both Neon connection strings**

In the Neon console (https://console.neon.tech/app/), open your project's connection panel and copy:
- The **pooled** connection string (default view) — this is `DATABASE_URL`.
- The **direct** connection string (toggle "Pooled connection" off) — this is `DIRECT_DATABASE_URL`.

Keep both handy for Step 3. Don't paste them into this conversation.

- [ ] **Step 2: Create the Fly.io app**

Run in your own terminal:

```bash
fly apps create zelo-api
```

If `zelo-api` is taken, Fly will tell you — pick an alternative, then update `app = "zelo-api"` in `fly.toml` (Task 3) and the smoke-test URL in `.github/workflows/ci.yml` (Task 4) to match before continuing.

- [ ] **Step 3: Set Fly secrets**

Run in your own terminal (substituting your actual copied values):

```bash
fly secrets set DATABASE_URL="<pooled connection string>" DIRECT_DATABASE_URL="<direct connection string>" --app zelo-api
```

Expected: Fly confirms the secrets were set and stages a new release.

- [ ] **Step 4: Create the GitHub Actions deploy token**

Run in your own terminal:

```bash
fly tokens create deploy --app zelo-api
```

Copy the printed token. In the GitHub repo, go to Settings → Secrets and variables → Actions → New repository secret, name it `FLY_API_TOKEN`, and paste the token value there (not in this conversation).

- [ ] **Step 5: Confirm before triggering the first real deploy**

Pushing to `main` now will trigger Task 4's `deploy` job for real, building and deploying a live image to Fly.io — pause here and confirm you want to proceed before the next step.

- [ ] **Step 6: Push and watch the deploy**

Once confirmed, push any pending commits from Tasks 1-4 to `main` (or trigger the existing workflow another way if everything is already pushed), then:

```bash
gh run watch --exit-status
```

Expected: the `build-lint-test` job passes, then the `deploy` job passes, ending in the `Verify deployment` step succeeding. If it fails, run `gh run view --log-failed` to see the exact failing step's output before making any fix — do not guess.

- [ ] **Step 7: Manually confirm the live endpoint**

Run: `curl https://zelo-api.fly.dev/health` (substituting your actual app name if different)
Expected: `{"status":"ok","database":true}` — this proves the live Fly.io app reached the real Neon database.

- [ ] **Step 8: Document the rollback procedure in the README**

Modify root `README.md` — append under "## Commands" (after the "## Backend local setup" section from Plan 02):

```markdown

## Rollback (Fly.io)

If a deploy breaks production:

1. `fly releases --app zelo-api` — lists prior releases with their image references.
2. `fly deploy --image <previous-image-ref> --app zelo-api` — redeploys a specific prior image.

Rollback is intentionally a manual command, not automated — treat it as a deliberate decision, especially close to the demo (2026-07-25).
```

- [ ] **Step 9: Commit**

```bash
git add README.md
git commit -m "docs: document Fly.io rollback procedure"
```

---

## Definition of Done

- `docker build -f docker/api.Dockerfile .` succeeds locally (Task 1).
- `prisma migrate deploy` and the full local test suite both pass using the split `DATABASE_URL`/`DIRECT_DATABASE_URL` config (Task 2).
- `fly.toml` exists, is valid, and points at `docker/api.Dockerfile` (Task 3).
- `.github/workflows/ci.yml`'s `deploy` job runs only on push to `main`, only after `build-lint-test` passes, and smoke-tests `/health` after deploying (Task 4).
- A real Fly.io app is live, backed by a real Neon database, and `curl <app>.fly.dev/health` returns `{"status":"ok","database":true}` (Task 5).
- No secret value appears in any committed file or in this conversation.
- `apps/web` → Vercel deployment is explicitly not part of this plan.
