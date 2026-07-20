# Path Alias Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 255 relative-parent (`../`) import specifiers in `apps/web/src` with a single `@/` path alias rooted at `apps/web/src`.

**Architecture:** Add `@/*` → `./src/*` to `apps/web/tsconfig.json`'s `paths`, and matching `resolve.alias` entries to both `apps/web/vite.config.ts` and `apps/web/vitest.config.ts` (they don't share config). Prove the alias resolves end-to-end with one manual import rewrite, then run a one-off Node codemod script to rewrite every remaining `../`-based specifier across the tree. No runtime behavior changes anywhere — this is a pure import-path rewrite.

**Tech Stack:** TypeScript, Vite, Vitest, Node.js (ESM) for the codemod script.

## Global Constraints

- Only rewrite specifiers starting with `../` (any depth). Leave `./` (same-directory) specifiers untouched.
- No `paths`/alias convention exists anywhere else in this monorepo — `@/` is a new introduction, not a match to an existing pattern.
- The codemod script itself must never be committed — write it, run it, delete it before the final commit.
- `HomePage.tsx` and `ManagerDashboardPage.tsx` currently have unrelated uncommitted local edits (a `className="p-2"` tweak) — per user instruction, leave them as-is and let them ride along in whatever commit touches those files' import lines. Do not separate or revert them.

---

### Task 1: Configure the `@/` alias and prove it resolves end-to-end

**Files:**
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/vitest.config.ts`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.tsx:12` (sanity-check rewrite)

**Interfaces:**
- Produces: a working `@/*` → `apps/web/src/*` alias, resolvable by `tsc`, `vite build`, and `vitest`. Task 2 depends on this alias already working before it does the full sweep.

- [ ] **Step 1: Add `paths` to `apps/web/tsconfig.json`**

Edit the `compilerOptions` block to add `baseUrl` and `paths`:

```json
{
  "extends": "@zelo/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vitest.setup.ts"]
}
```

- [ ] **Step 2: Add `resolve.alias` to `apps/web/vite.config.ts`**

Add a `path` import and a `resolve` block:

```ts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Zelo",
        short_name: "Zelo",
        description: "Triagem e suporte confidencial à saúde mental do médico",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 3: Add the same `resolve.alias` to `apps/web/vitest.config.ts`**

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
  test: {
    environment: "./vitest.environment.ts",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: Manually rewrite one import as a sanity check**

In `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`, change line 12 from:

```ts
import { useManagerSessionStore } from "../../stores/manager-session.store";
```

to:

```ts
import { useManagerSessionStore } from "@/stores/manager-session.store";
```

- [ ] **Step 5: Verify TypeScript resolves the alias**

Run (from `apps/web`): `npx tsc --noEmit`
Expected: no errors mentioning `manager-session.store` or `ManagerDashboardPage.tsx`. (Pre-existing unrelated errors, if any, are out of scope — only confirm no *new* error appears on this file.)

- [ ] **Step 6: Verify Vite/Vitest resolves the alias at runtime**

Run (from `apps/web`): `npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: PASS — this proves Vitest's own resolver (separate from `tsc`) also honors the alias.

- [ ] **Step 7: Commit**

```bash
git add apps/web/tsconfig.json apps/web/vite.config.ts apps/web/vitest.config.ts apps/web/src/presentation/pages/ManagerDashboardPage.tsx
git commit -m "$(cat <<'EOF'
build: add @/ path alias for apps/web

Configures tsconfig paths plus matching Vite/Vitest resolve.alias
entries, proven with one manual import rewrite. Sets up the codemod
in the next commit to sweep the remaining ../ imports repo-wide.
EOF
)"
```

---

### Task 2: Codemod the remaining relative imports repo-wide

**Files:**
- Create (temporary, never committed): `apps/web/tmp-rewrite-imports.mjs`
- Modifies: every remaining file under `apps/web/src` containing a `../`-based import/export specifier (up to 74 files; one line in `ManagerDashboardPage.tsx` is already done from Task 1)

**Interfaces:**
- Consumes: the `@/*` alias configured and proven working in Task 1.

- [ ] **Step 1: Write the codemod script**

Create `apps/web/tmp-rewrite-imports.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, "src");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const DRY_RUN = process.argv.includes("--dry");

const IMPORT_SPECIFIER_PATTERN = /\b(from\s+|import\()(["'])(\.\.\/[^"']+)\2/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function toAliasSpecifier(filePath, specifier) {
  const absoluteTarget = path.resolve(path.dirname(filePath), specifier);
  const relativeToSrc = path.relative(SRC_ROOT, absoluteTarget);
  return "@/" + relativeToSrc.split(path.sep).join("/");
}

let filesChanged = 0;
let totalReplacements = 0;

for (const filePath of walk(SRC_ROOT)) {
  const original = fs.readFileSync(filePath, "utf8");
  let replacements = 0;

  const rewritten = original.replace(IMPORT_SPECIFIER_PATTERN, (_match, keyword, quote, specifier) => {
    replacements += 1;
    return `${keyword}${quote}${toAliasSpecifier(filePath, specifier)}${quote}`;
  });

  if (replacements > 0) {
    totalReplacements += replacements;
    filesChanged += 1;
    console.log(`${path.relative(SRC_ROOT, filePath)}: ${replacements} import(s)`);
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, rewritten, "utf8");
    }
  }
}

console.log(`\n${DRY_RUN ? "[dry run] " : ""}${totalReplacements} import(s) rewritten across ${filesChanged} file(s).`);
```

- [ ] **Step 2: Dry run first**

Run (from `apps/web`): `node tmp-rewrite-imports.mjs --dry`
Expected: a per-file list ending with a summary around `254 import(s) rewritten across 74 file(s)` (255 total minus the 1 already rewritten by hand in Task 1). If the count is wildly different, stop and inspect — don't proceed to the real run.

- [ ] **Step 3: Run for real**

Run (from `apps/web`): `node tmp-rewrite-imports.mjs`
Expected: same summary line as the dry run, this time with files actually written.

- [ ] **Step 4: Delete the codemod script**

Run: `rm apps/web/tmp-rewrite-imports.mjs`

- [ ] **Step 5: Verify no relative-parent imports remain**

Run: `grep -rn '\.\./' apps/web/src --include="*.ts" --include="*.tsx"`
Expected: no output (zero matches).

- [ ] **Step 6: Verify TypeScript compiles**

Run (from `apps/web`): `npx tsc --noEmit`
Expected: no new errors compared to before this task (same pre-existing baseline, if any).

- [ ] **Step 7: Verify the full test suite passes**

Run (from `apps/web`): `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 8: Verify the production build succeeds**

Run (from `apps/web`): `npx vite build`
Expected: build completes with no errors.

- [ ] **Step 9: Spot-check two rewritten files by hand**

Read `apps/web/src/presentation/pages/ManagerDashboardPage.tsx` and `apps/web/src/presentation/pages/HomePage.tsx` (the two highest-count files) and confirm every import reads naturally as `@/...`, with no double-aliasing (e.g. no `@/@/...` or `@/../...`).

- [ ] **Step 10: Commit**

```bash
git add apps/web/src
git commit -m "$(cat <<'EOF'
refactor: replace ../ relative imports with @/ alias

Mechanical codemod rewrite across apps/web/src. No behavior change;
verified via tsc, vitest, and vite build.
EOF
)"
```

---

### Task 3: Push and verify CI

**Files:** none (verification only)

- [ ] **Step 1: Push the branch**

```bash
git push
```

- [ ] **Step 2: Watch CI to green**

Per this repo's standing rule, a local passing test run is not sufficient — confirm the actual CI pipeline run for this push passes (check via `gh run watch` or the repo's CI dashboard).

