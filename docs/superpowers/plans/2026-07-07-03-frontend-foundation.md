# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Vite + React PWA (`apps/web`) with Tailwind, `vite-plugin-pwa`, TanStack Router/Query, and Zustand wired in, following the Clean Architecture folder convention from the spec (`use-cases` → `ports` ← `infrastructure`, `presentation` on top). Ends with one working vertical slice — a health-check banner that calls `apps/api`'s `GET /health` — that proves the full pattern end-to-end and is the template Plans 05/06 copy.

**Architecture:** `presentation` (pages/components/hooks) never touches `infrastructure` directly — it calls `use-cases` through TanStack Query hooks. `use-cases` depend only on `ports` (interfaces). `infrastructure` implements those ports (HTTP, IndexedDB, Web Crypto adapters land here in later plans). `stores` (Zustand) hold UI-only state, never server data.

**Tech Stack:** Vite, React 18, TypeScript (CommonJS-compatible build, matches Plans 01/02), Tailwind CSS, `vite-plugin-pwa`, TanStack Router, TanStack Query, Zustand, Zod, Vitest + React Testing Library.

## Global Constraints

- `use-cases/` must never import React, `fetch`, or any browser storage API directly — only `ports/` interfaces (spec Section B).
- `stores/` (Zustand) hold UI-only/ephemeral state only — never a duplicate of server data owned by TanStack Query (spec Section B).
- Zod validates at the two boundaries that matter: form input before a use-case, and any payload crossing `infrastructure/http` (spec Section B) — this plan's only payload is the trivial health-check response, so the Zod validation habit is established here even though the stakes are low.
- Requires `apps/api` (Plan 02) running locally on port 3000 to complete this plan's end-to-end verification steps.

---

### Task 1: Vite + React application skeleton

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: `@zelo/config/tsconfig.base.json` (Plan 01 Task 3).
- Produces: a bootable Vite dev server rendering `<App />`. Task 4 replaces `App.tsx`'s placeholder content with the router.

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@zelo/web",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit && vite build",
    "dev": "vite",
    "lint": "eslint src",
    "lint:boundaries": "depcruise src --config .dependency-cruiser.cjs",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-router": "^1.58.0",
    "@zelo/domain": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@zelo/config": "workspace:*",
    "autoprefixer": "^10.4.0",
    "dependency-cruiser": "^16.4.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "@zelo/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`noEmit: true` because Vite (not `tsc`) produces the actual build output — `tsc` here only runs as a type-check gate (see the `build` script in Step 1).

- [ ] **Step 3: Create `apps/web/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 4: Create `apps/web/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zelo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/web/src/app/App.tsx`**

```tsx
export function App() {
  return <div>Zelo — loading...</div>;
}
```

- [ ] **Step 6: Create `apps/web/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create `apps/web/.env.example`**

```
VITE_API_BASE_URL=http://localhost:3000
```

Run: `cp apps/web/.env.example apps/web/.env`

- [ ] **Step 8: Install dependencies**

Run: `pnpm install`
Expected: completes without error; `apps/web` appears in `pnpm -r list --depth -1`.

- [ ] **Step 9: Verify the dev server boots**

Run: `pnpm --filter @zelo/web dev` in the background, then:
Run: `curl -s http://localhost:5173 | head -c 200`
Expected: HTML containing `<div id="root">`. Stop the dev server once confirmed.

- [ ] **Step 10: Verify the production build works**

Run: `pnpm --filter @zelo/web build`
Expected: completes without error; `apps/web/dist/index.html` and a bundled JS file exist.

- [ ] **Step 11: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): bootstrap Vite + React application skeleton"
```

---

### Task 2: Tailwind CSS

**Files:**
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/app/index.css`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/app/App.tsx`

**Interfaces:**
- Produces: Tailwind utility classes available in every component from this point forward.

- [ ] **Step 1: Create `apps/web/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Create `apps/web/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Create `apps/web/src/app/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Import the stylesheet**

Modify `apps/web/src/main.tsx` — add as the first import:

```tsx
import "./app/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Apply a Tailwind class to prove it works**

Modify `apps/web/src/app/App.tsx`:

```tsx
export function App() {
  return <div className="p-4 text-lg font-semibold text-slate-800">Zelo — loading...</div>;
}
```

- [ ] **Step 6: Verify the build includes compiled Tailwind styles**

Run: `pnpm --filter @zelo/web build`
Expected: completes without error. Then run:
`grep -l "font-semibold\|\.p-4" apps/web/dist/assets/*.css`
Expected: a matching CSS asset file is found (confirms Tailwind actually processed and emitted the utility classes, not just that the build didn't crash).

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Tailwind CSS"
```

---

### Task 3: PWA plugin (installable, offline-capable shell)

**Files:**
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/public/icon-192.png` (placeholder)
- Create: `apps/web/public/icon-512.png` (placeholder)

**Interfaces:**
- Produces: a `manifest.webmanifest` and a registered service worker in the production build.

- [ ] **Step 1: Add placeholder PWA icons**

Run:
```bash
mkdir -p apps/web/public
```

Since real icon assets aren't ready yet, generate two solid-color placeholder PNGs so the manifest has valid files to reference (design/branding work is out of scope for this plan):

Run (requires ImageMagick; if unavailable, source any 192x192 and 512x512 PNG and place them at these paths manually):
```bash
convert -size 192x192 xc:'#0f172a' apps/web/public/icon-192.png
convert -size 512x512 xc:'#0f172a' apps/web/public/icon-512.png
```
Expected: both files exist under `apps/web/public/`.

- [ ] **Step 2: Add `vite-plugin-pwa` to `vite.config.ts`**

Modify `apps/web/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
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

- [ ] **Step 3: Verify the manifest and service worker are generated**

Run: `pnpm --filter @zelo/web build`
Expected: completes without error. Then:
`ls apps/web/dist/manifest.webmanifest apps/web/dist/sw.js`
Expected: both files exist.

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): add PWA manifest and service worker via vite-plugin-pwa"
```

---

### Task 4: Clean Architecture scaffold + the API-health vertical slice

**Files:**
- Create: `apps/web/src/ports/api-health.port.ts`
- Create: `apps/web/src/use-cases/check-api-health.usecase.ts`
- Create: `apps/web/src/use-cases/check-api-health.usecase.test.ts`
- Create: `apps/web/src/infrastructure/http/http-api-health.adapter.ts`
- Create: `apps/web/src/stores/ui.store.ts`
- Create: `apps/web/src/presentation/hooks/useApiHealth.ts`
- Create: `apps/web/src/presentation/components/HealthBanner.tsx`
- Create: `apps/web/src/presentation/components/HealthBanner.test.tsx`
- Create: `apps/web/src/app/container.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Modify: `apps/web/src/app/App.tsx`

**Interfaces:**
- Consumes: `apps/api`'s `GET /health` (Plan 02 Task 3) via `VITE_API_BASE_URL`.
- Produces: the full pattern `presentation → hooks → use-cases → ports ← infrastructure` proven working end-to-end. This exact shape (port, use-case, adapter, hook, component) is what Plans 05/06 replicate for chat and assessment.

- [ ] **Step 1: Create `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 2: Create `apps/web/vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write the failing unit test for `CheckApiHealthUseCase`**

Create `apps/web/src/use-cases/check-api-health.usecase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CheckApiHealthUseCase } from "./check-api-health.usecase";
import type { ApiHealthPort, ApiHealthResult } from "../ports/api-health.port";

class FakeHealthyApi implements ApiHealthPort {
  async check(): Promise<ApiHealthResult> {
    return { status: "ok", database: true };
  }
}

describe("CheckApiHealthUseCase", () => {
  it("returns the port's health result unchanged", async () => {
    const useCase = new CheckApiHealthUseCase(new FakeHealthyApi());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "ok", database: true });
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @zelo/web test`
Expected: FAIL — `Cannot find module './check-api-health.usecase'`.

- [ ] **Step 5: Define the port**

Create `apps/web/src/ports/api-health.port.ts`:

```ts
import { z } from "zod";

export const ApiHealthResultSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  database: z.boolean(),
});
export type ApiHealthResult = z.infer<typeof ApiHealthResultSchema>;

export interface ApiHealthPort {
  check(): Promise<ApiHealthResult>;
}
```

- [ ] **Step 6: Implement the use-case**

Create `apps/web/src/use-cases/check-api-health.usecase.ts`:

```ts
import type { ApiHealthPort, ApiHealthResult } from "../ports/api-health.port";

export class CheckApiHealthUseCase {
  constructor(private readonly apiHealth: ApiHealthPort) {}

  async execute(): Promise<ApiHealthResult> {
    return this.apiHealth.check();
  }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @zelo/web test`
Expected: PASS — 1 test passed. Note this test imports no React, no `fetch` — only the port interface and the use-case.

- [ ] **Step 8: Implement the HTTP adapter**

Create `apps/web/src/infrastructure/http/http-api-health.adapter.ts`:

```ts
import { ApiHealthResultSchema, type ApiHealthPort, type ApiHealthResult } from "../../ports/api-health.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpApiHealthAdapter implements ApiHealthPort {
  async check(): Promise<ApiHealthResult> {
    const response = await fetch(`${API_BASE_URL}/health`);
    const json = await response.json();
    return ApiHealthResultSchema.parse(json);
  }
}
```

`ApiHealthResultSchema.parse` is the Zod boundary check from the Global Constraints — anything crossing from `infrastructure/http` into the rest of the app is validated against the schema before it's trusted.

- [ ] **Step 9: Create the manual DI container**

Create `apps/web/src/app/container.ts`:

```ts
import { CheckApiHealthUseCase } from "../use-cases/check-api-health.usecase";
import { HttpApiHealthAdapter } from "../infrastructure/http/http-api-health.adapter";

export const checkApiHealthUseCase = new CheckApiHealthUseCase(new HttpApiHealthAdapter());
```

This is the frontend's equivalent of NestJS's DI binding in `*.module.ts` (Plan 02) — one place that wires which adapter implements which port. There's no framework DI container on the frontend, so a plain module-level instantiation is enough at this scale.

- [ ] **Step 10: Create the UI-only Zustand store**

Create `apps/web/src/stores/ui.store.ts`:

```ts
import { create } from "zustand";

interface UiState {
  isHealthBannerDismissed: boolean;
  dismissHealthBanner: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isHealthBannerDismissed: false,
  dismissHealthBanner: () => set({ isHealthBannerDismissed: true }),
}));
```

This holds only ephemeral UI state (whether the banner is dismissed) — never the health-check *result* itself, which is server data and belongs to TanStack Query (Step 11).

- [ ] **Step 11: Create the TanStack Query hook**

Create `apps/web/src/presentation/hooks/useApiHealth.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { checkApiHealthUseCase } from "../../app/container";

export function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: () => checkApiHealthUseCase.execute(),
    retry: 1,
  });
}
```

- [ ] **Step 12: Write the failing component test for `HealthBanner`**

Create `apps/web/src/presentation/components/HealthBanner.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthBanner } from "./HealthBanner";
import * as container from "../../app/container";

describe("HealthBanner", () => {
  it("shows the API status once the health check resolves", async () => {
    vi.spyOn(container.checkApiHealthUseCase, "execute").mockResolvedValue({
      status: "ok",
      database: true,
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HealthBanner />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/api: ok/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 13: Run the test to verify it fails**

Run: `pnpm --filter @zelo/web test`
Expected: FAIL — `Cannot find module './HealthBanner'`.

- [ ] **Step 14: Implement `HealthBanner`**

Create `apps/web/src/presentation/components/HealthBanner.tsx`:

```tsx
import { useApiHealth } from "../hooks/useApiHealth";
import { useUiStore } from "../../stores/ui.store";

export function HealthBanner() {
  const { data, isLoading } = useApiHealth();
  const isDismissed = useUiStore((state) => state.isHealthBannerDismissed);
  const dismiss = useUiStore((state) => state.dismissHealthBanner);

  if (isDismissed || isLoading || !data) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-slate-100 p-2 text-sm text-slate-700">
      <span>api: {data.status}</span>
      <button onClick={dismiss} className="underline">
        dismiss
      </button>
    </div>
  );
}
```

- [ ] **Step 15: Run the test to verify it passes**

Run: `pnpm --filter @zelo/web test`
Expected: PASS — 2 tests passed (1 use-case unit test + 1 component test).

- [ ] **Step 16: Wire `HealthBanner` and TanStack Query into `App.tsx`**

Modify `apps/web/src/app/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthBanner } from "../presentation/components/HealthBanner";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4 text-lg font-semibold text-slate-800">
        <HealthBanner />
        Zelo
      </div>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 17: Manually verify against the running backend**

Requires `apps/api` running (Plan 02, `pnpm --filter @zelo/api start`) on port 3000 with its Postgres reachable.

Run: `pnpm --filter @zelo/web dev` and open `http://localhost:5173` in a browser.
Expected: the page shows "api: ok" in the banner above "Zelo". If `apps/api` isn't running, the banner simply doesn't render (network error, `data` stays undefined) rather than crashing the page.

- [ ] **Step 18: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Clean Architecture scaffold with API-health vertical slice"
```

---

### Task 5: TanStack Router base setup

**Files:**
- Create: `apps/web/src/app/router.tsx`
- Create: `apps/web/src/presentation/pages/HomePage.tsx`
- Modify: `apps/web/src/app/App.tsx`

**Interfaces:**
- Produces: a `RouterProvider` wrapping the app with one route (`/`) rendering `HomePage`. Future plans (05/06) add routes for chat and the assessment wizard alongside this one.

- [ ] **Step 1: Create `apps/web/src/presentation/pages/HomePage.tsx`**

```tsx
import { HealthBanner } from "../components/HealthBanner";

export function HomePage() {
  return (
    <div className="p-4 text-lg font-semibold text-slate-800">
      <HealthBanner />
      Zelo
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/app/router.tsx`**

```tsx
import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { HomePage } from "../presentation/pages/HomePage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

- [ ] **Step 3: Wire the router into `App.tsx`**

Modify `apps/web/src/app/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Verify the build still succeeds**

Run: `pnpm --filter @zelo/web build`
Expected: completes without error.

- [ ] **Step 5: Verify the dev server still serves the home page correctly**

Run: `pnpm --filter @zelo/web dev` (background), then:
Run: `curl -s http://localhost:5173 | grep -o '<div id="root">'`
Expected: match found. (Full route rendering requires a browser; this only confirms the shell still serves — Step 17 of Task 4 already covered the browser-level check.) Stop the dev server once confirmed.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add TanStack Router base setup"
```

---

### Task 6: Frontend boundary enforcement

**Files:**
- Create: `apps/web/.dependency-cruiser.cjs`

**Interfaces:**
- Consumes: `@zelo/config/dependency-cruiser.base.cjs` (Plan 01 Task 6).
- Produces: a `lint:boundaries` check (script already defined in Task 1) enforcing the frontend's dependency rule.

- [ ] **Step 1: Create `apps/web/.dependency-cruiser.cjs`**

```js
const base = require("@zelo/config/dependency-cruiser.base.cjs");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...base.forbidden,
    {
      name: "use-cases-no-react",
      comment: "use-cases/ must be framework-agnostic — no React, no browser APIs directly (spec Section B). They depend only on ports/.",
      severity: "error",
      from: { path: "^apps/web/src/use-cases" },
      to: { path: "node_modules/react" },
    },
    {
      name: "use-cases-no-infrastructure",
      comment: "use-cases/ must depend only on ports/, never on concrete infrastructure/ implementations.",
      severity: "error",
      from: { path: "^apps/web/src/use-cases" },
      to: { path: "^apps/web/src/infrastructure" },
    },
  ],
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

- [ ] **Step 2: Verify the rule passes on current (clean) code**

Run: `pnpm --filter @zelo/web lint:boundaries`
Expected: PASS — no dependency violations found.

- [ ] **Step 3: Prove the rule catches a violation**

Create a temporary file `apps/web/src/use-cases/__boundary_violation.ts`:

```ts
import { useState } from "react";

export const broken = useState;
```

Run: `pnpm --filter @zelo/web lint:boundaries`
Expected: FAIL — reports `use-cases-no-react` violation.

- [ ] **Step 4: Remove the temporary violation file**

```bash
rm apps/web/src/use-cases/__boundary_violation.ts
```

Run: `pnpm --filter @zelo/web lint:boundaries`
Expected: PASS again.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "chore(web): add dependency-cruiser boundary enforcement"
```

---

### Task 7: Full pipeline verification

**Files:** none created — verification only.

- [ ] **Step 1: Run the full pipeline from the monorepo root**

```bash
pnpm install
pnpm build
pnpm lint
pnpm run lint:boundaries
pnpm test
```

Expected: every command completes with exit code 0 across `@zelo/domain`, `@zelo/api`, and `@zelo/web`.

- [ ] **Step 2: Update the root README**

Modify root `README.md` — append under "## Commands":

```markdown

## Frontend local setup

`apps/web` requires `VITE_API_BASE_URL` — copy `apps/web/.env.example` to `apps/web/.env`. Run `pnpm --filter @zelo/web dev` with `apps/api` (Plan 02) running to see the live health-check banner.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document frontend local setup"
```

---

## Definition of Done

- `pnpm install && pnpm build && pnpm lint && pnpm run lint:boundaries && pnpm test` all pass from a clean checkout across all three workspace packages.
- `pnpm --filter @zelo/web dev`, opened in a browser with `apps/api` running, shows a health banner reading "api: ok".
- The `HealthBanner` vertical slice demonstrates the full pattern: `presentation` (`HomePage` → `HealthBanner` → `useApiHealth`) → `use-cases` (`CheckApiHealthUseCase`, unit-tested with a fake port, zero React/fetch imports) → `ports` ← `infrastructure` (`HttpApiHealthAdapter`, Zod-validated at the boundary).
- A boundary violation (`use-cases` importing React or `infrastructure`) fails `lint:boundaries` (proven once in Task 6, not left in the codebase).
- Tailwind and `vite-plugin-pwa` are both proven to actually emit output (compiled CSS, manifest + service worker), not just configured.
- No feature routes (assessment wizard, chat) exist yet — out of scope for this plan (see Plans 05, 06).
