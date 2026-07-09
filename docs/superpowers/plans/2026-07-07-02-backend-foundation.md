# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the NestJS backend skeleton (`apps/api`) with Prisma/Postgres wiring, the module folder convention (`application/ports` + `infrastructure`), and one working example module (`health`) that proves the whole Port/Adapter + DI pattern end-to-end — the pattern every future feature module (chat, assessment, crisis) copies.

**Architecture:** NestJS with DI as the Dependency Inversion mechanism. Each module defines `application/ports` (interfaces) and `infrastructure` (concrete implementations, bound to port tokens in the module's providers). `PrismaService` is a global module injected wherever persistence is needed. No feature logic (assessment scoring, chat, crisis) is implemented here — see Plans 05/06.

**Tech Stack:** NestJS (Express platform), TypeScript (ESM/NodeNext for `apps/api`), Prisma 7, PostgreSQL, Vitest + Supertest, dependency-cruiser.

## Global Constraints

- `apps/api` compiles to **ESM** (`module`/`moduleResolution: "NodeNext"`, `"type": "module"` in its `package.json`) — a deliberate, isolated exception to Plan 01 Task 3's shared CommonJS base. Prisma 7's generated client ships ESM-only (no CJS output), so `apps/api` cannot stay on CommonJS once it depends on Prisma. `packages/domain` and `apps/web` are unaffected and remain CommonJS per Plan 01 — Node's ESM loader can still `import` a CommonJS package's default export (`@zelo/domain`) from `apps/api`'s ESM context without special handling. This override lives entirely in `apps/api/tsconfig.json` and `apps/api/package.json` (Task 1); no already-merged Plan 01 file changes.
- Because `apps/api` runs under Node's `NodeNext` module resolution, every relative import between hand-written source files in `apps/api/src` must include an explicit extension. Rather than the common (but confusing) convention of writing `.js` against `.ts` source, this plan enables TypeScript 5.7+'s `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` (Task 1 Step 2) so imports can say `.ts` — matching the actual source filename — and `tsc` rewrites it to `.js` in the compiled output. This does **not** apply to imports of already-compiled code (e.g. the Prisma-generated client, Task 2), which keep their real `.js` extension since there's no `.ts` source to reference. Every code block in this plan (and Plans 05/06, which build on it) already reflects this.
- `application/` (ports + use-cases) must never import `infrastructure/`, `@prisma/client`, or `@nestjs/platform-express` directly — only port tokens and `@nestjs/common` (DI decorators) are allowed there (spec Section C).
- The backend must never define a DTO/controller shape that accepts raw assessment answers — this plan does not touch assessment endpoints at all (that's Plan 06), so this constraint has nothing to violate yet, but the pattern established here (Zod-validated DTOs matching `packages/domain` schemas) is what Plan 06 will follow.
- Requires a local Postgres instance reachable at `DATABASE_URL` to complete Task 2's verification steps — Task 2 Step 1 starts one via plain `docker run` (temporary, ad hoc). Plan 04 formalizes this into `docker-compose.yml`.
- **Every NestJS constructor-injected parameter must use explicit `@Inject(Token)` — including class tokens, not just `Symbol` tokens.** NestJS's default (implicit, type-based) constructor injection relies on `design:paramtypes` decorator metadata, which `tsc` emits (with `emitDecoratorMetadata: true`, already set) but **Vitest's esbuild-based TS transform does not** — a well-known, longstanding esbuild limitation. Under implicit injection this doesn't fail loudly: NestJS silently resolves the parameter as `undefined`, so a test only surfaces it as a confusing downstream `TypeError` (e.g. `Cannot read properties of undefined (reading 'execute')`) or an unexplained 500 response, not a clear DI error. `apps/api/vitest.config.ts`'s `setupFiles: ["reflect-metadata"]` (Task 1 Step 3) is necessary but not sufficient — it makes `Reflect.metadata` exist, it doesn't make the missing parameter-type metadata appear. This constraint binds every future module (Task 3 here, and Plans 05/06's `chat`/`assessment` modules) — every code block in this plan and Plans 05/06 already reflects it.

---

### Task 1: NestJS application skeleton

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `@zelo/config/tsconfig.base.json` (Plan 01 Task 3).
- Produces: a bootable NestJS app on port 3000. `AppModule` is the root module Task 2 (Prisma) and Task 3 (health module) both register into.

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@zelo/api",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "dev": "tsx watch src/main.ts",
    "lint": "eslint src",
    "lint:boundaries": "depcruise src --config .dependency-cruiser.cjs",
    "test": "vitest run",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@prisma/client": "^7.8.0",
    "@zelo/domain": "workspace:*",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.4.0",
    "@types/node": "^20.16.0",
    "@types/supertest": "^6.0.2",
    "@zelo/config": "workspace:*",
    "dependency-cruiser": "^16.4.0",
    "dotenv": "^16.4.0",
    "prisma": "^7.8.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

`"type": "module"` is required because Prisma 7's generated client ships ESM-only (see Global Constraints). The `postinstall: "prisma generate"` script is added later, in Task 2 Step 6 — not here — because it requires `prisma/schema.prisma` to exist; adding it in this task would make `pnpm install` exit non-zero (Prisma's CLI errors on a missing schema) for the entire duration between this commit and Task 2's. `prisma:generate` is present from the start for manual re-runs after a schema edit.

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@zelo/config/tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "outDir": "dist",
    "rootDir": "src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "dist", "generated"]
}
```

`strictPropertyInitialization: false` is scoped to this app only (not the shared base) — Nest DI-injected class properties are assigned by the framework, not the constructor body, so the compiler can't see the initialization.

`module`/`moduleResolution: "NodeNext"` override the shared base's `"CommonJS"`/`"Node"` (Plan 01 Task 3) — required because Prisma 7's client is ESM-only (see Global Constraints). `generated` is excluded from `include` because Task 2 makes `prisma generate` write pre-built client code there — it's build output, not source `apps/api` owns, the same reason `dist` is excluded. (Task 2 Step 9 widens this once Prisma 7.8's actual generated output shape is known — the generated client ships real `.ts` source, not just prebuilt `.js`/`.d.ts` — see that step's rationale.)

`allowImportingTsExtensions` + `rewriteRelativeImportExtensions` (TypeScript 5.7+, hence the `typescript` bump to `^5.7.0` in Step 1) let relative imports between hand-written files say `.ts` (matching the real filename) instead of the more common but confusing NodeNext convention of writing `.js` against `.ts` source — `tsc` rewrites `.ts` specifiers to `.js` automatically at emit time.

- [ ] **Step 3: Create `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
    setupFiles: ["reflect-metadata"],
  },
});
```

`setupFiles: ["reflect-metadata"]` makes `Reflect.metadata`/`Reflect.defineMetadata` available in the Vitest worker process — `main.ts` already imports `reflect-metadata` for the real running app, but nothing does that for tests otherwise. This alone doesn't solve NestJS DI under Vitest (see the Global Constraints note on `@Inject`), but its absence would break class-decorator metadata entirely, not just constructor-parameter injection.

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: completes without error; `apps/api` appears in `pnpm -r list --depth -1`.

- [ ] **Step 5: Create the root application module**

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";

@Module({
  imports: [],
})
export class AppModule {}
```

- [ ] **Step 6: Create the entry point**

Create `apps/api/src/main.ts`:

```ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Zelo API listening on port ${port}`);
}

bootstrap();
```

- [ ] **Step 7: Verify the app builds**

Run: `pnpm --filter @zelo/api build`
Expected: completes without error; `apps/api/dist/main.js` exists.

- [ ] **Step 8: Verify the app boots**

Run: `pnpm --filter @zelo/api start`
Expected: console prints `Zelo API listening on port 3000`. Stop it with Ctrl+C once confirmed.

- [ ] **Step 9: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): bootstrap NestJS application skeleton"
```

---

### Task 2: Prisma + PostgreSQL wiring

**Files:**
- Create: `apps/api/prisma.config.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/` (generated by `prisma migrate dev` in Step 7, not hand-written)
- Create: `apps/api/generated/prisma/` (generated by `prisma generate` in Step 8, not hand-written)
- Modify: `apps/api/package.json` (adds the `postinstall` script in Step 6; adds driver-adapter deps and the `start` script in Step 9)
- Modify: `apps/api/tsconfig.json` (widens `rootDir`/`include` in Step 9)
- Modify: root `.gitignore` (adds `apps/**/generated/` in Step 9)
- Create: `apps/api/.env.example`
- Create: `apps/api/src/shared/prisma/prisma.service.ts`
- Create: `apps/api/src/shared/prisma/prisma.service.test.ts`
- Create: `apps/api/src/shared/prisma/prisma.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces: `PrismaService` (extends `PrismaClient`, connects `onModuleInit`, disconnects `onModuleDestroy`) exported by the global `PrismaModule`. Task 3's health check and every future data-owning module (Plans 05/06) inject `PrismaService`.

- [ ] **Step 1: Start a temporary local Postgres for development/testing**

Run:
```bash
docker run --name zelo-postgres-dev -e POSTGRES_USER=zelo -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=zelo -p 5432:5432 -d postgres:16-alpine
```
Expected: prints a container ID. This is a throwaway local instance for verifying this plan only — Plan 04 replaces it with `docker-compose.yml`.

Run: `docker ps --filter name=zelo-postgres-dev`
Expected: shows the container with status "Up".

- [ ] **Step 2: Create `apps/api/.env.example`**

```
DATABASE_URL="postgresql://zelo:devpassword@localhost:5432/zelo?schema=public"
PORT=3000
```

- [ ] **Step 3: Create a local `.env` from the example (not committed — already gitignored by Plan 01 Task 1)**

Run: `cp apps/api/.env.example apps/api/.env`
Expected: `apps/api/.env` now exists with the same content.

- [ ] **Step 4: Create `apps/api/prisma.config.ts`**

Prisma 7 reads schema location, migrations path, and the datasource URL from this file instead of `--schema`/`--url` CLI flags:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

`import "dotenv/config"` loads `apps/api/.env` (Step 3) before `env("DATABASE_URL")` reads it — Prisma 7's CLI no longer auto-loads `.env` itself, unlike Prisma 5/6.

- [ ] **Step 5: Create `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// No models yet — the first real model (Assessment) is added in Plan 06.
// This file exists now so `prisma generate` and DB connectivity can be
// verified as part of the foundation, independent of any feature.
```

`provider = "prisma-client"` (not the old `"prisma-client-js"`) and an explicit `output` are both required in Prisma 7 — the client generator no longer defaults to a `node_modules/.prisma/client` location. `output` is resolved relative to this schema file, so `../generated/prisma` lands at `apps/api/generated/prisma` (excluded from `tsconfig.json`'s `include` in Task 1 Step 2, since it's generated code, not source — Task 2 Step 9 widens this once the generated client's real shape is known).

The `datasource` block deliberately has **no** `url` field — Prisma 7.8 rejects it outright: `prisma migrate dev` with `url = env("DATABASE_URL")` here fails with `error P1012: The datasource property 'url' is no longer supported in schema files. Move connection URLs for Migrate to 'prisma.config.ts' and pass either 'adapter' ... or 'accelerateUrl' ... to the PrismaClient constructor.` The URL already lives solely in `prisma.config.ts`'s `datasource.url` (Step 4) for Migrate's purposes; Step 9/Step 12 below cover the client-side half of that same message (the `adapter` the generated `PrismaClient` now requires).

- [ ] **Step 6: Add the `postinstall` script now that `schema.prisma` exists**

Modify `apps/api/package.json` — add to `scripts`, as the first entry:

```json
"postinstall": "prisma generate",
```

This is deliberately added here, not in Task 1 — `prisma generate` (which `postinstall` invokes) requires `prisma/schema.prisma` to exist, and it does now that Step 5 created it. Adding it earlier would make `pnpm install` exit non-zero for the entire span between Task 1's commit and this one. From this commit onward, every future `pnpm install` (including in CI, Task 6) regenerates the client automatically; `prisma:generate` (added in Task 1) remains available for a manual re-run after a schema edit without a full reinstall.

- [ ] **Step 7: Initialize Prisma migration history**

Run: `pnpm --filter @zelo/api exec prisma migrate dev --name init`
Expected: creates `apps/api/prisma/migrations/<timestamp>_init/` with an empty `migration.sql` (there are no models yet, so the diff is empty) and a `migration_lock.toml`, and applies it to the database. No `--schema` flag — `prisma.config.ts` (Step 4) already declares the schema location.

Using `migrate dev` (not just `generate`) here — even with zero models — establishes real migration history from the start. Plan 04's `docker-compose` runs `prisma migrate deploy` on container start, which needs an existing migrations directory to apply; Plan 06 later appends its `Assessment` model as a second migration onto this same history, exactly as it would with any real schema change.

- [ ] **Step 8: Generate the Prisma Client**

Run: `pnpm --filter @zelo/api exec prisma generate`
Expected: prints `Generated Prisma Client` and creates `apps/api/generated/prisma/`. Prisma 7's `migrate dev` no longer regenerates the client automatically (unlike Prisma 5/6), so this is now a separate, required step — `postinstall` (Step 6) covers this automatically on every future `pnpm install`, but the client doesn't exist yet on this first run until this step completes.

Inspect `apps/api/generated/prisma/` now. Prisma 7.8's `prisma-client` generator ships the client as **real, uncompiled TypeScript source** (`client.ts`, `enums.ts`, `models.ts`, `internal/`, etc.) alongside a prebuilt `client.js`/`client.d.ts` pair — it is not a plain `.js`/`.d.ts`-only build artifact the way earlier Prisma versions' `prisma-client-js` output was. Step 9 below adapts to this.

- [ ] **Step 9: Add the driver-adapter dependencies and widen `tsconfig.json`/`package.json` for the generated client's real shape**

Modify `apps/api/package.json` — add to `dependencies`:

```json
"@prisma/adapter-pg": "^7.8.0",
"pg": "^8.22.0",
```

add to `devDependencies`:

```json
"@types/pg": "^8.20.0",
```

and change the `start` script:

```json
"start": "node dist/src/main.js",
```

Modify `apps/api/tsconfig.json`:

```json
{
  "extends": "@zelo/config/tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "outDir": "dist",
    "rootDir": ".",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  },
  "include": ["src", "generated"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

Modify root `.gitignore` — add:

```
apps/**/generated/
```

Run: `pnpm install`
Expected: completes without error.

Two things force these changes, both consequences of Prisma 7.8's generated output being real TypeScript source rather than a prebuilt-only artifact:

1. **The client now requires an explicit driver `adapter`, not an implicit URL.** With `url` removed from `schema.prisma` (Step 5), `PrismaClientOptions` becomes a discriminated union requiring either `adapter` (a `SqlDriverAdapterFactory`, e.g. from `@prisma/adapter-pg`) or `accelerateUrl` — there's no more bare-URL passthrough for a direct connection. `@prisma/adapter-pg`'s `PrismaPg` wraps a `pg` connection pool; Step 12 below wires it into `PrismaService`'s constructor.
2. **`rootDir` must widen to cover `generated/`.** You might expect importing `generated/prisma/client.js` (the prebuilt file) instead of `client.ts` would sidestep pulling TypeScript source into the build — it doesn't: under `moduleResolution: "NodeNext"` with `allowImportingTsExtensions`, TypeScript resolves a `.js`-extension relative specifier back to a sibling `.ts` file for type-checking whenever one exists, so `tsc` pulls in `generated/prisma/client.ts` either way once `PrismaService` (Step 12) imports it. With `rootDir: "src"` (Task 1), that file sits outside the root and `tsc` rejects it: `error TS6059: File '.../generated/prisma/client.ts' is not under 'rootDir' '.../src'`. Widening `rootDir` to `"."` and `include` to cover both `src` and `generated` resolves this — and correspondingly moves `tsc`'s emitted entry point from `dist/main.js` to `dist/src/main.js` (since `dist/generated/prisma/*` becomes a build-output sibling of `dist/src/*`), hence the `start` script change above.

`apps/api/generated/` is added to `.gitignore` (mirroring `dist/`) since it's fully reproducible via `postinstall`/`prisma generate` and shouldn't be committed.

- [ ] **Step 10: Write the failing test for `PrismaService` connectivity**

Create `apps/api/src/shared/prisma/prisma.service.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "./prisma.service.ts";

describe("PrismaService", () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("connects to Postgres and can execute a raw query", async () => {
    const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`;

    expect(result[0]?.result).toBe(1);
  });
});
```

- [ ] **Step 11: Run the test to verify it fails**

Run: `pnpm --filter @zelo/api test`
Expected: FAIL — `Cannot find module './prisma.service.ts'`.

- [ ] **Step 12: Implement `PrismaService`**

Create `apps/api/src/shared/prisma/prisma.service.ts`:

```ts
import "dotenv/config";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.ts";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

`PrismaClient` now comes from the generated output path (Step 5's `output = "../generated/prisma"`), not from `@prisma/client` directly — Prisma 7 no longer re-exports the client from the package itself. The import uses the `.ts` extension (not `.js`) because Step 9 already widened `rootDir`/`include` to treat `generated/` as part of the compiled source set, matching the `.ts`-import convention already used for hand-written files in this ESM setup. The explicit constructor passing `adapter: new PrismaPg(...)` is required — see Step 9's rationale for why Prisma 7.8 no longer accepts an implicit connection URL. `import "dotenv/config"` is needed here specifically (in addition to `prisma.config.ts`'s own import) because Vitest doesn't load `.env` into `process.env` on its own, and this constructor reads `process.env.DATABASE_URL` directly — without it, `PrismaService`'s tests would fail with a Postgres auth error, not a "cannot connect" error, since the adapter would receive `undefined` as its connection string.

- [ ] **Step 13: Run the test to verify it passes**

Run: `pnpm --filter @zelo/api test`
Expected: PASS — 1 test passed. (Requires the Postgres container from Step 1 to be running.)

- [ ] **Step 14: Create the global `PrismaModule`**

Create `apps/api/src/shared/prisma/prisma.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.ts";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 15: Register `PrismaModule` in `AppModule`**

Modify `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

- [ ] **Step 16: Commit**

```bash
git add apps/api
git commit -m "feat(api): add Prisma 7/PostgreSQL wiring via global PrismaModule"
```

---

### Task 3: Health module — the reference Port/Adapter pattern

**Files:**
- Create: `apps/api/src/modules/health/application/ports/database-health.port.ts`
- Create: `apps/api/src/modules/health/application/use-cases/check-health.use-case.ts`
- Create: `apps/api/src/modules/health/application/use-cases/check-health.use-case.test.ts`
- Create: `apps/api/src/modules/health/infrastructure/prisma-database-health.adapter.ts`
- Create: `apps/api/src/modules/health/infrastructure/health.controller.ts`
- Create: `apps/api/src/modules/health/infrastructure/health.controller.test.ts`
- Create: `apps/api/src/modules/health/health.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 2).
- Produces: `GET /health` returning `{ status: "ok" | "degraded", database: boolean }`. This exact module shape (`application/ports` → `application/use-cases` → `infrastructure` adapter → `infrastructure` controller → `*.module.ts` DI binding) is the template Plans 05 and 06 copy for `chat` and `assessment`.

- [ ] **Step 1: Write the failing unit test for `CheckHealthUseCase`**

Create `apps/api/src/modules/health/application/use-cases/check-health.use-case.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CheckHealthUseCase } from "./check-health.use-case.ts";
import type { DatabaseHealthPort } from "../ports/database-health.port.ts";

class FakeHealthyDatabase implements DatabaseHealthPort {
  async isReachable(): Promise<boolean> {
    return true;
  }
}

class FakeUnreachableDatabase implements DatabaseHealthPort {
  async isReachable(): Promise<boolean> {
    return false;
  }
}

describe("CheckHealthUseCase", () => {
  it("reports 'ok' when the database is reachable", async () => {
    const useCase = new CheckHealthUseCase(new FakeHealthyDatabase());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "ok", database: true });
  });

  it("reports 'degraded' when the database is unreachable", async () => {
    const useCase = new CheckHealthUseCase(new FakeUnreachableDatabase());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "degraded", database: false });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zelo/api test`
Expected: FAIL — `Cannot find module '../ports/database-health.port'`.

- [ ] **Step 3: Define the port**

Create `apps/api/src/modules/health/application/ports/database-health.port.ts`:

```ts
export interface DatabaseHealthPort {
  isReachable(): Promise<boolean>;
}

export const DATABASE_HEALTH_PORT = Symbol("DATABASE_HEALTH_PORT");
```

- [ ] **Step 4: Implement the use-case**

Create `apps/api/src/modules/health/application/use-cases/check-health.use-case.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_HEALTH_PORT, type DatabaseHealthPort } from "../ports/database-health.port.ts";

export interface HealthResult {
  status: "ok" | "degraded";
  database: boolean;
}

@Injectable()
export class CheckHealthUseCase {
  constructor(
    @Inject(DATABASE_HEALTH_PORT) private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  async execute(): Promise<HealthResult> {
    const database = await this.databaseHealth.isReachable();
    return { status: database ? "ok" : "degraded", database };
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @zelo/api test`
Expected: PASS — 2 tests passed. Note the test never imports NestJS or Prisma — it instantiates `CheckHealthUseCase` directly with in-memory fakes, proving the use-case has no infrastructure dependency.

- [ ] **Step 6: Implement the Prisma-backed adapter**

Create `apps/api/src/modules/health/infrastructure/prisma-database-health.adapter.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseHealthPort } from "../application/ports/database-health.port.ts";
import { PrismaService } from "../../../shared/prisma/prisma.service.ts";

@Injectable()
export class PrismaDatabaseHealthAdapter implements DatabaseHealthPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async isReachable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

`@Inject(PrismaService)` is explicit here even though `PrismaService` is a class (not a Symbol token) — see the Global Constraints note on why implicit type-based injection silently fails under this project's test runner.

- [ ] **Step 7: Write the failing e2e test for the controller**

Create `apps/api/src/modules/health/infrastructure/health.controller.test.ts`:

```ts
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { HealthModule } from "../health.module.ts";
import { PrismaModule } from "../../../shared/prisma/prisma.module.ts";

describe("GET /health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, HealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns status ok with database true when Postgres is reachable", async () => {
    const response = await request(app.getHttpServer()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: true });
  });
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `pnpm --filter @zelo/api test`
Expected: FAIL — `Cannot find module '../health.module'`.

- [ ] **Step 9: Implement the controller**

Create `apps/api/src/modules/health/infrastructure/health.controller.ts`:

```ts
import { Controller, Get, Inject } from "@nestjs/common";
import { CheckHealthUseCase } from "../application/use-cases/check-health.use-case.ts";

@Controller("health")
export class HealthController {
  constructor(@Inject(CheckHealthUseCase) private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  async get() {
    return this.checkHealth.execute();
  }
}
```

`@Inject(CheckHealthUseCase)` is explicit for the same reason as `PrismaDatabaseHealthAdapter` above — see Global Constraints.

- [ ] **Step 10: Wire the module**

Create `apps/api/src/modules/health/health.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./infrastructure/health.controller.ts";
import { CheckHealthUseCase } from "./application/use-cases/check-health.use-case.ts";
import { PrismaDatabaseHealthAdapter } from "./infrastructure/prisma-database-health.adapter.ts";
import { DATABASE_HEALTH_PORT } from "./application/ports/database-health.port.ts";

@Module({
  controllers: [HealthController],
  providers: [
    CheckHealthUseCase,
    { provide: DATABASE_HEALTH_PORT, useClass: PrismaDatabaseHealthAdapter },
  ],
})
export class HealthModule {}
```

- [ ] **Step 11: Register `HealthModule` in `AppModule`**

Modify `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";
import { HealthModule } from "./modules/health/health.module.ts";

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm --filter @zelo/api test`
Expected: PASS — 3 tests passed (2 unit + 1 e2e). Requires the Postgres container from Task 2 Step 1 to still be running.

- [ ] **Step 13: Manually verify against the running app**

Run: `pnpm --filter @zelo/api start` (in one terminal), then in another:
Run: `curl http://localhost:3000/health`
Expected: `{"status":"ok","database":true}`. Stop the app with Ctrl+C once confirmed.

- [ ] **Step 14: Commit**

```bash
git add apps/api
git commit -m "feat(api): add health module as the reference Port/Adapter pattern"
```

---

### Task 4: Backend boundary enforcement

**Files:**
- Create: `apps/api/.dependency-cruiser.cjs`

**Interfaces:**
- Consumes: `@zelo/config/dependency-cruiser.base.cjs` (Plan 01 Task 6).
- Produces: a `lint:boundaries` check (script already defined in Task 1) that fails if `application/` imports `infrastructure/` or `@prisma/client`.

- [ ] **Step 1: Create `apps/api/.dependency-cruiser.cjs`**

```js
const base = require("@zelo/config/dependency-cruiser.base.cjs");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...base.forbidden,
    {
      name: "application-no-infrastructure-imports",
      comment: "application/ (ports + use-cases) must depend only on ports, never on concrete infrastructure — that's the Dependency Inversion boundary (spec Section C).",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "^src/modules/[^/]+/infrastructure" },
    },
    {
      name: "application-no-prisma-imports",
      comment: "application/ must never import @prisma/client directly — only through a port implemented in infrastructure/.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "node_modules/@prisma/client" },
    },
  ],
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

Note `@nestjs/common` is deliberately **not** forbidden from `application/` — DI decorators (`@Injectable`, `@Inject`) are framework wiring, not infrastructure, and every use-case in this codebase uses them (see `CheckHealthUseCase` in Task 3).

**Path prefix note:** `from`/`to` patterns are `^src/...`, not `^apps/api/src/...` — `depcruise src --config .dependency-cruiser.cjs` (Task 1's `lint:boundaries` script) runs with cwd = `apps/api` (via `pnpm --filter`/`turbo run`), so dependency-cruiser reports and matches module paths relative to that cwd (e.g. `src/modules/health/application/...`), never prefixed with `apps/api/`. Plan 01 Task 6 originally used the `packages/domain/`-prefixed form for `packages/domain`'s own config and discovered this the hard way — verified independently in that task's review by inspecting `depcruise`'s actual JSON output. This plan uses the corrected form from the start.

- [ ] **Step 2: Verify the rule passes on current (clean) code**

Run: `pnpm --filter @zelo/api lint:boundaries`
Expected: PASS — no dependency violations found.

- [ ] **Step 3: Prove the rule catches a violation**

Create a temporary file `apps/api/src/modules/health/application/use-cases/__boundary_violation.ts`:

```ts
import { PrismaDatabaseHealthAdapter } from "../../infrastructure/prisma-database-health.adapter.ts";

export const broken = PrismaDatabaseHealthAdapter;
```

Run: `pnpm --filter @zelo/api lint:boundaries`
Expected: FAIL — reports `application-no-infrastructure-imports` violation.

- [ ] **Step 4: Remove the temporary violation file**

```bash
rm apps/api/src/modules/health/application/use-cases/__boundary_violation.ts
```

Run: `pnpm --filter @zelo/api lint:boundaries`
Expected: PASS again.

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "chore(api): add dependency-cruiser boundary enforcement"
```

---

### Task 5: Full pipeline verification

**Files:** none created — verification only.

- [ ] **Step 1: Run the full pipeline from the monorepo root**

```bash
pnpm install
pnpm build
pnpm lint
pnpm run lint:boundaries
pnpm test
```

Expected: every command completes with exit code 0 across both `@zelo/domain` and `@zelo/api`. Requires the Postgres container from Task 2 Step 1 running.

- [ ] **Step 2: Stop and remove the temporary Postgres container**

Run: `docker stop zelo-postgres-dev && docker rm zelo-postgres-dev`
Expected: container stops and is removed — Plan 04's `docker-compose.yml` is the permanent replacement, so this ad hoc container shouldn't be left lingering.

- [ ] **Step 3: Add `apps/api/.env` handling note to root README**

Modify root `README.md` — append under "## Commands":

```markdown

## Backend local setup

`apps/api` requires a `DATABASE_URL` — copy `apps/api/.env.example` to `apps/api/.env` and point it at a running Postgres instance (see Plan 04 for the Docker Compose setup, or run one manually as shown in `docs/superpowers/plans/2026-07-07-02-backend-foundation.md` Task 2).
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document backend local Postgres setup"
```

---

### Task 6: Extend CI with a Postgres service for backend tests

**Files:**
- Modify: `.github/workflows/ci.yml` (created by `docs/superpowers/plans/2026-07-08-ci-pipeline.md`)

**Interfaces:**
- Consumes: the `build-lint-test` job created by the CI pipeline plan.
- Produces: the same job, now with a `postgres` service container and a `DATABASE_URL` env var, plus a migration step — so `apps/api`'s Postgres-dependent tests (`prisma.service.test.ts`, `health.controller.test.ts`) pass in CI exactly as they do locally against the ad hoc container from Task 2.

- [ ] **Step 1: Confirm the CI pipeline plan has already run**

Run: `cat .github/workflows/ci.yml 2>&1 || echo "not found"`
Expected: shows the base workflow from `docs/superpowers/plans/2026-07-08-ci-pipeline.md`. If "not found", run that plan first — this task modifies its output.

- [ ] **Step 2: Add the Postgres service and migration step**

Modify `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-lint-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: zelo
          POSTGRES_PASSWORD: devpassword
          POSTGRES_DB: zelo
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      DATABASE_URL: postgresql://zelo:devpassword@localhost:5432/zelo?schema=public
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

      - name: Generate Prisma Client
        run: pnpm --filter @zelo/api exec prisma generate

      - name: Apply database migrations
        run: pnpm --filter @zelo/api exec prisma migrate deploy

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Lint boundaries
        run: pnpm run lint:boundaries

      - name: Test
        run: pnpm test
```

`services.postgres` is a GitHub Actions service container — it starts before the job's steps run and is reachable at `localhost:5432` from them, the same way the local ad hoc container (Task 2 Step 1) is reachable during local development. `pnpm install`'s `postinstall` (Task 2 Step 6) already runs `prisma generate` once, but the explicit `Generate Prisma Client` step keeps this workflow's steps self-documenting and matches Plan 04's Docker image, which does the same. Neither `migrate deploy` nor `migrate dev` takes a `--schema` flag in Prisma 7 — both read schema/migrations location from `apps/api/prisma.config.ts` (Task 2 Step 4). The `Apply database migrations` step runs the same `prisma migrate deploy` command Plan 04's Docker image runs on container start, against the migration history created in this plan's Task 2 Step 7. `Build` moved after the Prisma steps because `tsc` needs the generated client (Task 2 Step 8's output) to type-check `PrismaService`'s import.

- [ ] **Step 3: Validate the YAML is well-formed**

Run: `npx -y js-yaml .github/workflows/ci.yml`
Expected: prints the parsed YAML structure back with no error.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Postgres service container for backend tests"
```

This change is verified automatically the next time a commit from this plan (or a later one) is pushed — no separate verification push is needed solely for this task, since Task 2 of the CI pipeline plan already established the confirm-before-push convention for this repo.

---

## Definition of Done

- `pnpm install && pnpm build && pnpm lint && pnpm run lint:boundaries && pnpm test` all pass from a clean checkout (given a reachable Postgres).
- `GET /health` returns `{"status":"ok","database":true}` when run against a live Postgres.
- The `health` module demonstrates the full pattern: `application/ports` → `application/use-cases` (unit-tested with fakes, zero framework/infra imports) → `infrastructure` adapter + controller → `*.module.ts` DI binding.
- A boundary violation (`application` importing `infrastructure` or `@prisma/client`) fails `lint:boundaries` (proven once in Task 4, not left in the codebase).
- `.github/workflows/ci.yml` runs a Postgres service container and applies migrations before tests, so CI exercises the same Postgres-dependent tests as local development (Task 6).
- No feature modules (`chat`, `assessment`, `crisis`) exist yet — out of scope for this plan (see Plans 05, 06).
