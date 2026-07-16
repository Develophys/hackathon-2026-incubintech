# Você (Consent Status & Revoke) Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/you` screen so the `BottomNav` "Você" tab (currently a no-op) navigates
somewhere real, letting a doctor see their consent is active and revoke it — closing a gap that
`ConsentPage`'s own copy ("Você pode revogar quando quiser") and `routing-and-state.md` have
promised since the original design but never shipped.

**Architecture:** Presentation-layer only. `useConsentStore.revoke()` already exists and is
already unit-tested (`apps/web/src/stores/consent.store.ts`, `consent.store.test.ts`) — this
plan adds its first caller. No backend call, no new use-case, no new store. One new page
component, one new route (with a loader mirroring `/home`'s), and one one-line change to
`HomePage`'s existing `handleNavigate`.

**Tech Stack:** React 18, `react-router` v6 data router, Zustand, Tailwind (design tokens from
`docs/superpowers/specs/design-tokens.md`), Vitest + Testing Library + `vitest-axe`.

## Global Constraints

- **Spec is already written and docs are already updated** — this plan implements
  `docs/superpowers/specs/screens/15-you.md`. `routing-and-state.md` and
  `screens/00-overview.md` already reference it; no further doc edits are part of this plan.
- **No backend changes.** Consent is `localStorage`-only (`zelo.consent`); nothing crosses the
  network on this screen (`AGENTS.md` golden rules — presentation layer only).
- **No new use-case or port.** Call `useConsentStore` directly, same as `ConsentPage.tsx` does.
- **PT-BR copy is normative** — use the exact strings from `screens/15-you.md`, do not paraphrase.
- **Design tokens only** — no raw hex; reuse `Button`, `Card`, `IconBadge`, `PrivacyBadge`,
  `BackButton`, `PhoneShell` from `src/presentation/{ui,layout}` exactly as already implemented.
- Every new/changed test file uses the existing conventions in this repo: Vitest +
  `@testing-library/react` + `@testing-library/user-event`, `MemoryRouter`/`Routes`/`Route` for
  page-level tests (see `HomePage.test.tsx`), `createMemoryRouter`/`RouterProvider` reusing
  `routeChildren` for router-level tests (see `router.test.tsx`).

---

### Task 1: `YouPage` component

**Files:**
- Create: `apps/web/src/presentation/pages/YouPage.tsx`
- Test: `apps/web/src/presentation/pages/YouPage.test.tsx`

**Interfaces:**
- Consumes: `useConsentStore` (`apps/web/src/stores/consent.store.ts`) — `hasConsented: boolean`,
  `consentedAt: string | null`, `revoke: () => void`. `routes` (`apps/web/src/presentation/lib/
  routes.ts`) — will add `routes.you` in Task 2; this task only needs `routes.home` and
  `routes.splash`, both already present.
- Produces: `YouPage` — a zero-prop page component (`export function YouPage(): JSX.Element`) —
  Task 2 wires it into the router, Task 3's `HomePage` navigates to its route.

- [ ] **Step 1: Write the failing test file**

```tsx
// apps/web/src/presentation/pages/YouPage.test.tsx
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { YouPage } from "./YouPage";
import { useConsentStore } from "../../stores/consent.store";

function renderYou() {
  return render(
    <MemoryRouter initialEntries={["/you"]}>
      <Routes>
        <Route path="/you" element={<YouPage />} />
        <Route path="/home" element={<div>Home screen</div>} />
        <Route path="/" element={<div>Splash screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("YouPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-07-12T12:00:00.000Z" });
  });

  it("shows consent status with the formatted consent date", () => {
    renderYou();
    expect(screen.getByText("Consentimento ativo")).toBeInTheDocument();
    expect(screen.getByText(/Desde 12 de julho de 2026/)).toBeInTheDocument();
  });

  it("shows the anonymity badge", () => {
    renderYou();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
  });

  it("back button navigates to /home", async () => {
    renderYou();
    await userEvent.click(screen.getByRole("button", { name: "Início" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("tapping Revogar consentimento reveals the confirm step without changing state", async () => {
    renderYou();
    await userEvent.click(screen.getByRole("button", { name: "Revogar consentimento" }));
    expect(screen.getByText(/Tem certeza/)).toBeInTheDocument();
    expect(useConsentStore.getState().hasConsented).toBe(true);
  });

  it("Cancelar returns to idle without changing state", async () => {
    renderYou();
    await userEvent.click(screen.getByRole("button", { name: "Revogar consentimento" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/Tem certeza/)).not.toBeInTheDocument();
    expect(useConsentStore.getState().hasConsented).toBe(true);
  });

  it("Sim, revogar clears consent and navigates to Splash", async () => {
    renderYou();
    await userEvent.click(screen.getByRole("button", { name: "Revogar consentimento" }));
    await userEvent.click(screen.getByRole("button", { name: "Sim, revogar" }));
    expect(useConsentStore.getState().hasConsented).toBe(false);
    expect(useConsentStore.getState().consentedAt).toBeNull();
    expect(screen.getByText("Splash screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- YouPage.test.tsx`
Expected: FAIL — `Cannot find module './YouPage'` (the component doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/web/src/presentation/pages/YouPage.tsx
import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";

export function YouPage() {
  const navigate = useNavigate();
  const consentedAt = useConsentStore((state) => state.consentedAt);
  const revoke = useConsentStore((state) => state.revoke);
  const [step, setStep] = useState<"idle" | "confirming">("idle");

  const handleRevoke = () => {
    revoke();
    navigate(routes.splash, { replace: true });
  };

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <div className="flex items-center justify-between">
          <BackButton label="Início" onClick={() => navigate(routes.home)} />
          <PrivacyBadge />
        </div>
        <h1 className="mt-4 text-h1 text-ink">Você</h1>
        <p className="mt-1 text-caption text-muted">Seu consentimento e sua privacidade.</p>

        <Card size="md" className="mt-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Check} tone="brand" />
            <div>
              <p className="text-body font-extrabold text-ink">Consentimento ativo</p>
              {consentedAt && (
                <p className="text-caption text-muted">
                  Desde{" "}
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(consentedAt))}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card size="md" className="mt-[14px]">
          <p className="text-label text-ink-2">
            Revogar não apaga o histórico anônimo já enviado — os dados agregados não podem ser
            associados a você. Mas você deixa de ter acesso ao check-in, ao chat e ao histórico
            até consentir de novo.
          </p>
        </Card>

        <div className="mt-[14px]">
          {step === "idle" ? (
            <Button variant="danger" onClick={() => setStep("confirming")}>
              Revogar consentimento
            </Button>
          ) : (
            <Card tone="brand-tint">
              <p className="text-label text-ink-2">
                Tem certeza? Você vai sair da área autenticada e precisará aceitar o
                consentimento novamente para voltar.
              </p>
              <div className="mt-3 flex gap-3">
                <Button variant="outline" full={false} className="flex-1" onClick={() => setStep("idle")}>
                  Cancelar
                </Button>
                <Button variant="danger" full={false} className="flex-1" onClick={handleRevoke}>
                  Sim, revogar
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web test -- YouPage.test.tsx`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/YouPage.tsx apps/web/src/presentation/pages/YouPage.test.tsx
git commit -m "feat(web): add YouPage for consent status and revoke"
```

---

### Task 2: Wire the `/you` route

**Files:**
- Modify: `apps/web/src/presentation/lib/routes.ts`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`
- Modify: `apps/web/src/presentation/pages/a11y.test.tsx`

**Interfaces:**
- Consumes: `YouPage` from Task 1 (`apps/web/src/presentation/pages/YouPage.tsx`).
- Produces: `routes.you === "/you"`; the route is registered in `routeChildren` with a loader
  matching `/home`'s pattern (redirect to `/privacy` when `!hasConsented`). Task 3's `HomePage`
  navigates to `routes.you`.

- [ ] **Step 1: Write the failing tests**

Add to `apps/web/src/app/router.test.tsx` (inside the existing `describe("onboarding router
flow", ...)` block, after the last `it(...)`):

```tsx
  it("Home's Você tab reaches the consent screen, and revoking returns to Splash", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/home");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Você" }));
    expect(await screen.findByText("Consentimento ativo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revogar consentimento" }));
    await user.click(screen.getByRole("button", { name: "Sim, revogar" }));

    expect(await screen.findByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(useConsentStore.getState().hasConsented).toBe(false);
  });

  it("an unconsented user hitting /you directly is redirected to Privacy via the loader", async () => {
    buildTestRouter("/you");
    expect(await screen.findByText("Como o Zelo protege você")).toBeInTheDocument();
  });
```

Add to `apps/web/src/presentation/pages/a11y.test.tsx`: import `YouPage` alongside the other
page imports, and add one entry to the `SCREENS` array (after the `ManagerDashboard` entry):

```tsx
import { YouPage } from "./YouPage";
// …
  { name: "You", Component: YouPage, path: "/you" },
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter web test -- router.test.tsx a11y.test.tsx`
Expected: FAIL — clicking "Você" does nothing (no navigation occurs, so "Consentimento ativo"
is never found); `YouPage` import fails to resolve in `a11y.test.tsx` only if you added the
import before Task 1 — since Task 1 already created the file, the failure here is purely
`buildTestRouter("/you")` 404-ing (no such route yet).

- [ ] **Step 3: Wire the route**

In `apps/web/src/presentation/lib/routes.ts`, add `you` to the `routes` object:

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
  managerLogin: "/manager/login",
  you: "/you",
} as const;
```

In `apps/web/src/app/router.tsx`, import `YouPage` and append its route object (after the
`manager` entry, before the closing `];`):

```tsx
import { YouPage } from "../presentation/pages/YouPage";
```

```tsx
  {
    path: "you",
    Component: YouPage,
    loader: () => (useConsentStore.getState().hasConsented ? null : redirect(routes.privacy)),
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter web test -- router.test.tsx a11y.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/lib/routes.ts apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/presentation/pages/a11y.test.tsx
git commit -m "feat(web): register /you route with consent-gated loader"
```

---

### Task 3: Wire `BottomNav`'s "Você" tab from `HomePage`

**Files:**
- Modify: `apps/web/src/presentation/pages/HomePage.tsx:48-53`
- Modify: `apps/web/src/presentation/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `routes.you` from Task 2.
- Produces: `HomePage`'s `BottomNav` "Você" tab now navigates instead of no-op'ing — this is the
  last piece; nothing downstream depends on it.

- [ ] **Step 1: Write the failing test**

In `apps/web/src/presentation/pages/HomePage.test.tsx`, add `/you` to `renderHome`'s `<Routes>`:

```tsx
        <Route path="/you" element={<div>You screen</div>} />
```

and add a new `it` block (near the other navigation tests):

```tsx
  it("navigates to /you when the Você tab is tapped", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: "Você" }));
    expect(screen.getByText("You screen")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- HomePage.test.tsx`
Expected: FAIL — tapping "Você" does nothing, so "You screen" never renders.

- [ ] **Step 3: Write the minimal implementation**

In `apps/web/src/presentation/pages/HomePage.tsx`, replace:

```ts
  const handleNavigate = (tab: "home" | "checkin" | "chat" | "you") => {
    if (tab === "home") navigate(routes.home);
    if (tab === "checkin") navigate(routes.assessment);
    if (tab === "chat") navigate(routes.chat);
    // "you" tab: no destination yet — TODO(week2): profile/revoke-consent screen.
  };
```

with:

```ts
  const handleNavigate = (tab: "home" | "checkin" | "chat" | "you") => {
    if (tab === "home") navigate(routes.home);
    if (tab === "checkin") navigate(routes.assessment);
    if (tab === "chat") navigate(routes.chat);
    if (tab === "you") navigate(routes.you);
  };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web test -- HomePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full web test suite**

Run: `pnpm --filter web test`
Expected: PASS — no regressions in `router.test.tsx`, `a11y.test.tsx`, `BottomNav.test.tsx`,
`consent.store.test.ts`, or any other suite.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/presentation/pages/HomePage.tsx apps/web/src/presentation/pages/HomePage.test.tsx
git commit -m "feat(web): wire BottomNav's Você tab to the new /you screen"
```

---

## Self-Review Notes

- **Spec coverage:** every acceptance-criteria line in `screens/15-you.md` maps to a test —
  consent status + date (Task 1), redirect-when-unconsented (Task 2), idle/confirm/cancel/revoke
  states (Task 1), BottomNav wiring (Task 3), axe-core (Task 2's `a11y.test.tsx` addition).
- **No backend/use-case touched** — confirmed only `apps/web` files appear across all three
  tasks, consistent with the Global Constraints.
- **Type consistency** — `Tab` stays `"home" | "checkin" | "chat" | "you"` throughout (unchanged
  from `BottomNav.tsx`); `routes.you` is the one new field, used identically in `router.tsx` and
  `HomePage.tsx`.
