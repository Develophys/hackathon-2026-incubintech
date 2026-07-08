# CI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that runs `pnpm install/build/lint/lint:boundaries/test` on every push to `main` and every pull request — the exact commands every existing plan's Definition of Done already asserts pass locally, now enforced automatically.

**Architecture:** A single workflow file, `.github/workflows/ci.yml`, using `pnpm/action-setup` (version auto-detected from root `package.json`'s `packageManager` field, set in Plan 01) and `actions/setup-node` (Node version read from `.nvmrc`, also set in Plan 01). This plan adds the workflow in its minimal form — build/lint/test only, no database — because at this point in the sequence (right after Plan 01) only `packages/domain` exists, which has no database dependency. Plan 02 (backend foundation) later extends this same workflow with a Postgres service container once `apps/api` actually needs one — see Task 6 there.

**Tech Stack:** GitHub Actions, `pnpm/action-setup`, `actions/setup-node`.

## Global Constraints

- Triggers on push to `main` and on every pull request (spec `docs/superpowers/specs/2026-07-08-repo-folder-structure-design.md`, "CI Plan" section).
- Runs the exact same commands as every existing plan's local Definition of Done — no separate/divergent CI-only command set.
- Requires Plan 01 complete (`package.json`'s `packageManager` field and `.nvmrc` must already exist).
- **Pushing to the remote to verify the workflow runs (Task 2) requires explicit confirmation from the user first** — this plan does not push or open a PR unilaterally.

---

### Task 1: Create the base CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `package.json`'s `packageManager` field, `.nvmrc` (both from Plan 01 Task 1).
- Produces: a `build-lint-test` job that Plan 02 Task 6 extends with a Postgres service. The job name `build-lint-test` and the workflow file path are what Plan 02 Task 6 modifies.

- [ ] **Step 1: Confirm this plan is running before `apps/` exists**

Run: `ls apps 2>&1 || echo "not found"`
Expected: "not found" — this confirms the workflow below is scoped correctly (build/lint/test only, no database yet). If `apps/` already exists, skip straight to Plan 02 Task 6 instead of this task, since the base-only workflow would already be superseded.

- [ ] **Step 2: Create the workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-lint-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Lint boundaries
        run: pnpm run lint:boundaries

      - name: Test
        run: pnpm test
```

`pnpm/action-setup@v4` reads the pnpm version to install from `package.json`'s `packageManager` field automatically — no version needs to be hardcoded here, so it can never drift from what Plan 01 declared. Same idea for `node-version-file: '.nvmrc'`.

- [ ] **Step 3: Validate the YAML is well-formed**

Run: `npx -y js-yaml .github/workflows/ci.yml`
Expected: prints the parsed YAML structure back to stdout with no error — this is a syntax check only (a full GitHub-side validation happens in Task 2).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add base GitHub Actions workflow (build/lint/test)"
```

---

### Task 2: Verify the workflow runs green on GitHub

**Files:** none created — verification only.

**Interfaces:** none.

- [ ] **Step 1: Confirm with the user before pushing**

This step pushes a commit to the remote and (if not already on a PR branch) opens a pull request — both are actions with effects visible to others. **Pause here and get explicit confirmation from the user before proceeding**, per the project's git safety guidance. Do not treat completing Task 1 as implicit permission to push.

- [ ] **Step 2: Push and trigger the workflow**

Once confirmed, run (substituting your actual current branch name if not on `main`):

```bash
git push
```

If not on `main`, also run: `gh pr create --title "Add CI pipeline" --body "Adds the base GitHub Actions workflow from docs/superpowers/plans/2026-07-08-ci-pipeline.md."`

- [ ] **Step 3: Watch the run and confirm it succeeds**

Run: `gh run watch`
Expected: the run reaches conclusion `success`, with the `build-lint-test` job's `Build`, `Lint`, `Lint boundaries`, and `Test` steps all green.

If it fails, run `gh run view --log-failed` to see the exact failing step's output before making any fix.

---

## Definition of Done

- `.github/workflows/ci.yml` exists, triggers on push to `main` and on pull requests.
- A real GitHub Actions run (not just local YAML validation) has completed successfully, confirmed via `gh run watch` (Task 2).
- The workflow uses the same pnpm version and Node version as local development (via `packageManager` and `.nvmrc`, not hardcoded).
- No database service is configured yet — that's Plan 02 Task 6's responsibility, added exactly when `apps/api` introduces a Postgres dependency.
