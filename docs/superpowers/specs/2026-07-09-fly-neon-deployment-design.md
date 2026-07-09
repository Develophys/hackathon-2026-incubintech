# Fly.io + Neon Deployment Design

## Context

Gui's DevOps roadmap (`general-documentations/roadmap/gui.md`) lists standing up deploy infrastructure (hosting, HTTPS, basic CI/CD pipeline) as due at Checkpoint 2 (2026-07-11). No hosting provider had been decided or documented anywhere in this repo until now. The confirmed targets are: `apps/api` → **Fly.io**, database → **Neon** (managed Postgres), `apps/web` → **Vercel**.

`apps/web` does not exist yet — Plan 03 (frontend foundation) hasn't run. This spec covers **Fly.io + Neon only**, deploying the already-built `apps/api`. Vercel/frontend deployment is deliberately out of scope here and will get its own spec once Plan 03 lands.

## Goal

Get `apps/api` running on Fly.io against a real Neon Postgres database, redeployed automatically on every push to `main` that passes CI, with a documented manual rollback path.

## Prerequisite: Plan 04 Tasks 1-2

Plan 04 (docker-local-env) already designs `docker/api.Dockerfile` — a multi-stage build using `turbo prune` — for local Docker Compose parity, and its own text says it's meant to be "the natural starting point" for the real deploy pipeline. This plan reuses that Dockerfile rather than writing a second one, so its implementation plan executes **only** Plan 04's Task 1 (root `.dockerignore`) and Task 2 (`docker/api.Dockerfile`) as a prerequisite step. Plan 04's Task 3 (web Dockerfile) and Task 4 (docker-compose wiring both `api` and `web`) stay untouched and deferred — they need `apps/web`, which doesn't exist yet.

## Architecture

```
git push main
  → CI job "build-lint-test" (existing, unchanged)
  → passes
  → CI job "deploy" (new, needs: build-lint-test, only on push to main)
      → flyctl deploy --remote-only --config fly.toml
      → Fly.io builds image from docker/api.Dockerfile on its remote builders
      → container starts: `prisma migrate deploy` (against Neon, direct connection) && `node dist/src/main.js`
      → Fly.io's own HTTP health check polls GET /health
  → CI job's own post-deploy smoke test: curl the public URL's /health, fail loudly if not {"status":"ok",...}
```

## Neon Connection Strings: Pooled vs. Direct

Neon issues two connection strings per project: a **pooled** one (through PgBouncer, hostname has a `-pooler` suffix) and a **direct** one. This project already uses Prisma's driver-adapter pattern (`@prisma/adapter-pg`'s `PrismaPg`, established in Plan 02 for Prisma 7.8), which makes wiring both in cleanly:

- **`DATABASE_URL`** (pooled) — used by `PrismaService`'s `PrismaPg` adapter at runtime. Fly.io machines can scale/restart; pooling avoids exhausting Neon's connection limit under concurrent requests.
- **`DIRECT_DATABASE_URL`** (direct, unpooled) — used by `apps/api/prisma.config.ts`'s `datasource.url` for `prisma migrate deploy`. Prisma Migrate needs a direct connection for its schema-lock mechanism; running migrations through a pooler is a known source of intermittent failures.

**Code change required:** `apps/api/prisma.config.ts` currently points `datasource.url` at `env("DATABASE_URL")` (Plan 02 Task 2 Step 4). This plan changes it to `env("DIRECT_DATABASE_URL")`. Locally (plain `docker run postgres`), both env vars can point at the same local Postgres instance — the pooled/direct distinction only matters against Neon. `apps/api/.env.example` gains a `DIRECT_DATABASE_URL` line alongside `DATABASE_URL`.

## Fly.io Configuration

New file `fly.toml` (repo root, Fly's convention):

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

`app = "zelo-api"` and `primary_region = "gru"` (São Paulo) are proposed defaults — Fly app names are globally unique, so the actual name gets finalized during the manual `fly apps create` step if `zelo-api` is taken. `fly.toml` has no secrets in it and is safe to commit.

**Fly secrets** (set manually via `fly secrets set`, never committed):
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_DATABASE_URL` — Neon direct connection string

## CI/CD: Deploy Job

Extends the existing `.github/workflows/ci.yml` with a second job — same file, same pattern Plan 02 Task 6 used to add the Postgres service to the `build-lint-test` job, rather than a new workflow file:

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

- `needs: build-lint-test` — deploy only happens after the full test suite (including Postgres-backed tests) passes.
- `if:` guard — runs only on a real push to `main`, never on pull requests (PRs still get `build-lint-test` from the workflow's existing trigger, just not `deploy`).
- `--remote-only` — Fly builds the image on its own remote builders; the GitHub Actions runner doesn't need Docker-in-Docker.
- Post-deploy smoke test fails the workflow loudly if the deployed app doesn't come up healthy, rather than trusting `flyctl deploy`'s exit code alone — matches this project's existing convention (the CI pipeline plan's `gh run watch` verification, Plan 02's real end-to-end health checks).

## Rollback

Fly.io retains prior release images automatically. `fly releases` lists them; `fly deploy --image <previous-image-ref>` (or `fly apps rollback`) reverts to a prior one. This is documented as an exact command sequence in the implementation plan and in project docs, not automated — a rollback should be a deliberate human action, satisfying Gui's roadmap item for a rollback plan ahead of the live demo (2026-07-25).

## Manual Steps (human-run, not automatable by an agent)

1. Confirm/create the Neon project; copy both the pooled and direct connection strings from the Neon console's connection panel.
2. `fly apps create zelo-api` (or a chosen alternative name if taken).
3. `fly secrets set DATABASE_URL=<pooled> DIRECT_DATABASE_URL=<direct>` against the new Fly app.
4. `fly tokens create deploy` → copy the value → add as a `FLY_API_TOKEN` secret in the GitHub repo's Settings → Secrets and variables → Actions.

Both Fly.io and Neon accounts already exist (confirmed) — no signup steps needed.

## Secrets Hygiene

`fly.toml` is safe to commit — it holds no secrets, only build/routing config. `DATABASE_URL`, `DIRECT_DATABASE_URL`, and `FLY_API_TOKEN` only ever live in Fly secrets and GitHub Actions secrets respectively, never in a committed file — matching this project's existing pattern for `docker/.env.docker` and `apps/api/.env` (both gitignored, `.env.example` files as the committed template).

## Out of Scope

- `apps/web` → Vercel deployment (separate spec, once Plan 03 exists).
- Staging/preview environments — one production environment only, matching the hackathon's single-demo-environment need.
- Automated rollback — deliberately manual (see Rollback section).
- Fly.io scaling/multi-region config — a single machine in `gru` is sufficient for a demo-scale PoC.
