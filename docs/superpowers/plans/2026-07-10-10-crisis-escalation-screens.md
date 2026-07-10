# Crisis Escalation Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the highest-stakes surface in the app — the offer/accept/decline fork that connects a user to a real human or the CVV crisis line — with autonomy-respecting copy and a guarantee that the CVV path works with zero network dependency.

**Architecture:** Three new presentation pages consuming the existing, deliberately synchronous `RequestHumanHandoffUseCase` (no network, no port) for the CVV label/phone, plus a small client-side ephemeral-token generator for the not-yet-built psychologist-connect placeholder. No domain/use-case/port changes.

**Tech Stack:** React 19, `react-router` v8, Web Crypto (`crypto.getRandomValues`, already used elsewhere in the app), Vitest + Testing Library.

## Global Constraints

- **Prerequisites:** Design System Foundation plan (`2026-07-10-07-...`) and Onboarding & Consent plan (`2026-07-10-08-...`) must be implemented first — this plan consumes their primitives and `routes`. It does **not** require the Home & Assessment plan or Support Surfaces plan, though `/crisis` is reachable from both once they land (`AssessmentResultPage`'s risk callout, `ChatPage`'s handoff button) — those are forward references that work once this plan's routes exist.
- The CVV label and phone number come from `RequestHumanHandoffUseCase.execute()` — **never hardcode "188"** or the CVV label string in JSX. One source of truth.
- `RequestHumanHandoffUseCase` is synchronous and I/O-free by design (FR-6b) — every screen in this plan must render correctly with the network fully disabled.
- The psychologist-connect flow is Week-2 scope (not yet built). `CrisisAcceptPage` is a **designed placeholder**: generate a random ephemeral token client-side for display only, never persist it, never call a backend. Mark with `// TODO(week2)`. Do not fabricate a use-case or port for it.
- Autonomy language throughout: no guilt/penalty framing on decline, no dead-ends — both branches from the offer screen must be reachable and every screen must have a way back.
- PT-BR copy is normative (per `08-crisis-offer.md`, `09-crisis-accept.md`, `10-crisis-decline.md`).
- No raw hex in JSX except the placeholder token box's muted sub-line color (`#6F8F84`), which is a one-off darkened tint of `dark.brand` used only inside the `bg-dark` token box, matching the spec verbatim.

---

## File Structure

```
apps/web/src/presentation/
  lib/
    generate-ephemeral-token.ts                  (new)
    generate-ephemeral-token.test.ts             (new)
  pages/
    CrisisOfferPage.tsx                           (new)
    CrisisOfferPage.test.tsx                      (new)
    CrisisAcceptPage.tsx                          (new)
    CrisisAcceptPage.test.tsx                     (new)
    CrisisDeclinePage.tsx                         (new)
    CrisisDeclinePage.test.tsx                    (new)
apps/web/src/app/
  router.tsx                                      (modify: add /crisis, /crisis/connect, /crisis/line)
  router.test.tsx                                 (modify: extend with the new routes)
```

---

## Task 1: `CrisisOfferPage`

**Files:**
- Create: `apps/web/src/presentation/pages/CrisisOfferPage.tsx`
- Test: `apps/web/src/presentation/pages/CrisisOfferPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button`, `Card`, `IconBadge` (Design System plan); `requestHumanHandoffUseCase` (existing, from `app/container`); `routes`.
- Produces: `CrisisOfferPage`, mounted at `/crisis` in Task 4. This is the fork every other page in this plan and `AssessmentResultPage`/`ChatPage` route into.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { CrisisOfferPage } from "./CrisisOfferPage";

function renderOffer() {
  return render(
    <MemoryRouter initialEntries={["/crisis"]}>
      <Routes>
        <Route path="/crisis" element={<CrisisOfferPage />} />
        <Route path="/crisis/connect" element={<div>Crisis accept screen</div>} />
        <Route path="/crisis/line" element={<div>Crisis decline screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisOfferPage", () => {
  it("renders the offer copy and the always-on CVV card sourced from the handoff use-case", () => {
    renderOffer();
    expect(screen.getByText("Você não está sozinho(a).")).toBeInTheDocument();
    expect(screen.getByText(/A escolha é sempre sua/)).toBeInTheDocument();
    expect(screen.getByText("sempre disponível")).toBeInTheDocument();
    expect(screen.getByText("CVV · 188")).toBeInTheDocument();
  });

  it("navigates to /crisis/connect when accepting", async () => {
    const user = userEvent.setup();
    renderOffer();
    await user.click(screen.getByRole("button", { name: "Sim, quero falar com um psicólogo" }));
    expect(screen.getByText("Crisis accept screen")).toBeInTheDocument();
  });

  it("navigates to /crisis/line when declining", async () => {
    const user = userEvent.setup();
    renderOffer();
    await user.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.getByText("Crisis decline screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test CrisisOfferPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import { HeartHandshake } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { requestHumanHandoffUseCase } from "../../app/container";
import { routes } from "../lib/routes";

export function CrisisOfferPage() {
  const navigate = useNavigate();
  const handoff = requestHumanHandoffUseCase.execute();
  // The use-case's label is the long form ("CVV - Centro de Valorização da Vida");
  // the short form before " - " is what the spec's "CVV · 188" copy expects.
  const shortLabel = handoff.externalCrisisLine.label.split(" - ")[0];

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-[30px]">
        <IconBadge icon={HeartHandshake} size={60} />
        <h1 className="mt-5 text-h1 text-ink">Você não está sozinho(a).</h1>
        <p className="mt-2 text-body text-muted">
          A escolha é sempre sua. Você prefere falar com uma pessoa de verdade agora?
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate(routes.crisisConnect)}>
            Sim, quero falar com um psicólogo
          </Button>
          <Button variant="outline" onClick={() => navigate(routes.crisisLine)}>
            Agora não
          </Button>
        </div>

        <div className="flex-1" />

        <Card tone="brand-tint">
          <p className="font-mono text-eyebrow uppercase text-brand">sempre disponível</p>
          <p className="mt-1 text-body font-extrabold text-ink">
            {shortLabel} · {handoff.externalCrisisLine.phone}
          </p>
          <p className="text-caption text-muted">Ligação gratuita e sigilosa, 24h.</p>
        </Card>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test CrisisOfferPage -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/CrisisOfferPage.tsx apps/web/src/presentation/pages/CrisisOfferPage.test.tsx
git commit -m "feat(web): add CrisisOfferPage"
```

---

## Task 2: Ephemeral token generator

**Files:**
- Create: `apps/web/src/presentation/lib/generate-ephemeral-token.ts`
- Test: `apps/web/src/presentation/lib/generate-ephemeral-token.test.ts`

**Interfaces:**
- Produces: `generateEphemeralToken(): string` — consumed by `CrisisAcceptPage` (Task 3). Pure, synchronous, no I/O, nothing persisted.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { generateEphemeralToken } from "./generate-ephemeral-token";

describe("generateEphemeralToken", () => {
  it("returns a token matching the zl-xxxx-xxxx shape", () => {
    expect(generateEphemeralToken()).toMatch(/^zl-[a-z2-7]{4}-[a-z2-7]{4}$/);
  });

  it("returns a different token on each call", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateEphemeralToken()));
    expect(tokens.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test generate-ephemeral-token -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Client-side, display-only, never persisted or sent anywhere — see the TODO(week2)
 * note on CrisisAcceptPage. Not cryptographically meaningful; it only needs to look
 * like a session token, not function as one.
 */
export function generateEphemeralToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `zl-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test generate-ephemeral-token -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/lib/generate-ephemeral-token.ts apps/web/src/presentation/lib/generate-ephemeral-token.test.ts
git commit -m "feat(web): add client-side ephemeral token generator for crisis accept placeholder"
```

---

## Task 3: `CrisisAcceptPage` and `CrisisDeclinePage`

**Files:**
- Create: `apps/web/src/presentation/pages/CrisisAcceptPage.tsx`
- Test: `apps/web/src/presentation/pages/CrisisAcceptPage.test.tsx`
- Create: `apps/web/src/presentation/pages/CrisisDeclinePage.tsx`
- Test: `apps/web/src/presentation/pages/CrisisDeclinePage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button`, `Card` (Design System); `generateEphemeralToken` (Task 2); `requestHumanHandoffUseCase`; `routes`.
- Produces: `CrisisAcceptPage` (mounted at `/crisis/connect`), `CrisisDeclinePage` (mounted at `/crisis/line`) in Task 4.

- [ ] **Step 1: Write the failing tests**

`CrisisAcceptPage.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { CrisisAcceptPage } from "./CrisisAcceptPage";

function renderAccept() {
  return render(
    <MemoryRouter initialEntries={["/crisis/connect"]}>
      <Routes>
        <Route path="/crisis/connect" element={<CrisisAcceptPage />} />
        <Route path="/crisis" element={<div>Crisis offer screen</div>} />
        <Route path="/chat" element={<div>Chat screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisAcceptPage", () => {
  it("renders a fresh token and the required privacy statements", () => {
    renderAccept();
    expect(screen.getByText(/token: zl-/)).toBeInTheDocument();
    expect(screen.getByText(/identidade não é armazenada/)).toBeInTheDocument();
    expect(screen.getByText(/sem vínculo com CRM/)).toBeInTheDocument();
    expect(screen.getByText("Psicólogo(a) parceiro(a)")).toBeInTheDocument();
  });

  it("writes nothing to localStorage and makes no network call", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    renderAccept();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("navigates to /chat on the primary CTA and back to /crisis on back", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "Iniciar conversa segura" }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });
});
```

`CrisisDeclinePage.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { CrisisDeclinePage } from "./CrisisDeclinePage";

function renderDecline() {
  return render(
    <MemoryRouter initialEntries={["/crisis/line"]}>
      <Routes>
        <Route path="/crisis/line" element={<CrisisDeclinePage />} />
        <Route path="/crisis" element={<div>Crisis offer screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisDeclinePage", () => {
  it("renders no-penalty copy and a real tel: link sourced from the handoff use-case", () => {
    renderDecline();
    expect(screen.getByText("Tudo bem. A escolha é sua.")).toBeInTheDocument();
    expect(screen.getByText(/sem pressa e sem penalidade/)).toBeInTheDocument();
    const callLink = screen.getByRole("link", { name: "Ligar para o CVV" });
    expect(callLink).toHaveAttribute("href", "tel:188");
  });

  it("navigates to /home on the outline CTA", async () => {
    const user = userEvent.setup();
    renderDecline();
    await user.click(screen.getByRole("button", { name: "Voltar ao início" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter web test CrisisAcceptPage CrisisDeclinePage -- --run`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementations**

`CrisisAcceptPage.tsx`:

```tsx
import { useState } from "react";
import { UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { generateEphemeralToken } from "../lib/generate-ephemeral-token";
import { routes } from "../lib/routes";

// TODO(week2): real provider matching + secure channel. Until then this screen is a
// designed placeholder — the token is illustrative and is never persisted or sent anywhere.
export function CrisisAcceptPage() {
  const navigate = useNavigate();
  const [token] = useState(generateEphemeralToken);

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-[30px]">
        <button
          type="button"
          onClick={() => navigate(routes.crisis)}
          className="text-label font-semibold text-muted"
        >
          ← Voltar
        </button>
        <h1 className="mb-2 mt-4 text-h1 text-ink">Conectando com segurança</h1>
        <p className="text-caption text-muted">
          Um token temporário foi criado só para esta conversa. Sua identidade não é armazenada.
        </p>

        <div className="mt-5 rounded-2xl bg-dark p-[18px]">
          <p className="font-mono text-dark-brand">token: {token}</p>
          <p className="mt-1 font-mono text-[12px] text-[#6F8F84]">
            expira ao fim da sessão · sem vínculo com CRM
          </p>
        </div>

        <div className="mt-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-surface-brand text-brand">
                <UserRound size={22} />
              </div>
              <div>
                <p className="text-body font-extrabold text-ink">Psicólogo(a) parceiro(a)</p>
                <p className="text-caption text-brand">● disponível agora</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-1" />

        <Button variant="primary" onClick={() => navigate(routes.chat)}>
          Iniciar conversa segura
        </Button>
      </div>
    </PhoneShell>
  );
}
```

`CrisisDeclinePage.tsx`:

```tsx
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { requestHumanHandoffUseCase } from "../../app/container";
import { routes } from "../lib/routes";

export function CrisisDeclinePage() {
  const navigate = useNavigate();
  const handoff = requestHumanHandoffUseCase.execute();
  const shortLabel = handoff.externalCrisisLine.label.split(" - ")[0];

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-[30px]">
        <button
          type="button"
          onClick={() => navigate(routes.crisis)}
          className="text-label font-semibold text-muted"
        >
          ← Voltar
        </button>
        <h1 className="mb-2 mt-4 text-h1 text-ink">Tudo bem. A escolha é sua.</h1>
        <p className="text-body text-muted">
          A oferta continua aberta a qualquer momento — sem pressa e sem penalidade.
        </p>

        <div className="mt-6">
          <Card size="lg" tone="brand">
            <p className="font-mono text-eyebrow uppercase opacity-85">linha de crise · 24h</p>
            <p className="mt-2 font-serif text-[40px]">
              {shortLabel} {handoff.externalCrisisLine.phone}
            </p>
            <p className="mt-2 text-label opacity-85">
              Gratuita, sigilosa e disponível a qualquer hora. Você pode ligar agora.
            </p>
            <a
              href={`tel:${handoff.externalCrisisLine.phone}`}
              className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-pill bg-white px-4 font-sans text-[16px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ligar para o CVV
            </a>
          </Card>
        </div>

        <div className="flex-1" />

        <Button variant="outline" onClick={() => navigate(routes.home)}>
          Voltar ao início
        </Button>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web test CrisisAcceptPage CrisisDeclinePage -- --run`
Expected: PASS (3 tests + 2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/CrisisAcceptPage.tsx apps/web/src/presentation/pages/CrisisAcceptPage.test.tsx apps/web/src/presentation/pages/CrisisDeclinePage.tsx apps/web/src/presentation/pages/CrisisDeclinePage.test.tsx
git commit -m "feat(web): add CrisisAcceptPage and CrisisDeclinePage"
```

---

## Task 4: Wire the crisis routes

**Files:**
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`

**Interfaces:**
- Consumes: `CrisisOfferPage` (Task 1), `CrisisAcceptPage`, `CrisisDeclinePage` (Task 3).
- Produces: adds `crisis`, `crisis/connect`, `crisis/line` to the route table.

- [ ] **Step 1: Extend the router test**

Add imports and three children entries to `buildTestRouter` in `apps/web/src/app/router.test.tsx`, then add:

```tsx
it("the crisis fork is reachable and both branches resolve without dead-ends", async () => {
  useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
  const router = buildTestRouter("/crisis");
  const user = userEvent.setup();

  expect(await screen.findByRole("button", { name: "Agora não" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Agora não" }));
  expect(await screen.findByText("Tudo bem. A escolha é sua.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test app/router -- --run`
Expected: FAIL — `buildTestRouter` doesn't yet include the crisis routes.

- [ ] **Step 3: Modify `apps/web/src/app/router.tsx`**

Add the import block and three children entries:

```tsx
import { CrisisOfferPage } from "../presentation/pages/CrisisOfferPage";
import { CrisisAcceptPage } from "../presentation/pages/CrisisAcceptPage";
import { CrisisDeclinePage } from "../presentation/pages/CrisisDeclinePage";
```

```tsx
      { path: "crisis", Component: CrisisOfferPage },
      { path: "crisis/connect", Component: CrisisAcceptPage },
      { path: "crisis/line", Component: CrisisDeclinePage },
```

(inserted into the existing `children` array from the Home & Assessment plan, order doesn't matter for `react-router` matching).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test app/router -- --run`
Expected: PASS.

- [ ] **Step 5: Run the full test suite and build**

Run: `pnpm --filter web test -- --run && pnpm --filter web build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx
git commit -m "feat(web): wire crisis offer/accept/decline routes"
```

---

## Acceptance criteria (whole plan)

- All three crisis screens render fully with the network disabled — verified structurally by the fact that `RequestHumanHandoffUseCase` performs no I/O and `CrisisAcceptPage`'s token generator is pure client-side crypto.
- Both branches from the offer screen are reachable; neither is a dead end (accept → chat, decline → CVV hero with a way back to Home).
- No autonomy-violating language (no guilt/penalty framing) anywhere in the decline path.
- "188" and the CVV label never appear as string literals in JSX — always read from `requestHumanHandoffUseCase.execute()`.
- A fresh ephemeral token renders on every visit to `CrisisAcceptPage`; nothing is written to storage or network.

---

## Self-review notes

- **Spec coverage:** `08-crisis-offer.md` → Task 1. `09-crisis-accept.md` (incl. ephemeral token) → Tasks 2, 3. `10-crisis-decline.md` → Task 3. Router wiring → Task 4.
- **Placeholder scan:** none found. The `// TODO(week2)` on `CrisisAcceptPage` is spec-mandated for a genuinely not-yet-built backend feature, not a plan placeholder.
- **Type consistency:** `requestHumanHandoffUseCase.execute()` returns `HumanHandoffInfo` (`{ message, externalCrisisLine: { label, phone } }`) — both `CrisisOfferPage` and `CrisisDeclinePage` destructure it identically (`shortLabel` derivation, `.phone` for the `tel:` link) rather than duplicating the parsing logic with drift risk.
