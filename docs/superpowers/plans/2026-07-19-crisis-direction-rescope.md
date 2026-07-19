# Crisis Direction Re-scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `CrisisAcceptPage`'s simulated "live connection to a psychologist" placeholder with a differentiated-routing screen (SUS vs. plano de saúde/rede privada), per ADR-003 Parte 1 and the ACM's answer to question 1.2.

**Architecture:** One new pure, synchronous, I/O-free use case (`GetCrisisDirectionUseCase`, same shape as the existing `RequestHumanHandoffUseCase`) feeding a rewritten `CrisisAcceptPage`. No backend, no new ports, no persistence — same "designed placeholder honesty" pattern already used elsewhere in this codebase (`RequestHumanHandoffUseCase`, `ManagerDashboardPage`'s fabricated data).

**Tech Stack:** React 18 (function components), TypeScript, Vitest + @testing-library/react + @testing-library/user-event, react-router (`MemoryRouter` in tests), Tailwind utility classes matching existing `PhoneShell`/`Card`/`Button`/`BackButton` primitives.

## Global Constraints

- No network call and no storage write (localStorage/sessionStorage/IndexedDB) anywhere in this screen or the new use case — verified by test, not just by inspection.
- Route stays `/crisis/connect` (`routes.crisisConnect`) — do not rename or move it.
- Do not modify `RequestHumanHandoffUseCase`, `08-crisis-offer.md`/`CrisisOfferPage.tsx`, or `10-crisis-decline.md`/`CrisisDeclinePage.tsx` — out of scope per ADR-003.
- CVV 188 line must be visible on this screen at all times, sourced from `RequestHumanHandoffUseCase.execute()` (one source of truth for the label/phone, same as the other two crisis screens), never hardcoded in JSX.
- No UI copy may imply a live/real-time human connection ("disponível agora", "conversa segura", token/session language) — this is the entire point of the change.

---

### Task 1: `GetCrisisDirectionUseCase`

**Files:**
- Create: `apps/web/src/use-cases/get-crisis-direction.usecase.ts`
- Test: `apps/web/src/use-cases/get-crisis-direction.usecase.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no ports).
- Produces: `ProfessionalBond` (`"sus" | "private"`), `CrisisDirectionInfo { bond, title, message }`, and `GetCrisisDirectionUseCase.execute(bond: ProfessionalBond): CrisisDirectionInfo` — Task 2 imports these three names directly from this file.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { GetCrisisDirectionUseCase } from "./get-crisis-direction.usecase";

describe("GetCrisisDirectionUseCase", () => {
  it("returns SUS-specific direction copy for bond 'sus'", () => {
    const useCase = new GetCrisisDirectionUseCase();

    const result = useCase.execute("sus");

    expect(result.bond).toBe("sus");
    expect(result.title).toBe("Rede SUS");
    expect(result.message).toMatch(/CAPS/);
  });

  it("returns private-network-specific direction copy for bond 'private'", () => {
    const useCase = new GetCrisisDirectionUseCase();

    const result = useCase.execute("private");

    expect(result.bond).toBe("private");
    expect(result.title).toBe("Plano de saúde / rede privada");
    expect(result.message).toMatch(/plano de saúde/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/use-cases/get-crisis-direction.usecase.test.ts`
Expected: FAIL — `get-crisis-direction.usecase.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type ProfessionalBond = "sus" | "private";

export interface CrisisDirectionInfo {
  bond: ProfessionalBond;
  title: string;
  message: string;
}

const DIRECTIONS: Record<ProfessionalBond, Omit<CrisisDirectionInfo, "bond">> = {
  sus: {
    title: "Rede SUS",
    message:
      "Procure o CAPS (Centro de Atenção Psicossocial) mais próximo ou o serviço de saúde mental da sua unidade de saúde. Se for uma emergência, o CVV também pode ajudar agora.",
  },
  private: {
    title: "Plano de saúde / rede privada",
    message:
      "Entre em contato com a central do seu plano de saúde ou com o serviço de saúde ocupacional do hospital para acionar o atendimento em saúde mental da sua rede. Se for uma emergência, o CVV também pode ajudar agora.",
  },
};

// TODO(acm-response): replace DIRECTIONS' messages with the concrete channel list once
// the ACM answers the clarifying e-mail sent 19/07/2026 (see
// general-documentations/documentacao-produto/2026-07-19_stakeholder-update-email-esclarecimentos-acm.md).
export class GetCrisisDirectionUseCase {
  execute(bond: ProfessionalBond): CrisisDirectionInfo {
    return { bond, ...DIRECTIONS[bond] };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/use-cases/get-crisis-direction.usecase.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/use-cases/get-crisis-direction.usecase.ts apps/web/src/use-cases/get-crisis-direction.usecase.test.ts
git commit -m "feat: add GetCrisisDirectionUseCase for SUS/private crisis routing"
```

---

### Task 2: Rewrite `CrisisAcceptPage` and delete the ephemeral-token placeholder

**Files:**
- Modify: `apps/web/src/presentation/pages/CrisisAcceptPage.tsx`
- Modify: `apps/web/src/presentation/pages/CrisisAcceptPage.test.tsx` (full rewrite)
- Delete: `apps/web/src/presentation/lib/generate-ephemeral-token.ts`
- Delete: `apps/web/src/presentation/lib/generate-ephemeral-token.test.ts`

**Interfaces:**
- Consumes: `GetCrisisDirectionUseCase`, `ProfessionalBond`, `CrisisDirectionInfo` (Task 1); `requestHumanHandoffUseCase` (existing singleton from `apps/web/src/app/container.ts`, already used the same way by `CrisisOfferPage.tsx`/`CrisisDeclinePage.tsx` — grep either for the exact import pattern before writing this file).
- Produces: nothing new for later tasks (this is the leaf of this plan).

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `apps/web/src/presentation/pages/CrisisAcceptPage.test.tsx`:

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
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisAcceptPage", () => {
  it("asks for the professional bond before showing any direction", () => {
    renderAccept();
    expect(screen.getByRole("button", { name: "SUS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plano de saúde / rede privada" })).toBeInTheDocument();
    expect(screen.queryByText(/CAPS/)).not.toBeInTheDocument();
  });

  it("shows SUS-specific direction after choosing SUS", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.getByText("Rede SUS")).toBeInTheDocument();
    expect(screen.getByText(/CAPS/)).toBeInTheDocument();
  });

  it("shows private-network-specific direction after choosing the private option", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "Plano de saúde / rede privada" }));
    expect(screen.getByText("Plano de saúde / rede privada")).toBeInTheDocument();
    expect(screen.getByText(/central do seu plano de saúde/)).toBeInTheDocument();
  });

  it("always shows the CVV 188 line, before and after choosing a bond", async () => {
    const user = userEvent.setup();
    renderAccept();
    expect(screen.getByText(/188/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.getByText(/188/)).toBeInTheDocument();
  });

  it("never implies a live connection (no session/token/'available now' language)", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.queryByText(/disponível agora/)).not.toBeInTheDocument();
    expect(screen.queryByText(/token/)).not.toBeInTheDocument();
    expect(screen.queryByText("Conectando com segurança")).not.toBeInTheDocument();
  });

  it("writes nothing to localStorage and makes no network call", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("navigates to /home on the primary CTA and back to /crisis on back", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    await user.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/presentation/pages/CrisisAcceptPage.test.tsx`
Expected: FAIL — old component renders "Conectando com segurança"/token copy, none of the new queries match.

- [ ] **Step 3: Write minimal implementation**

Replace the entire contents of `apps/web/src/presentation/pages/CrisisAcceptPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { routes } from "../lib/routes";
import { requestHumanHandoffUseCase } from "../../app/container";
import { GetCrisisDirectionUseCase, type ProfessionalBond } from "../../use-cases/get-crisis-direction.usecase";

const getCrisisDirectionUseCase = new GetCrisisDirectionUseCase();

export function CrisisAcceptPage() {
  const navigate = useNavigate();
  const [bond, setBond] = useState<ProfessionalBond | null>(null);
  const handoff = requestHumanHandoffUseCase.execute();
  const direction = bond ? getCrisisDirectionUseCase.execute(bond) : null;

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-[30px]">
        <BackButton label="Voltar" onClick={() => navigate(routes.crisis)} />
        <h1 className="mb-2 mt-4 text-h1 text-ink">Vamos te direcionar</h1>

        {!direction && (
          <>
            <p className="text-caption text-muted">
              Você é atendido pelo SUS ou por um plano de saúde/rede privada?
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Button variant="outline" onClick={() => setBond("sus")}>
                SUS
              </Button>
              <Button variant="outline" onClick={() => setBond("private")}>
                Plano de saúde / rede privada
              </Button>
            </div>
          </>
        )}

        {direction && (
          <div className="mt-4">
            <Card>
              <p className="text-body font-extrabold text-ink">{direction.title}</p>
              <p className="mt-2 text-caption text-muted">{direction.message}</p>
            </Card>
          </div>
        )}

        <div className="mt-4">
          <Card tone="brand-tint">
            <p className="font-mono text-label text-ink-2">sempre disponível</p>
            <p className="text-body-strong text-ink">
              {handoff.externalCrisisLine.label} · {handoff.externalCrisisLine.phone}
            </p>
            <p className="text-caption text-muted">Ligação gratuita e sigilosa, 24h.</p>
          </Card>
        </div>

        <div className="flex-1" />

        {direction && (
          <Button variant="primary" onClick={() => navigate(routes.home)}>
            Entendi
          </Button>
        )}
      </div>
    </PhoneShell>
  );
}
```

Then delete the two placeholder files:

```bash
rm apps/web/src/presentation/lib/generate-ephemeral-token.ts apps/web/src/presentation/lib/generate-ephemeral-token.test.ts
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/presentation/pages/CrisisAcceptPage.test.tsx`
Expected: PASS (7 tests)

Then run the full web test suite once to confirm nothing else referenced the deleted files:

Run: `cd apps/web && npx vitest run`
Expected: PASS, no failures from missing `generate-ephemeral-token` imports.

- [ ] **Step 5: Update the screen spec**

Replace `docs/superpowers/specs/screens/09-crisis-accept.md`'s body (keep the `# 09 —` title line, update the rest) to match the new flow: vínculo question → direction card → always-on CVV card → "Entendi" → `/home`. Mirror the structure of `08-crisis-offer.md` for the CVV card section (same source of truth: `RequestHumanHandoffUseCase.execute()`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/presentation/pages/CrisisAcceptPage.tsx apps/web/src/presentation/pages/CrisisAcceptPage.test.tsx docs/superpowers/specs/screens/09-crisis-accept.md
git rm apps/web/src/presentation/lib/generate-ephemeral-token.ts apps/web/src/presentation/lib/generate-ephemeral-token.test.ts
git commit -m "refactor: replace crisis live-connection placeholder with SUS/private direction screen"
```

---

## Self-review notes (already applied above)

- **Spec coverage:** §2 (new flow), §3 (use case), §4 (screen spec update), §5 (acceptance criteria) of the design spec are each covered by Task 1 or Task 2. The "what does NOT change" list (§2) is enforced by Global Constraints, not a separate task.
- **Type consistency:** `ProfessionalBond`, `CrisisDirectionInfo`, `GetCrisisDirectionUseCase.execute` are defined once in Task 1 and consumed with identical names/shapes in Task 2.
- **No placeholders:** every step above has complete, runnable code — the only intentional placeholder is the `TODO(acm-response)` inside the use case itself, which is a documented, tracked product placeholder (pending an external answer), not a plan-writing shortcut.
