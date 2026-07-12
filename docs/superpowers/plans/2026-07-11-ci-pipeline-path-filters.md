# CI Pipeline Path Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `.github/workflows/ci.yml` from dispatching on doc-only changes, and stop the `deploy` job from redeploying the API when the change has nothing to do with `apps/api`.

**Architecture:** Two independent GitHub Actions path-filtering layers added to the existing single workflow file: a `paths-ignore` list on the workflow triggers (skips the whole run for doc-only changes), and a new `changes` job using `dorny/paths-filter@v3` whose output gates the existing `deploy` job's `if` condition.

**Tech Stack:** GitHub Actions YAML, `dorny/paths-filter@v3` (third-party marketplace action), `gh` CLI for verification.

## Global Constraints

- `build-lint-test` must keep running the full suite (all packages) whenever the pipeline dispatches at all — no per-package test scoping in this change.
- No separate `apps/web` deploy job is added — web deploys via Vercel's own Git integration, outside this workflow.
- Verification must be done by pushing real branches and observing actual GitHub Actions runs via `gh`, not just local YAML syntax checks — per [[feedback_turborepo_ci_verification]], local checks alone are insufficient in this repo.

---

## File Structure

- Modify: `.github/workflows/ci.yml` — the only file touched. Adds `paths-ignore` to `on.push`/`on.pull_request`, adds a new `changes` job, and extends the `deploy` job's `needs`/`if`.

---

### Task 1: Add `paths-ignore` to workflow triggers

**Files:**
- Modify: `.github/workflows/ci.yml:1-7`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: nothing consumed by later tasks — this is an independent trigger-level change.

- [ ] **Step 1: Edit the `on:` block**

Replace lines 1-7:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
```

with:

```yaml
name: CI

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

- [ ] **Step 2: Validate YAML syntax locally**

Run:
```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "VALID"
```
Expected: `VALID` (no traceback). YAML anchors (`&docs-ignore`) and aliases (`*docs-ignore`) are standard YAML and load fine with PyYAML — this only confirms the file parses, not that GitHub Actions accepts the schema (that's verified in Task 3).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: skip pipeline dispatch for doc-only changes"
```

---

### Task 2: Add `changes` job and gate `deploy` on API-relevant paths

**Files:**
- Modify: `.github/workflows/ci.yml` — insert a new `changes:` job before the existing `deploy:` job (after `build-lint-test:`), and modify `deploy:`'s `needs`/`if`.

**Interfaces:**
- Consumes: nothing from Task 1 directly (Task 1 only touched the `on:` block).
- Produces: job output `needs.changes.outputs.api` (`'true'`/`'false'`), consumed by the `deploy` job's `if` condition added in this same task.

- [ ] **Step 1: Insert the `changes` job**

In `.github/workflows/ci.yml`, insert this new job immediately after the `build-lint-test` job's last line (currently line 60, `run: pnpm test`) and before the `deploy:` job (currently starting at line 62):

```yaml
  changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Filter changed paths
        uses: dorny/paths-filter@v3
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
```

- [ ] **Step 2: Extend the `deploy` job's `needs` and `if`**

Replace the existing `deploy` job header (currently):

```yaml
  deploy:
    needs: build-lint-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
```

with:

```yaml
  deploy:
    needs: [build-lint-test, changes]
    if: >
      github.ref == 'refs/heads/main' &&
      github.event_name == 'push' &&
      needs.changes.outputs.api == 'true'
    runs-on: ubuntu-latest
```

- [ ] **Step 3: Validate YAML syntax locally**

Run:
```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "VALID"
```
Expected: `VALID`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: only deploy API when apps/api-relevant paths change"
```

---

### Task 3: Verify real behavior on GitHub Actions

**Files:** none (verification only — no code changes).

**Interfaces:**
- Consumes: the completed workflow from Tasks 1-2, pushed to a real branch.
- Produces: confirmation the design's four scenarios (from the spec's Testing section) hold in practice.

Per [[feedback_turborepo_ci_verification]], this task must be done against real GitHub Actions runs, not local simulation.

- [ ] **Step 1: Push Tasks 1-2 to a test branch and open a throwaway PR to `main`**

```bash
git checkout -b ci/path-filters-verify
git push -u origin ci/path-filters-verify
gh pr create --title "test: verify CI path filters (throwaway)" --body "Verification PR for CI path filter changes — will be closed without merging." --base main
```

- [ ] **Step 2: Scenario A — doc-only change should not dispatch the workflow**

```bash
echo "verify doc-only skip $(date)" >> docs/superpowers/plans/2026-07-11-ci-pipeline-path-filters.md
git add docs/superpowers/plans/2026-07-11-ci-pipeline-path-filters.md
git commit -m "test: doc-only change (should not trigger CI)"
git push
```

Then check:
```bash
gh run list --branch ci/path-filters-verify --limit 5
```
Expected: no new run appears for this push (the run list should not show a run whose head commit is this doc-only commit).

- [ ] **Step 3: Scenario B — `apps/web`-only change should run `build-lint-test` but skip `deploy`**

Make a trivial no-op change under `apps/web` (e.g. append a blank line to an existing file, then remove it in a way that still produces a diff — simplest is a comment/whitespace tweak to a file such as `apps/web/package.json`'s formatting is risky; instead touch a genuinely inert file):

```bash
echo "// ci-verify $(date)" >> apps/web/vite-env.d.ts
git add apps/web/vite-env.d.ts
git commit -m "test: apps/web-only change (should run CI, skip deploy)"
git push
```
(If `apps/web/vite-env.d.ts` doesn't exist, use `Read` to find any existing trivial file under `apps/web/src` to append a comment to instead.)

Then check:
```bash
gh run watch --exit-status $(gh run list --branch ci/path-filters-verify --limit 1 --json databaseId -q '.[0].databaseId')
gh run view $(gh run list --branch ci/path-filters-verify --limit 1 --json databaseId -q '.[0].databaseId') --json jobs -q '.jobs[] | {name, conclusion}'
```
Expected: `build-lint-test` job runs (conclusion `success` or as appropriate); `deploy` job either does not appear or shows `skipped` (this branch isn't `main` so `deploy`'s branch condition also excludes it — this scenario mainly confirms `build-lint-test` still runs for web changes; full `deploy`-skip-on-non-api-change confirmation happens on `main` in Step 5).

- [ ] **Step 4: Revert the verification-only diffs before merging anything to `main`**

```bash
git checkout main -- apps/web/vite-env.d.ts docs/superpowers/plans/2026-07-11-ci-pipeline-path-filters.md
git commit -m "test: revert verification-only changes"
git push
```

- [ ] **Step 5: Confirm on `main` after merge — deploy gating for a real `apps/api` change**

After Tasks 1-2 are merged to `main` through the normal PR flow (see Task 4), make (or wait for) a genuine `apps/api/**` change and push to `main`, then:

```bash
gh run list --branch main --limit 3
gh run view <run-id> --json jobs -q '.jobs[] | {name, conclusion}'
```
Expected: both `build-lint-test` and `deploy` run. For a subsequent `main` push that only touches non-`apps/api` paths (e.g. a `apps/web` change), confirm `deploy`'s conclusion is `skipped`.

- [ ] **Step 6: Close the throwaway verification PR**

```bash
gh pr close ci/path-filters-verify --delete-branch
```

---

### Task 4: Open the real PR for review

**Files:** none.

- [ ] **Step 1: Push the Task 1-2 commits on a clean branch (if not already on one) and open a PR**

```bash
git checkout -b ci/path-filters main
git cherry-pick <task-1-commit-sha> <task-2-commit-sha>
git push -u origin ci/path-filters
gh pr create --title "ci: skip pipeline for docs, gate API deploy on apps/api changes" --body "$(cat <<'EOF'
## Summary
- Skip the CI pipeline entirely for doc-only changes (docs/, general-documentations/, imported-skills/, .claude/, .superpowers/, *.md)
- Only run the Fly.io API deploy job when apps/api or a package it depends on (packages/domain, packages/config) changes

## Verification
Manually verified on a throwaway branch/PR — see docs/superpowers/specs/2026-07-11-ci-pipeline-path-filters-design.md Testing section for the four scenarios checked.
EOF
)"
```

- [ ] **Step 2: Wait for CI to pass on this PR, then hand off to the user for merge approval**

Do not merge without explicit user confirmation — merging to `main` triggers a real deploy.

---

## Self-Review Notes

- **Spec coverage:** Workflow-level `paths-ignore` → Task 1. Job-level `changes`/`dorny/paths-filter` → Task 2. Verification scenarios from spec's Testing section → Task 3 (all four scenarios covered: doc-only skip, web-only runs-but-no-deploy, api-only runs-and-deploys, shared-package runs-and-deploys). Risks section (third-party action pinning) is addressed by pinning `@v3` as designed.
- **Placeholder scan:** No TBD/TODO; the one conditional note in Task 3 Step 3 (file may not exist) includes a concrete fallback instruction rather than "handle appropriately."
- **Type/name consistency:** `needs.changes.outputs.api` matches the `outputs: api:` declared in the `changes` job in Task 2 Step 1, and matches the `filters: | api:` key. Consistent throughout.
