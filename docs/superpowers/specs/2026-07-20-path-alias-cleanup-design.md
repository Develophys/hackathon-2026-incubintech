# Path alias cleanup (`../../` → `@/...`) — design spec

**Status:** design, ready to implement. Unrelated to the loading-state specs from the same day ([[2026-07-20-manager-dashboard-skeleton-design]], [[2026-07-20-assessment-submit-sync-indicator-design]]) — grouped only because the user raised all three in one message; this one ships first, independently.

## 1. Problem

`apps/web/src` has no path alias configured anywhere (`tsconfig.json`, `vite.config.ts`, `vitest.config.ts` all confirmed to have zero `paths`/`resolve.alias` entries). As a result, every cross-folder import uses relative traversal. A repo-wide scan (`from "\.\./..."` over `apps/web/src`) found:

- **255 relative-parent-import occurrences (`../` at least once) across 74 files.**
- Of those, **73 are exactly two levels deep (`../../`)**, in 45 files.
- **Zero occurrences of 3+ levels** (`../../../` or deeper) — the codebase never got that bad, but the two-level case is already common enough to be worth fixing.
- Highest per-file counts: `ManagerDashboardPage.tsx` (11), `HomePage.tsx` (11), `ManagerInsightHistoryPage.tsx` (10), `Phq9AssessmentPage.tsx` / `Gad7AssessmentPage.tsx` (8 each), `AssessmentResultPage.tsx` (8) — concentrated in `presentation/pages/*`.

## 2. Decision: single `@/*` alias, full sweep

Introduce one alias, `@/*` → `apps/web/src/*`, and rewrite **every** import/export specifier that starts with `../` (any depth: one level and two levels both count) to use it. `./` (same-directory) imports are left untouched — those aren't confusing and weren't the complaint.

Rejected alternative: multiple per-layer aliases (`@domain/`, `@presentation/`, `@infrastructure/`, `@ports/`, `@app/`). This monorepo has no existing alias convention to match (checked: no other app/package uses `@/`-style paths), and with only 74 files and no naming collisions between layers, a single alias is simpler to configure, document, and enforce than five.

## 3. Config changes

- **`apps/web/tsconfig.json`** — add to `compilerOptions`:
  ```json
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
  ```
- **`apps/web/vite.config.ts`** — add (Vite does not read tsconfig `paths` automatically without a plugin; going with a plain `resolve.alias` entry rather than pulling in `vite-tsconfig-paths` as a new dependency, since one static alias doesn't need a plugin):
  ```ts
  import path from "node:path";
  // ...
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  ```
- **`apps/web/vitest.config.ts`** — same `resolve.alias` block. Confirmed this file is a fully standalone `defineConfig` (does not import or merge `vite.config.ts`), so the alias must be duplicated here or Vitest's module resolution won't match Vite's at test time.

## 4. Codemod approach

Given 255 occurrences across 74 files, do this mechanically rather than by hand, to avoid transcription slips:

- A one-off Node script (scratchpad-only, not committed) that:
  1. Walks `apps/web/src/**/*.{ts,tsx}`.
  2. For each `import`/`export ... from` / dynamic `import(...)` specifier starting with `../`, resolves it to an absolute path relative to `apps/web/src`, then rewrites it as `@/<path-from-src>` (no extension, matching existing specifier conventions — e.g. `../../domain/assessment-scales/phq9` from `src/presentation/pages/Phq9AssessmentPage.tsx` becomes `@/domain/assessment-scales/phq9`).
  3. Leaves `./` specifiers untouched.
  4. Writes files back in place.
- Run after the codemod, in order: `tsc --noEmit` (catches any unresolved-path mistakes immediately), the full `vitest` suite, and `vite build`. Any failure means the codemod mis-rewrote something and needs a manual fix in that file.
- Spot-check 3–4 rewritten files by hand (favor the highest-count files: `ManagerDashboardPage.tsx`, `HomePage.tsx`) to confirm the rewrite reads naturally and nothing double-aliased.

## 5. Acceptance criteria

- `tsc --noEmit`, `vitest run`, and `vite build` all pass with zero relative-parent (`../`) imports remaining anywhere under `apps/web/src` (verified by re-running the same scan regex — expect 0 matches).
- No behavior change — this is a pure import-path rewrite; no runtime logic, component, or test assertion changes.
- CI is pushed and watched green per this repo's standing rule (local `pnpm test` passing is not sufficient sign-off).
