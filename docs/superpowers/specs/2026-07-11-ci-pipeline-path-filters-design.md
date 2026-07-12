# CI Pipeline Path Filters

## Problem

`.github/workflows/ci.yml` currently runs on every push to `main` and every pull request, with no path filtering. Two consequences:

1. Doc-only changes (e.g. `docs/**`, `README.md`) trigger the full `build-lint-test` job (Postgres service, install, Prisma generate/migrate, build, lint, test) — wasted CI minutes and slower feedback for changes that can't break anything.
2. The `deploy` job (Fly.io deploy of the API) runs on every push to `main`, even when the change has nothing to do with `apps/api` — e.g. a `apps/web` or docs change still redeploys the API unnecessarily.

## Goals

- Skip the entire pipeline when a push/PR only touches non-code paths (docs, skill/agent tooling directories, markdown files).
- Only run the `deploy` job when the change could actually affect the API: `apps/api` itself, or shared packages/config it depends on.
- Keep `build-lint-test` running the full suite (all packages) whenever the pipeline does dispatch — no per-package test scoping. Turbo's own caching already avoids redundant work for unaffected packages.

## Non-goals

- Scoping `build-lint-test` itself to only affected packages (out of scope for this change).
- Adding a separate `apps/web` deploy job — the web app deploys via Vercel's own Git integration, outside this workflow.

## Design

### 1. Workflow-level `paths-ignore` (skip dispatch for doc-only changes)

Added to both `on.push` and `on.pull_request` in `ci.yml`:

```yaml
on:
  push:
    branches: [main]
    paths-ignore: &docs-ignore
      - 'docs/**'
      - 'general-documentations/**'
      - 'imported-skills/**'
      - '.claude/**'
      - '.superpowers/**'
      - '**/*.md'
  pull_request:
    paths-ignore: *docs-ignore
```

GitHub Actions semantics: a run is skipped only when *every* changed file matches `paths-ignore`. Any single code/config change alongside a doc change still triggers the full pipeline.

### 2. Job-level path filter (gate `deploy` on API-relevant changes)

A new `changes` job runs first, using `dorny/paths-filter@v3` (pinned by tag; standard, widely-used action for this — avoids hand-rolling `git diff` base-SHA logic that differs between push and PR events):

```yaml
changes:
  runs-on: ubuntu-latest
  outputs:
    api: ${{ steps.filter.outputs.api }}
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          api:
            - 'apps/api/**'
            - 'packages/domain/**'
            - 'packages/config/**'
            - 'package.json'
            - 'pnpm-lock.yaml'
            - 'pnpm-workspace.yaml'
            - 'turbo.json'
            - 'fly.toml'
            - 'docker/api.Dockerfile'
            - '.dockerignore'
```

The existing `deploy` job adds `changes` to `needs` and extends its `if`:

```yaml
deploy:
  needs: [build-lint-test, changes]
  if: >
    github.ref == 'refs/heads/main' &&
    github.event_name == 'push' &&
    needs.changes.outputs.api == 'true'
```

### Watched paths for `api` filter, and why

| Path | Reason |
|---|---|
| `apps/api/**` | The API app itself |
| `packages/domain/**` | Shared domain package the API imports |
| `packages/config/**` | Shared config package the API imports |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Dependency/workspace changes can affect the API build |
| `turbo.json` | Changes to task pipeline definitions can affect API build/test behavior |
| `fly.toml` | Fly.io deploy config lives here |
| `docker/api.Dockerfile` | This is the actual Docker build recipe `fly.toml` delegates to |
| `.dockerignore` | Controls what's included in the build context for that Dockerfile |

## Testing / Verification

Per [[feedback_turborepo_ci_verification]] (local `pnpm test` passing is not sufficient in this repo), verification happens by pushing and watching real GitHub Actions runs, not local simulation:

1. Push a doc-only change (e.g. edit a file under `docs/`) → confirm the workflow does not dispatch at all (no run appears in the Actions tab).
2. Push a change under `apps/web/**` only → confirm `build-lint-test` runs, but `deploy` is skipped (condition evaluates false).
3. Push a change under `apps/api/**` → confirm both `build-lint-test` and `deploy` run.
4. Push a change under `packages/domain/**` → confirm `deploy` runs (shared dependency case).

## Risks

- `dorny/paths-filter` is a third-party action; pinning to a tagged major version (`@v3`) is the norm the repo doesn't currently follow for other third-party actions (e.g. `superfly/flyctl-actions/setup-flyctl@master` is pinned to `master`), so this is consistent with existing risk tolerance in this workflow.
- If a future package is added that the API depends on, its path must be added to the `api` filter manually — no automatic dependency-graph detection (out of scope; turbo's `--filter` graph awareness could address this later if desired).
- The workflow's `paths-ignore` at the trigger level means doc-only PRs never dispatch a run at all — if `main` branch protection is ever configured to require this CI check as a required status check, doc-only PRs could get stuck waiting for a status that never reports (a known GitHub Actions `paths-ignore` gotcha). As of this writing, `main` has no branch protection configured, so this is not a current risk, but should be checked again if branch protection is added later.
