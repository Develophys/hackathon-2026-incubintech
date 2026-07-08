# Zelo

Mobile-first PWA for confidential medical burnout triage and support. See `general-documentations/documentacao-produto/prd.md` for product requirements and `docs/superpowers/specs/2026-07-07-pwa-architecture.md` for the technical architecture.

## Repository Map

- `general-documentations/` — product docs: PRD, personas, roadmap, problem statement, source briefing PDFs
- `jornada-checkpoints/` — official Jornada Incubintech checkpoint submission deliverables
- `imported-skills/` — vendored pm-skills plugin, used to produce the documents above
- `docs/superpowers/specs/` — technical architecture spec(s)
- `docs/superpowers/plans/` — step-by-step implementation plans for the application
- `apps/`, `packages/`, `docker/` — the application itself (see "Monorepo Structure" below)

## Monorepo Structure

- `apps/web` — React + Vite PWA frontend
- `apps/api` — NestJS backend
- `packages/domain` — shared Zod schemas + TS types (no business logic)
- `packages/config` — shared tsconfig/eslint/prettier/dependency-cruiser base config

## Commands

- `pnpm install` — install all workspace dependencies
- `pnpm build` — build all packages/apps in dependency order (Turborepo)
- `pnpm lint` — lint all packages/apps
- `pnpm lint:boundaries` — enforce Clean Architecture layer boundaries (dependency-cruiser)
- `pnpm test` — run all test suites
