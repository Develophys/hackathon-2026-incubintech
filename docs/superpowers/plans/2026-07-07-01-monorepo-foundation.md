# Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the pnpm + Turborepo monorepo skeleton — `packages/domain` (shared types/schemas) and `packages/config` (shared tooling config) — with dependency-cruiser boundary enforcement wired into the lint pipeline. No app code (`apps/web`, `apps/api`) is created here — that's Plans 02/03.

**Architecture:** A pnpm workspace with `apps/*` and `packages/*`. Turborepo orchestrates `build`/`lint`/`test` across packages with correct dependency order and caching. `packages/domain` holds Zod schemas + inferred TS types only — no business logic, no framework imports — enforced by a dependency-cruiser rule from day one so the boundary can never silently erode.

**Tech Stack:** pnpm (workspaces), Turborepo, TypeScript, Zod, Vitest, dependency-cruiser, ESLint, Prettier.

## Global Constraints

- `packages/domain` must never import from `apps/*`, React, NestJS, or Prisma — types/schemas only (spec Decisions table, Section A).
- Package manager is pnpm exclusively — no npm/yarn lockfiles (spec Decisions table).
- Boundary violations must fail `turbo run lint`, not just print a warning (spec Section F).

---

### Task 1: Initialize the pnpm workspace root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `.gitignore` (extend existing if present)
- Create: `.nvmrc`

**Interfaces:**
- Produces: a pnpm workspace root that recognizes `apps/*` and `packages/*` as workspace members.

- [ ] **Step 1: Check current repo state**

Run: `git status --short`
Expected: no output, or only the files this plan is about to touch — confirm nothing unexpected is staged before starting.

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "zelo",
  "private": true,
  "version": "0.0.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "lint:boundaries": "turbo run lint:boundaries",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.0"
  },
  "packageManager": "pnpm@9.12.0"
}
```

- [ ] **Step 4: Create `.npmrc`**

```
engine-strict=true
auto-install-peers=true
```

- [ ] **Step 5: Create `.nvmrc`**

```
20
```

- [ ] **Step 6: Append monorepo-specific ignores to `.gitignore`**

Open the existing `.gitignore` and append (do not remove existing entries):

```
node_modules/
dist/
.turbo/
*.tsbuildinfo
.env
.env.*
!.env.example
```

- [ ] **Step 7: Install and verify the workspace resolves**

Run: `pnpm install`
Expected: completes without error (no workspace members exist yet, so this just installs root devDependencies — turbo, typescript).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .nvmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize pnpm workspace root"
```

---

### Task 2: Add Turborepo pipeline configuration

**Files:**
- Create: `turbo.json`

**Interfaces:**
- Consumes: nothing yet (no packages exist).
- Produces: `build`, `dev`, `lint`, `lint:boundaries`, and `test` pipeline tasks that every future package/app opts into via matching `package.json` scripts. Later tasks (Task 3+) rely on these exact task names.

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:boundaries": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

`dependsOn: ["^build"]` means a package's `build`/`lint`/`test` task waits for its workspace dependencies' `build` task first — this is what makes `packages/domain` build before `apps/web` or `apps/api` consume it later.

- [ ] **Step 2: Verify turbo recognizes the config with no packages yet**

Run: `pnpm exec turbo run build --dry-run`
Expected: output shows "No packages found" or an empty task list, without error (no packages exist yet — this just confirms `turbo.json` parses correctly).

- [ ] **Step 3: Commit**

```bash
git add turbo.json
git commit -m "chore: add Turborepo pipeline config"
```

---

### Task 3: Create `packages/config` with shared TypeScript/ESLint/Prettier base

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/eslint.base.mjs`
- Create: `packages/config/prettier.base.mjs`

**Interfaces:**
- Produces: `@zelo/config/tsconfig.base.json`, `@zelo/config/eslint.base.mjs`, `@zelo/config/prettier.base.mjs` — importable/extendable by every future package and app.

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@zelo/config",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./eslint.base": "./eslint.base.mjs",
    "./prettier.base": "./prettier.base.mjs"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "eslint": "^9.12.0",
    "prettier": "^3.3.0",
    "typescript-eslint": "^8.8.0"
  }
}
```

- [ ] **Step 2: Create `packages/config/tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "isolatedModules": true
  }
}
```

`module: "CommonJS"` is deliberate, not a default left unconsidered: NestJS (Plan 02) has real friction running under native ESM (loader flags, forced `.js`/`.ts` extensions on relative imports, decorator-metadata quirks), while CommonJS output is transparently consumable by NestJS, Vite (Plan 03 — esbuild pre-bundles CJS deps without issue), and Vitest. Keeping every workspace package on the same module system avoids `require(esm)` interop failures between `packages/domain` and `apps/api`.

**Amendment (Plan 02):** this default holds for `packages/domain` and `apps/web`. `apps/api` later overrides `module`/`moduleResolution` to `"NodeNext"` in its own `tsconfig.json` — a deliberate, isolated exception forced by Prisma 7's client shipping ESM-only (see Plan 02's Global Constraints). The override lives entirely in `apps/api`'s own config; nothing here changes.

- [ ] **Step 3: Create `packages/config/eslint.base.mjs`**

```js
// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
```

- [ ] **Step 4: Create `packages/config/prettier.base.mjs`**

```js
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
};
```

- [ ] **Step 5: Install workspace dependencies**

Run: `pnpm install`
Expected: completes without error; `packages/config` now appears as a workspace member (verify with `pnpm -r list --depth -1`).

- [ ] **Step 6: Commit**

```bash
git add packages/config pnpm-lock.yaml
git commit -m "chore: add shared tsconfig/eslint/prettier base config package"
```

---

### Task 4: Create `packages/domain` with the first entity (`Assessment`) and a passing test

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/vitest.config.ts`
- Create: `packages/domain/src/entities/assessment.ts`
- Create: `packages/domain/src/entities/assessment.test.ts`
- Create: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: `@zelo/config/tsconfig.base.json` (Task 3).
- Produces: `AssessmentSchema` (Zod schema) and `Assessment` (inferred TS type) exported from `@zelo/domain`. Task 5 adds more entities alongside this one; Plans 02/05/06 import `Assessment`/`AssessmentSchema` from `@zelo/domain`.

- [ ] **Step 1: Create `packages/domain/package.json`**

```json
{
  "name": "@zelo/domain",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@zelo/config": "workspace:*",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `packages/domain/tsconfig.json`**

```json
{
  "extends": "@zelo/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

- [ ] **Step 3: Create `packages/domain/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: completes without error; `zod` and `vitest` resolve inside `packages/domain`.

- [ ] **Step 5: Write the failing test for `AssessmentSchema`**

Create `packages/domain/src/entities/assessment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AssessmentSchema } from "./assessment";

describe("AssessmentSchema", () => {
  it("accepts a valid encrypted assessment payload", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
    };

    const result = AssessmentSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it("rejects a payload missing the required ciphertext field", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      answers: [1, 2, 3],
    };

    const result = AssessmentSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it("strips a raw answers array if present, even alongside valid ciphertext", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
      answers: [1, 2, 3],
    };

    const result = AssessmentSchema.parse(input);

    expect(result).not.toHaveProperty("answers");
  });

  it("strips a riskSignal field if a buggy client includes one, rather than storing it", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
      riskSignal: true,
    };

    const result = AssessmentSchema.parse(input);

    expect(result).not.toHaveProperty("riskSignal");
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm --filter @zelo/domain test`
Expected: FAIL — `Cannot find module './assessment'` (the schema doesn't exist yet).

- [ ] **Step 7: Implement `AssessmentSchema`**

Create `packages/domain/src/entities/assessment.ts`:

```ts
import { z } from "zod";

export const AssessmentScaleType = z.enum(["PHQ-9", "GAD-7", "MBI-HSS"]);
export type AssessmentScaleType = z.infer<typeof AssessmentScaleType>;

/**
 * This is the wire contract with the BACKEND ONLY — deliberately no field
 * for raw answers (the backend must never receive them, PRD FR-2, FR-13)
 * and, just as deliberately, no `riskSignal` field either: the server must
 * never learn a risk signal exists unless the user explicitly opts into
 * human connection (spec Section G, PRD FR-15/US-007). `riskSignal` is a
 * frontend-local-only concept — see `apps/web/src/domain/assessment-record.ts`
 * (Plan 06) for the on-device record shape that includes it. Zod's default
 * object parsing strips unknown keys, so even a buggy client that includes
 * `riskSignal` in the request body will have it silently dropped by
 * `AssessmentSchema.parse()` before anything is persisted.
 */
export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  scaleType: AssessmentScaleType,
  capturedAt: z.string().datetime(),
  ciphertext: z.string().min(1),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm --filter @zelo/domain test`
Expected: PASS — 4 tests passed.

- [ ] **Step 9: Create the package entry point**

Create `packages/domain/src/index.ts`:

```ts
export * from "./entities/assessment";
```

- [ ] **Step 10: Verify the package builds**

Run: `pnpm --filter @zelo/domain build`
Expected: completes without error; `packages/domain/dist/index.js` and `dist/index.d.ts` exist.

- [ ] **Step 11: Commit**

```bash
git add packages/domain pnpm-lock.yaml
git commit -m "feat(domain): add Assessment entity schema"
```

---

### Task 5: Add remaining shared entities (`RiskSignal`, `ConsentRecord`, `CrisisSession`, `ChatMessage`)

**Files:**
- Create: `packages/domain/src/entities/risk-signal.ts`
- Create: `packages/domain/src/entities/risk-signal.test.ts`
- Create: `packages/domain/src/entities/consent-record.ts`
- Create: `packages/domain/src/entities/consent-record.test.ts`
- Create: `packages/domain/src/entities/crisis-session.ts`
- Create: `packages/domain/src/entities/crisis-session.test.ts`
- Create: `packages/domain/src/entities/chat-message.ts`
- Create: `packages/domain/src/entities/chat-message.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: same pattern as Task 4 (Zod + Vitest already configured).
- Produces: `RiskSignalSchema`/`RiskSignal`, `ConsentRecordSchema`/`ConsentRecord`, `CrisisSessionSchema`/`CrisisSession`, `AnonymizedMessageSchema`/`AnonymizedMessage`, `ChatTokenSchema`/`ChatToken` — all exported from `@zelo/domain`. Plan 05 (AI chat) consumes `AnonymizedMessage` and `ChatToken`; Plan 06 (assessment) consumes `RiskSignal`; the crisis module (future plan) consumes `ConsentRecord`/`CrisisSession`.

- [ ] **Step 1: Write the failing test for `RiskSignalSchema`**

Create `packages/domain/src/entities/risk-signal.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RiskSignalSchema } from "./risk-signal";

describe("RiskSignalSchema", () => {
  it("accepts a risk signal without any identifying data", () => {
    const result = RiskSignalSchema.safeParse({
      assessmentId: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      detectedAt: "2026-07-07T12:00:00.000Z",
      reason: "phq9-item-9-positive",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter @zelo/domain test`
Expected: FAIL — `Cannot find module './risk-signal'`.

- [ ] **Step 3: Implement `RiskSignalSchema`**

Create `packages/domain/src/entities/risk-signal.ts`:

```ts
import { z } from "zod";

export const RiskSignalReason = z.enum(["phq9-item-9-positive", "clinical-criteria-tbd"]);
export type RiskSignalReason = z.infer<typeof RiskSignalReason>;

export const RiskSignalSchema = z.object({
  assessmentId: z.string().uuid(),
  detectedAt: z.string().datetime(),
  reason: RiskSignalReason,
});

export type RiskSignal = z.infer<typeof RiskSignalSchema>;
```

- [ ] **Step 4: Write the failing test for `ConsentRecordSchema`**

Create `packages/domain/src/entities/consent-record.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ConsentRecordSchema } from "./consent-record";

describe("ConsentRecordSchema", () => {
  it("ties consent to an ephemeral session token, never a permanent identity", () => {
    const result = ConsentRecordSchema.safeParse({
      sessionToken: "eph_1a2b3c4d",
      grantedAt: "2026-07-07T12:00:00.000Z",
      scope: "crisis-human-connection",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 5: Run test, verify it fails**

Run: `pnpm --filter @zelo/domain test`
Expected: FAIL — `Cannot find module './consent-record'`.

- [ ] **Step 6: Implement `ConsentRecordSchema`**

Create `packages/domain/src/entities/consent-record.ts`:

```ts
import { z } from "zod";

export const ConsentScope = z.enum(["crisis-human-connection", "peer-matching"]);
export type ConsentScope = z.infer<typeof ConsentScope>;

/**
 * Consent is recorded against sessionToken only (PRD FR-15, US-007 AC-3) —
 * there is no field here for a permanent user identity.
 */
export const ConsentRecordSchema = z.object({
  sessionToken: z.string().min(1),
  grantedAt: z.string().datetime(),
  scope: ConsentScope,
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
```

- [ ] **Step 7: Write the failing test for `CrisisSessionSchema`**

Create `packages/domain/src/entities/crisis-session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CrisisSessionSchema } from "./crisis-session";

describe("CrisisSessionSchema", () => {
  it("accepts an ephemeral crisis session with an expiry", () => {
    const result = CrisisSessionSchema.safeParse({
      sessionToken: "eph_1a2b3c4d",
      createdAt: "2026-07-07T12:00:00.000Z",
      expiresAt: "2026-07-07T13:00:00.000Z",
      status: "pending",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 8: Run test, verify it fails**

Run: `pnpm --filter @zelo/domain test`
Expected: FAIL — `Cannot find module './crisis-session'`.

- [ ] **Step 9: Implement `CrisisSessionSchema`**

Create `packages/domain/src/entities/crisis-session.ts`:

```ts
import { z } from "zod";

export const CrisisSessionStatus = z.enum(["pending", "connected", "closed"]);
export type CrisisSessionStatus = z.infer<typeof CrisisSessionStatus>;

export const CrisisSessionSchema = z.object({
  sessionToken: z.string().min(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  status: CrisisSessionStatus,
});

export type CrisisSession = z.infer<typeof CrisisSessionSchema>;
```

- [ ] **Step 10: Write the failing test for `ChatMessage`/`ChatToken`**

Create `packages/domain/src/entities/chat-message.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AnonymizedMessageSchema, ChatTokenSchema } from "./chat-message";

describe("chat-message schemas", () => {
  it("accepts an anonymized outgoing message", () => {
    const result = AnonymizedMessageSchema.safeParse({
      role: "user",
      content: "I've been feeling exhausted after every shift.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a single streamed chat token", () => {
    const result = ChatTokenSchema.safeParse({
      conversationId: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      delta: "I hear",
      done: false,
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 11: Run test, verify it fails**

Run: `pnpm --filter @zelo/domain test`
Expected: FAIL — `Cannot find module './chat-message'`.

- [ ] **Step 12: Implement `AnonymizedMessageSchema` and `ChatTokenSchema`**

Create `packages/domain/src/entities/chat-message.ts`:

```ts
import { z } from "zod";

/**
 * Text has already been scrubbed of identifiers client-side (PRD FR-5)
 * before it ever reaches this shape.
 */
export const AnonymizedMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});
export type AnonymizedMessage = z.infer<typeof AnonymizedMessageSchema>;

/** One chunk of a streamed AI reply — shape is provider-agnostic (spec Section D). */
export const ChatTokenSchema = z.object({
  conversationId: z.string().uuid(),
  delta: z.string(),
  done: z.boolean(),
});
export type ChatToken = z.infer<typeof ChatTokenSchema>;
```

- [ ] **Step 13: Run all domain tests to verify everything passes**

Run: `pnpm --filter @zelo/domain test`
Expected: PASS — 9 tests passed (4 from Task 4 + 5 new).

- [ ] **Step 14: Update the package entry point**

Modify `packages/domain/src/index.ts`:

```ts
export * from "./entities/assessment";
export * from "./entities/risk-signal";
export * from "./entities/consent-record";
export * from "./entities/crisis-session";
export * from "./entities/chat-message";
```

- [ ] **Step 15: Verify the package still builds**

Run: `pnpm --filter @zelo/domain build`
Expected: completes without error.

- [ ] **Step 16: Commit**

```bash
git add packages/domain
git commit -m "feat(domain): add RiskSignal, ConsentRecord, CrisisSession, and chat message schemas"
```

---

### Task 6: Add dependency-cruiser boundary enforcement

**Files:**
- Create: `packages/config/dependency-cruiser.base.cjs`
- Create: `packages/domain/.dependency-cruiser.cjs`
- Modify: `packages/domain/package.json` (add `lint:boundaries` script and `dependency-cruiser` devDependency)

**Interfaces:**
- Consumes: `packages/domain/src` (Tasks 4-5).
- Produces: a `lint:boundaries` script pattern every future app/package replicates (Plans 02, 03 add their own `.dependency-cruiser.cjs` extending this base with their own layer rules).

- [ ] **Step 1: Create the shared base — generic options only, no domain-specific rules**

Create `packages/config/dependency-cruiser.base.cjs`:

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [],
  options: {
    tsPreCompilationDeps: true,
  },
};
```

This base is spread (`...base.forbidden`) by every future package/app's own `.dependency-cruiser.cjs` (Plans 02, 03 too) — keep it free of any rule that isn't universally true for every consumer. `packages/domain`'s own rules (Step 2) belong in `packages/domain`'s own config, not here — a rule forbidding `react`/`@nestjs` imports would falsely fire on every legitimate import in `apps/web`/`apps/api` if it lived in this shared base.

- [ ] **Step 2: Create `packages/domain/.dependency-cruiser.cjs` extending the base with domain's own rules**

```js
const base = require("@zelo/config/dependency-cruiser.base.cjs");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  ...base,
  forbidden: [
    ...base.forbidden,
    {
      name: "domain-no-app-imports",
      comment: "packages/domain must never import from apps/* — it is consumed BY apps, not the other way around.",
      severity: "error",
      from: { path: "^src" },
      to: { path: "[/]apps[/]" },
    },
    {
      name: "domain-no-framework-imports",
      comment: "packages/domain holds types/schemas only — no React, NestJS, or Prisma (spec Decisions table).",
      severity: "error",
      from: { path: "^src" },
      to: { path: "node_modules/(react|@nestjs|@prisma)" },
    },
  ],
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

Two things worth noting about these patterns:
- `from`/`to` paths are `^src`/`[/]apps[/]`, not `^packages/domain/src`/`^apps` — `depcruise src --config .dependency-cruiser.cjs` (Step 3's `lint:boundaries` script) runs with cwd = `packages/domain` (via `pnpm --filter`/`turbo run`), so dependency-cruiser reports and matches module paths relative to that cwd (e.g. `src/entities/assessment.ts`, and cross-package targets like `../../apps/web/src/foo.ts`) — never prefixed with `packages/domain/`, and never anchored-starting with `apps`. An earlier anchored form of both patterns was tried and found to silently never match anything; use the forms above directly.
- These two rules are domain-specific and deliberately live here, not in the shared base (Step 1) — see that step's note.

- [ ] **Step 3: Add `dependency-cruiser` as a devDependency and export the base config**

Modify `packages/config/package.json` — add to `exports`:

```json
"./dependency-cruiser.base.cjs": "./dependency-cruiser.base.cjs"
```

Modify `packages/domain/package.json` — add to `scripts`:

```json
"lint:boundaries": "depcruise src --config .dependency-cruiser.cjs"
```

and add to `devDependencies`:

```json
"dependency-cruiser": "^16.4.0"
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: completes without error.

- [ ] **Step 5: Verify the rule passes on current (clean) code**

Run: `pnpm --filter @zelo/domain lint:boundaries`
Expected: PASS — `no dependency violations found`.

- [ ] **Step 6: Prove the rule actually catches a violation**

Create a temporary file `packages/domain/src/entities/__boundary_violation.ts`:

```ts
import { useState } from "react";

export const brokenExport = useState;
```

Run: `pnpm --filter @zelo/domain lint:boundaries`
Expected: FAIL — reports `domain-no-framework-imports` violation on `__boundary_violation.ts`.

- [ ] **Step 7: Remove the temporary violation file**

```bash
rm packages/domain/src/entities/__boundary_violation.ts
```

Run: `pnpm --filter @zelo/domain lint:boundaries`
Expected: PASS again — confirms the rule is live and was correctly triggering, not silently passing.

- [ ] **Step 8: Wire `lint:boundaries` into the Turborepo pipeline**

This task name already matches the `lint:boundaries` task defined in `turbo.json` (Task 2) — no changes needed there. Verify it's picked up:

Run: `pnpm exec turbo run lint:boundaries`
Expected: runs `@zelo/domain#lint:boundaries` and passes.

- [ ] **Step 9: Commit**

```bash
git add packages/config packages/domain
git commit -m "chore: add dependency-cruiser boundary enforcement for packages/domain"
```

---

### Task 7: Verify the full pipeline end-to-end and document the monorepo root

**Files:**
- Create: `README.md` (root — only if one does not already exist; if it exists, add a "## Monorepo Structure" section instead)
- Create: `packages/domain/eslint.config.mjs`

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: a documented, fully verified monorepo root that Plans 02 and 03 build `apps/api` and `apps/web` into.

- [ ] **Step 0: Wire `packages/domain` to the shared ESLint base**

Create `packages/domain/eslint.config.mjs`:

```js
import base from "@zelo/config/eslint.base";

export default base;
```

Without this file, `packages/domain`'s `"lint": "eslint src"` script (added in Task 4) has no flat-config file to load, and `pnpm lint` fails with an ESLint 9 "couldn't find an eslint.config" error — Task 3 created the shared base but no earlier task ever wired a package to consume it. This is the first package to need it; run `pnpm --filter @zelo/domain lint` now to confirm it passes before moving to Step 1.

- [ ] **Step 1: Check whether a root `README.md` already exists**

Run: `ls README.md 2>&1 || echo "not found"`
Expected: either the file listing, or "not found".

- [ ] **Step 2a (if not found): Create `README.md`**

```markdown
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
```

Note: at the point this plan completes, `apps/web`, `apps/api`, and `docker/` don't exist yet (Plans 02, 03, 04 add them) — the Monorepo Structure section above describes the target shape, not yet the current one. Leave the section as-is; it becomes accurate as those plans land, and rewriting it now would just mean rewriting it again three more times.

- [ ] **Step 2b (if found): Append a "## Monorepo Structure" section**

Add the same content as Step 2a's `## Monorepo Structure` through `## Commands` sections to the end of the existing `README.md`, without removing existing content.

- [ ] **Step 3: Run the full pipeline from a clean install**

```bash
rm -rf node_modules packages/*/node_modules packages/*/dist
pnpm install
pnpm build
pnpm lint
pnpm run lint:boundaries
pnpm test
```

Expected: every command completes with exit code 0. `pnpm build` produces `packages/domain/dist/`. `pnpm test` reports 9 passing tests.

- [ ] **Step 4: Commit**

```bash
git add README.md packages/domain/eslint.config.mjs
git commit -m "docs: document monorepo structure and root commands"
```

---

## Definition of Done

- `pnpm install && pnpm build && pnpm lint && pnpm run lint:boundaries && pnpm test` all pass from a clean checkout — `pnpm lint` requires `packages/domain/eslint.config.mjs` (Task 7 Step 0) to exist, since Task 4's `"lint": "eslint src"` script has nothing to load without it.
- `packages/domain` exports `Assessment`, `RiskSignal`, `ConsentRecord`, `CrisisSession`, `AnonymizedMessage`, and `ChatToken` (schemas + inferred types).
- `packages/config/dependency-cruiser.base.cjs` contains no domain-specific rules — only generic `options` — so Plans 02/03 spreading `...base.forbidden` inherit nothing that would falsely flag their own legitimate imports. `packages/domain`'s own two rules (no app imports, no framework imports) live in `packages/domain/.dependency-cruiser.cjs` (Task 6), with `from`/`to` patterns relative to `depcruise`'s per-package cwd (`^src`, `[/]apps[/]`), not the package's path from the repo root.
- A boundary violation in `packages/domain/src` fails `lint:boundaries` (proven once in Task 6, not left in the codebase) — this includes a genuine cross-package `apps/*` import target, not just the framework-import case.
- No `apps/*` directory exists yet — that is out of scope for this plan (see Plans 02, 03). Note for Plan 03: `turbo.json`'s `dev` task doesn't declare `dependsOn: ["^build"]` — if `apps/web`'s dev server resolves `@zelo/domain` via its built `dist/` output (per its `package.json` `main`/`types` fields) rather than source, Plan 03 should either add that `dependsOn` or confirm Vite resolves the workspace package a different way.
