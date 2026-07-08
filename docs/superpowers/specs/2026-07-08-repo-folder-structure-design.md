---
artefato: repo-structure-spec
versão: "1.0"
criado: 2026-07-08
status: rascunho
owner: Mauricio Alexandre
---

# Repository Folder Structure

## Context

The team wants documentation, the pm-skills used to produce it, and the application itself (code, architecture docs, CI/devops config) all living in this same repository. By 2026-07-08 the repo already had an organic split in place — `general-documentations/` (product docs: PRD, personas, roadmap, briefing PDFs), `jornada-checkpoints/` (official Jornada submission deliverables), and `imported-skills/` (a vendored copy of the pm-skills plugin) — done independently of the six implementation plans in `docs/superpowers/plans/`. This spec fixes the full top-level layout so the two efforts (product docs, application code) coexist without collision, before any application code is scaffolded.

## Decision

Keep every existing top-level folder exactly where it is. Add the application/CI folders as new siblings at the repo root — not nested under a subfolder — since all six existing implementation plans already reference `apps/`, `packages/`, and `docker/` as root-relative paths, and moving them would require editing every plan for no benefit.

```
/
├── .github/workflows/        # NEW — CI (see "CI Plan" below)
├── apps/                     # NEW — Plans 02 (api), 03 (web)
├── packages/                 # NEW — Plan 01 (domain, config)
├── docker/                   # NEW — Plan 04
├── docs/superpowers/         # existing — specs/ and plans/
├── general-documentations/   # existing, untouched
├── jornada-checkpoints/      # existing, untouched
├── imported-skills/          # existing, untouched — vendored pm-skills plugin
├── pnpm-workspace.yaml, turbo.json, package.json, .gitignore, .dockerignore   # NEW — Plan 01
└── README.md                 # NEW/expanded — see "Repository Map" below
```

## Repository Map (root README addition)

Plan 01 Task 7 already creates/expands the root `README.md` with a "Monorepo Structure" section scoped to `apps/`/`packages/`. This spec adds a **"Repository Map"** section above it, covering every top-level folder (including the non-code ones), so a judge or new teammate opening the repo cold can orient in one read:

```markdown
## Repository Map

- `general-documentations/` — product docs: PRD, personas, roadmap, problem statement, source briefing PDFs
- `jornada-checkpoints/` — official Jornada Incubintech checkpoint submission deliverables
- `imported-skills/` — vendored pm-skills plugin, used to produce the documents above
- `docs/superpowers/specs/` — technical architecture spec(s)
- `docs/superpowers/plans/` — step-by-step implementation plans for the application
- `apps/`, `packages/`, `docker/` — the application itself (see "Monorepo Structure" below)
```

This is a direct edit to Plan 01 Task 7 (not yet executed), not a new plan.

## CI Plan

A new implementation plan, sequenced right after Plan 01 (only depends on the pnpm/turbo scripts existing), adds `.github/workflows/ci.yml`: on push/PR, spin up a Postgres service container, run `pnpm install && pnpm build && pnpm lint && pnpm run lint:boundaries && pnpm test` — the exact commands every existing plan's Definition of Done already asserts pass locally. Running it from Plan 01 onward means every subsequent plan (02-06) is protected by CI from its first commit, not bolted on at the end.

This is genuinely new scope beyond the six existing plans, so it gets its own plan document rather than a silent edit to an existing one.

## Out of Scope

- Real cloud deployment CI/CD (staging/production pipelines) — that's Gui's domain per `roadmap/gui.md`; this CI plan only covers local validation (lint/build/test) on every push/PR, not deployment.
- Reorganizing `general-documentations/` or `jornada-checkpoints/` internally — out of scope, not requested, and already settled by the team's own recent commits.
