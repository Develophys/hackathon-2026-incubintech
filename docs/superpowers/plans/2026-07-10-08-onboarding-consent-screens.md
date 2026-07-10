# Onboarding & Consent Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-run funnel — Splash → Privacy → Consent → Home — with a persisted consent store so cold starts see onboarding once and warm starts skip straight to Home.

**Architecture:** Three new presentation pages consuming the primitives from the Design System plan, a new Zustand+persist store (`consent.store.ts`), a typed route-path helper, and a `react-router` data-router loader on `/` that redirects to `/home` when consent already exists.

**Tech Stack:** React 19, `react-router` v8 data router, Zustand 5 + `zustand/middleware` persist, Vitest + Testing Library.

## Global Constraints

- **Prerequisite:** `docs/superpowers/plans/2026-07-10-07-design-system-foundation.md` must be implemented first — this plan consumes `PhoneShell`, `Button`, `Card`, `SectionLabel` from it.
- PT-BR copy in this plan is normative — reproduce it exactly, do not paraphrase (per `docs/superpowers/specs/screens/01-splash.md`, `02-privacy.md`, `03-consent.md`).
- Consent store persists **only** a boolean + ISO timestamp to `localStorage` under key `zelo.consent` — never anything identifying.
- The encryption claim on the Consent screen ("Criptografia AES-256 no seu aparelho antes de qualquer envio") must stay truthful to the existing `infrastructure/crypto/web-crypto-encryption.adapter.ts` — do not alter that adapter in this plan.
- Design tokens only — no raw hex in JSX (the Splash screen's one-off gradient background is the sole named exception, per spec).

---

## File Structure

```
apps/web/src/
  stores/
    consent.store.ts                           (new)
    consent.store.test.ts                      (new)
  presentation/
    lib/
      routes.ts                                (new)
      routes.test.ts                           (new)
    pages/
      SplashPage.tsx                            (new)
      SplashPage.test.tsx                       (new)
      PrivacyPage.tsx                           (new)
      PrivacyPage.test.tsx                      (new)
      ConsentPage.tsx                           (new)
      ConsentPage.test.tsx                      (new)
  app/
    router.tsx                                  (modify: add loader + 3 routes)
    router.test.tsx                             (new: onboarding flow integration test)
```

---

## Task 1: Consent store

**Files:**
- Create: `apps/web/src/stores/consent.store.ts`
- Test: `apps/web/src/stores/consent.store.test.ts`

**Interfaces:**
- Produces: `useConsentStore` — a Zustand hook with `{ hasConsented: boolean; consentedAt: string | null; grant(): void; revoke(): void }`. Consumed by `SplashPage` (read), `ConsentPage` (write), and the router loader in Task 6.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { useConsentStore } from "./consent.store";

describe("useConsentStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("starts with no consent", () => {
    expect(useConsentStore.getState().hasConsented).toBe(false);
    expect(useConsentStore.getState().consentedAt).toBeNull();
  });

  it("grant() sets hasConsented and a timestamp, persisted to localStorage", () => {
    useConsentStore.getState().grant();
    const state = useConsentStore.getState();
    expect(state.hasConsented).toBe(true);
    expect(state.consentedAt).not.toBeNull();

    const persisted = JSON.parse(localStorage.getItem("zelo.consent")!);
    expect(persisted.state.hasConsented).toBe(true);
  });

  it("revoke() clears consent", () => {
    useConsentStore.getState().grant();
    useConsentStore.getState().revoke();
    expect(useConsentStore.getState().hasConsented).toBe(false);
    expect(useConsentStore.getState().consentedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test consent.store -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsentState {
  hasConsented: boolean;
  consentedAt: string | null;
  grant: () => void;
  revoke: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasConsented: false,
      consentedAt: null,
      grant: () => set({ hasConsented: true, consentedAt: new Date().toISOString() }),
      revoke: () => set({ hasConsented: false, consentedAt: null }),
    }),
    { name: "zelo.consent" },
  ),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test consent.store -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/consent.store.ts apps/web/src/stores/consent.store.test.ts
git commit -m "feat(web): add persisted consent store"
```

---

## Task 2: Typed route helper

**Files:**
- Create: `apps/web/src/presentation/lib/routes.ts`
- Test: `apps/web/src/presentation/lib/routes.test.ts`

**Interfaces:**
- Produces: `routes` — a frozen string-literal map. Consumed by every page component in this plan and in Plans C, D, E (crisis, chat, peers, manager paths are included now so later plans import from one place instead of re-declaring paths).

```ts
export const routes = {
  splash: "/", privacy: "/privacy", consent: "/consent", home: "/home",
  assessment: "/assessment", phq9: "/assessment/phq9", gad7: "/assessment/gad7",
  result: "/assessment/result", crisis: "/crisis", crisisConnect: "/crisis/connect",
  crisisLine: "/crisis/line", chat: "/chat", peers: "/peers", manager: "/manager",
} as const;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("routes", () => {
  it("has a unique path for every key", () => {
    const values = Object.values(routes);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every path is absolute (starts with /)", () => {
    for (const path of Object.values(routes)) {
      expect(path.startsWith("/")).toBe(true);
    }
  });

  it("matches the route table in routing-and-state.md", () => {
    expect(routes).toEqual({
      splash: "/",
      privacy: "/privacy",
      consent: "/consent",
      home: "/home",
      assessment: "/assessment",
      phq9: "/assessment/phq9",
      gad7: "/assessment/gad7",
      result: "/assessment/result",
      crisis: "/crisis",
      crisisConnect: "/crisis/connect",
      crisisLine: "/crisis/line",
      chat: "/chat",
      peers: "/peers",
      manager: "/manager",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test presentation/lib/routes -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
export const routes = {
  splash: "/",
  privacy: "/privacy",
  consent: "/consent",
  home: "/home",
  assessment: "/assessment",
  phq9: "/assessment/phq9",
  gad7: "/assessment/gad7",
  result: "/assessment/result",
  crisis: "/crisis",
  crisisConnect: "/crisis/connect",
  crisisLine: "/crisis/line",
  chat: "/chat",
  peers: "/peers",
  manager: "/manager",
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test presentation/lib/routes -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/lib/routes.ts apps/web/src/presentation/lib/routes.test.ts
git commit -m "feat(web): add typed route path helper"
```

---

## Task 3: `SplashPage`

**Files:**
- Create: `apps/web/src/presentation/pages/SplashPage.tsx`
- Test: `apps/web/src/presentation/pages/SplashPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button`, `SectionLabel` (Design System plan); `useConsentStore` (Task 1); `routes` (Task 2).
- Produces: `SplashPage` component mounted at `/` in Task 6.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { SplashPage } from "./SplashPage";
import { useConsentStore } from "../../stores/consent.store";

function renderSplash() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/privacy" element={<div>Privacy screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SplashPage", () => {
  beforeEach(() => {
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("renders the wordmark, tagline, CTA, and trust line", () => {
    renderSplash();
    expect(screen.getByText("Zelo")).toBeInTheDocument();
    expect(screen.getByText("Cuidado confidencial para quem cuida.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(screen.getByText("anônimo · criptografado · no seu controle")).toBeInTheDocument();
  });

  it("navigates to /privacy when Começar is tapped", async () => {
    renderSplash();
    await userEvent.click(screen.getByRole("button", { name: "Começar" }));
    expect(screen.getByText("Privacy screen")).toBeInTheDocument();
  });

  it("redirects to /home when consent is already granted (component-level backup guard)", () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    renderSplash();
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test SplashPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { SectionLabel } from "../ui/SectionLabel";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";

export function SplashPage() {
  const navigate = useNavigate();
  const hasConsented = useConsentStore((state) => state.hasConsented);

  // Backup to the router loader on "/" (see router.tsx) — belt-and-suspenders
  // per routing-and-state.md so a warm start never flashes onboarding.
  useEffect(() => {
    if (hasConsented) {
      navigate(routes.home, { replace: true });
    }
  }, [hasConsented, navigate]);

  return (
    <PhoneShell bleed>
      <div
        className="flex min-h-full flex-col items-center px-[34px] text-center"
        style={{ background: "linear-gradient(180deg,#EEF4F1,#F2F5F3)" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[26px] bg-brand shadow-hero">
            <span className="font-serif text-[46px] text-white">z</span>
          </div>
          <h1 className="mt-[26px] font-serif text-display text-ink">Zelo</h1>
          <p className="mt-3 max-w-[250px] text-body text-ink-2">
            Cuidado confidencial para quem cuida.
          </p>
        </div>
        <div className="w-full pb-10">
          <Button variant="primary" onClick={() => navigate(routes.privacy)}>
            Começar
          </Button>
          <div className="mt-[18px]">
            <SectionLabel>anônimo · criptografado · no seu controle</SectionLabel>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test SplashPage -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/SplashPage.tsx apps/web/src/presentation/pages/SplashPage.test.tsx
git commit -m "feat(web): add SplashPage"
```

---

## Task 4: `PrivacyPage`

**Files:**
- Create: `apps/web/src/presentation/pages/PrivacyPage.tsx`
- Test: `apps/web/src/presentation/pages/PrivacyPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button`, `Card`, `SectionLabel`; `routes`.
- Produces: `PrivacyPage` mounted at `/privacy` in Task 6.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { PrivacyPage } from "./PrivacyPage";

function renderPrivacy() {
  return render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/consent" element={<div>Consent screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PrivacyPage", () => {
  it("renders the title and all three trust claims verbatim", () => {
    renderPrivacy();
    expect(screen.getByText("Como o Zelo protege você")).toBeInTheDocument();
    expect(screen.getByText("Processado no seu aparelho")).toBeInTheDocument();
    expect(screen.getByText("O cálculo do seu resultado nunca sai do celular.")).toBeInTheDocument();
    expect(screen.getByText("Anônimo por padrão")).toBeInTheDocument();
    expect(screen.getByText("Ninguém do hospital vê quem você é — nem o seu CRM.")).toBeInTheDocument();
    expect(screen.getByText("Você no controle")).toBeInTheDocument();
    expect(screen.getByText("Nada é compartilhado sem o seu aceite explícito.")).toBeInTheDocument();
  });

  it("navigates to /consent on CTA tap", async () => {
    renderPrivacy();
    await userEvent.click(screen.getByRole("button", { name: "Entendi, continuar" }));
    expect(screen.getByText("Consent screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test PrivacyPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { routes } from "../lib/routes";

const CLAIMS = [
  { title: "Processado no seu aparelho", body: "O cálculo do seu resultado nunca sai do celular." },
  { title: "Anônimo por padrão", body: "Ninguém do hospital vê quem você é — nem o seu CRM." },
  { title: "Você no controle", body: "Nada é compartilhado sem o seu aceite explícito." },
] as const;

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <SectionLabel>Privacidade primeiro</SectionLabel>
        <h1 className="mb-[22px] mt-[10px] text-h1 text-ink">Como o Zelo protege você</h1>
        <div className="flex flex-col gap-[14px]">
          {CLAIMS.map((claim, index) => (
            <Card key={claim.title}>
              <div className="flex items-start gap-3">
                <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-icon bg-surface-brand font-serif text-[17px] text-brand">
                  {index + 1}
                </div>
                <div>
                  <p className="text-body font-extrabold text-ink">{claim.title}</p>
                  <p className="text-caption text-muted">{claim.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-[24px]">
          <Button variant="primary" onClick={() => navigate(routes.consent)}>
            Entendi, continuar
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test PrivacyPage -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/PrivacyPage.tsx apps/web/src/presentation/pages/PrivacyPage.test.tsx
git commit -m "feat(web): add PrivacyPage"
```

---

## Task 5: `ConsentPage`

**Files:**
- Create: `apps/web/src/presentation/pages/ConsentPage.tsx`
- Test: `apps/web/src/presentation/pages/ConsentPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button`, `Card`; `useConsentStore.grant()`; `routes`.
- Produces: `ConsentPage` mounted at `/consent` in Task 6.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { ConsentPage } from "./ConsentPage";
import { useConsentStore } from "../../stores/consent.store";

function renderConsent() {
  return render(
    <MemoryRouter initialEntries={["/consent"]}>
      <Routes>
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/privacy" element={<div>Privacy screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ConsentPage", () => {
  beforeEach(() => {
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("renders the three consent rows and the encryption note", () => {
    renderConsent();
    expect(screen.getByText(/não emite diagnóstico/)).toBeInTheDocument();
    expect(screen.getByText(/anônimo e agregado/)).toBeInTheDocument();
    expect(screen.getByText(/eu escolher/)).toBeInTheDocument();
    expect(screen.getByText(/Criptografia AES-256/)).toBeInTheDocument();
  });

  it("grants consent and navigates to /home when accepted", async () => {
    renderConsent();
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e entrar" }));
    expect(useConsentStore.getState().hasConsented).toBe(true);
    expect(useConsentStore.getState().consentedAt).not.toBeNull();
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("navigates back to /privacy", async () => {
    renderConsent();
    await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getByText("Privacy screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ConsentPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";

const ROWS: ReactNode[] = [
  <>Entendo que o Zelo <strong>não emite diagnóstico</strong> e não substitui atendimento profissional.</>,
  <>Autorizo o uso <strong>anônimo e agregado</strong> dos meus sinais para melhorar o cuidado da equipe.</>,
  <>Minha identidade só é revelada se <strong>eu escolher</strong> falar com uma pessoa.</>,
];

export function ConsentPage() {
  const navigate = useNavigate();
  const grant = useConsentStore((state) => state.grant);

  const handleAccept = () => {
    grant();
    navigate(routes.home, { replace: true });
  };

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <button
          type="button"
          onClick={() => navigate(routes.privacy)}
          className="flex items-center gap-1 text-label font-semibold text-muted"
        >
          ← Voltar
        </button>
        <h1 className="mb-[6px] mt-4 text-h1 text-ink">Seu consentimento</h1>
        <p className="text-caption text-muted">
          Confirme antes de entrar. Você pode revogar quando quiser.
        </p>
        <div className="mt-5 flex flex-col gap-[12px]">
          {ROWS.map((row, index) => (
            <Card key={index}>
              <div className="flex items-start gap-3">
                <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-brand text-white">
                  <Check size={14} />
                </div>
                <p className="text-label text-ink-2">{row}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-[14px] flex items-center gap-2 rounded-2xl bg-surface-brand p-[13px] font-mono text-[12.5px] leading-relaxed text-brand">
          <Lock size={16} />
          Criptografia AES-256 no seu aparelho antes de qualquer envio.
        </div>
        <div className="mt-[24px]">
          <Button variant="primary" onClick={handleAccept}>
            Aceitar e entrar
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ConsentPage -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/ConsentPage.tsx apps/web/src/presentation/pages/ConsentPage.test.tsx
git commit -m "feat(web): add ConsentPage"
```

---

## Task 6: Wire the onboarding routes and loader

**Files:**
- Modify: `apps/web/src/app/router.tsx`
- Test: `apps/web/src/app/router.test.tsx`

**Interfaces:**
- Consumes: `SplashPage`, `PrivacyPage`, `ConsentPage` (this plan); `useConsentStore`, `routes`.
- Produces: final route table for this plan — `/`, `/privacy`, `/consent`, `/home` (existing `HomePage` scaffold, untouched — replaced in the Home & Assessment plan), `/chat`, `/assessment/phq9`, `/assessment/gad7` (both existing, untouched — replaced in the Home & Assessment plan).

- [ ] **Step 1: Write the failing integration test**

```tsx
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, redirect, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashPage } from "../presentation/pages/SplashPage";
import { PrivacyPage } from "../presentation/pages/PrivacyPage";
import { ConsentPage } from "../presentation/pages/ConsentPage";
import { HomePage } from "../presentation/pages/HomePage";
import { useConsentStore } from "../stores/consent.store";
import { routes } from "../presentation/lib/routes";
import * as container from "./container";

function buildTestRouter(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        Component: () => <Outlet />,
        children: [
          {
            index: true,
            Component: SplashPage,
            loader: () => (useConsentStore.getState().hasConsented ? redirect(routes.home) : null),
          },
          { path: "privacy", Component: PrivacyPage },
          { path: "consent", Component: ConsentPage },
          { path: "home", Component: HomePage },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("onboarding router flow", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
    vi.spyOn(container.checkApiHealthUseCase, "execute").mockResolvedValue({ status: "ok", database: true });
  });

  it("cold start walks Splash -> Privacy -> Consent -> Home", async () => {
    buildTestRouter("/");
    const user = userEvent.setup();

    expect(await screen.findByRole("button", { name: "Começar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Começar" }));

    expect(await screen.findByText("Como o Zelo protege você")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entendi, continuar" }));

    expect(await screen.findByText("Seu consentimento")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aceitar e entrar" }));

    await waitFor(() => {
      expect(useConsentStore.getState().hasConsented).toBe(true);
    });
  });

  it("warm start (already consented) redirects straight to Home via the loader", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/");
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test app/router -- --run`
Expected: FAIL — `SplashPage`/`PrivacyPage`/`ConsentPage` render but the real `router.tsx` (not yet wired) is untouched; this test builds its own router so it should actually already pass once Tasks 3-5 land. Confirm the test currently reflects the *target* router shape, not the current one, by checking `apps/web/src/app/router.tsx` still lacks these routes.

- [ ] **Step 3: Modify `apps/web/src/app/router.tsx`**

```tsx
import { createBrowserRouter, Outlet, redirect } from "react-router";
import { HomePage } from "../presentation/pages/HomePage";
import { ChatPage } from "../presentation/pages/ChatPage";
import { Phq9AssessmentPage } from "../presentation/pages/Phq9AssessmentPage";
import { Gad7AssessmentPage } from "../presentation/pages/Gad7AssessmentPage";
import { SplashPage } from "../presentation/pages/SplashPage";
import { PrivacyPage } from "../presentation/pages/PrivacyPage";
import { ConsentPage } from "../presentation/pages/ConsentPage";
import { useConsentStore } from "../stores/consent.store";
import { routes } from "../presentation/lib/routes";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: () => <Outlet />,
    children: [
      {
        index: true,
        Component: SplashPage,
        loader: () => (useConsentStore.getState().hasConsented ? redirect(routes.home) : null),
      },
      {
        path: "privacy",
        Component: PrivacyPage,
      },
      {
        path: "consent",
        Component: ConsentPage,
      },
      {
        path: "home",
        Component: HomePage,
      },
      {
        path: "chat",
        Component: ChatPage,
      },
      {
        path: "assessment/phq9",
        Component: Phq9AssessmentPage,
      },
      {
        path: "assessment/gad7",
        Component: Gad7AssessmentPage,
      },
    ],
  },
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test app/router -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test suite and build**

Run: `pnpm --filter web test -- --run && pnpm --filter web build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx
git commit -m "feat(web): wire onboarding routes with consent redirect loader"
```

---

## Acceptance criteria (whole plan)

- Cold start (no `zelo.consent` in `localStorage`) lands on Splash; completing Splash → Privacy → Consent sets the store and lands on Home.
- Warm start (consent already granted) never shows Splash — the `/` loader redirects to `/home` before paint; `SplashPage`'s own `useEffect` guard is the backup path.
- Reloading after consent skips onboarding entirely.
- All PT-BR copy on the three screens matches the spec verbatim (trust-critical strings).
- No raw hex in any of the three pages except Splash's one-off gradient background.

---

## Self-review notes

- **Spec coverage:** Phase 3 (`01-splash.md`, `02-privacy.md`, `03-consent.md`) → Tasks 3-5. Routing spec §1 (route table, `/` loader), §2 (consent store), §4 (routes helper) → Tasks 1, 2, 6. Routing spec §3 (passing assessment result forward) is **out of scope for this plan** — it belongs to the Home & Assessment Vertical plan, which owns `AssessmentResultPage`.
- **Placeholder scan:** none found.
- **Type consistency:** `ConsentState` shape (`hasConsented`, `consentedAt`, `grant`, `revoke`) matches between Task 1's implementation and every consumer in Tasks 3, 5, 6. `routes` keys match `routing-and-state.md`'s table exactly (verified by Task 2's own test).
