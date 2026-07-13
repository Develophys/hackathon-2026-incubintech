# Trust Footer Modal Reuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "processado no seu aparelho" trust footer tappable on `AssessmentSelectPage`
and `AssessmentResultPage`, opening the existing `EncryptionInfoModal` — the same modal already
wired up on `ConsentPage` — with no new copy or component.

**Architecture:** Both pages get the exact `<div>` → `<button>` + local `useState` + modal-render
transformation already shipped on `ConsentPage.tsx` (commit `2822d46`). No new component is
created; `EncryptionInfoModal` (`apps/web/src/presentation/components/EncryptionInfoModal.tsx`)
is imported unchanged into both pages.

**Tech Stack:** React 19, Tailwind (existing tokens only), `lucide-react` icons, Vitest + React
Testing Library + `@testing-library/user-event`.

## Global Constraints

- Do not modify `EncryptionInfoModal.tsx` or its test file — component and copy are reused
  as-is.
- Both trigger buttons use the same accessible name as Consent's:
  `aria-label="Saiba mais sobre a criptografia AES-256"`.
- No chevron affordance is added on either page (unlike Consent's full-width bar) — only a
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand` ring is added to
  each trigger, matching this codebase's existing interactive-element focus treatment (see
  `AssessmentSelectPage.tsx`'s scale-selection buttons).
- Visible text and layout of both footers stay exactly as they are today — only the wrapping
  element changes from `<div>` to `<button>`.
- Do not touch `PrivacyBadge`, `SectionLabel`, or any screen other than `AssessmentSelectPage`
  and `AssessmentResultPage`.

---

### Task 1: Wire the modal into `AssessmentSelectPage`

**Files:**
- Modify: `apps/web/src/presentation/pages/AssessmentSelectPage.tsx`
- Modify: `apps/web/src/presentation/pages/AssessmentSelectPage.test.tsx`
- Modify: `docs/superpowers/specs/screens/05-assessment-select.md`

**Interfaces:**
- Consumes: `EncryptionInfoModal` (existing) — `{ isOpen: boolean; onClose: () => void }` from
  `apps/web/src/presentation/components/EncryptionInfoModal.tsx`.

- [ ] **Step 1: Write the failing tests**

Add these two tests to the `describe("AssessmentSelectPage", ...)` block in
`apps/web/src/presentation/pages/AssessmentSelectPage.test.tsx`, after the existing
`"shows the on-device trust line"` test, before the closing `});`:

```tsx
  it("opens the encryption info modal when the trust footer is tapped", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    expect(screen.getByRole("dialog", { name: "Criptografia AES-256" })).toBeInTheDocument();
  });

  it("closes the encryption info modal from the close button", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/AssessmentSelectPage.test.tsx`
Expected: FAIL on the 2 new tests (no element with accessible name "Saiba mais sobre a
criptografia AES-256" exists yet — the trust footer is still a plain `<div>`). The 4 pre-existing
tests still pass.

- [ ] **Step 3: Turn the trust footer into a modal trigger**

Replace the full contents of `apps/web/src/presentation/pages/AssessmentSelectPage.tsx`:

```tsx
import { useState } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { routes } from "../lib/routes";
import { EncryptionInfoModal } from "../components/EncryptionInfoModal";

export function AssessmentSelectPage() {
  const navigate = useNavigate();
  const [isEncryptionInfoOpen, setIsEncryptionInfoOpen] = useState(false);

  return (
    <PhoneShell>
      <div className="pt-[26px]">
        <div className="flex items-center justify-between">
          <BackButton label="Início" onClick={() => navigate(routes.home)} />
          <PrivacyBadge />
        </div>
        <h1 className="mt-4 text-h1 text-ink">Autoavaliação</h1>
        <p className="mt-1 text-caption text-muted">
          Escolha uma escala validada. Leva cerca de 5 minutos.
        </p>

        <div className="mt-5 flex flex-col gap-[12px]">
          <button
            type="button"
            onClick={() => navigate(routes.phq9)}
            className="flex items-center justify-between rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div>
              <p className="text-body font-extrabold text-ink">PHQ-9</p>
              <p className="text-caption text-muted">Humor e sinais de depressão</p>
            </div>
            <span className="text-brand">→</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(routes.gad7)}
            className="flex items-center justify-between rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div>
              <p className="text-body font-extrabold text-ink">GAD-7</p>
              <p className="text-caption text-muted">Ansiedade</p>
            </div>
            <span className="text-brand">→</span>
          </button>

          <div className="flex items-center justify-between rounded-card bg-canvas-alt p-[18px] opacity-70">
            <div>
              <p className="text-body font-extrabold text-muted">MBI-HSS</p>
              <p className="text-caption text-muted">Burnout ocupacional</p>
            </div>
            <span className="rounded-pill bg-line px-3 py-1 font-mono text-[11px] text-muted-2">em breve</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEncryptionInfoOpen(true)}
          aria-label="Saiba mais sobre a criptografia AES-256"
          className="mt-6 flex w-full items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Lock size={12} className="text-muted-2" />
          <span className="font-mono text-eyebrow uppercase text-muted-2">tudo processado no seu aparelho</span>
        </button>
      </div>
      <EncryptionInfoModal
        isOpen={isEncryptionInfoOpen}
        onClose={() => setIsEncryptionInfoOpen(false)}
      />
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/AssessmentSelectPage.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Update the screen doc**

In `docs/superpowers/specs/screens/05-assessment-select.md`, replace this line in the
"## Data / logic" section:

```
- No data fetch here; scale metadata is static (`domain/assessment-scales`).
```

with:

```
- No data fetch here; scale metadata is static (`domain/assessment-scales`).
- The trust footer ("tudo processado no seu aparelho") is a tappable button (accessible name
  "Saiba mais sobre a criptografia AES-256") that opens `EncryptionInfoModal` — the same
  non-technical AES-256/on-device explanation shown from the Consent screen. See
  `2026-07-12-trust-footer-modal-reuse-design.md` for the reuse rationale.
```

Then replace this line in the "## Interactions" section:

```
- PHQ-9 → `/assessment/phq9`; GAD-7 → `/assessment/gad7`; MBI-HSS → inert.
```

with:

```
- PHQ-9 → `/assessment/phq9`; GAD-7 → `/assessment/gad7`; MBI-HSS → inert.
- Tapping the trust footer → opens `EncryptionInfoModal`; closes via its close button, backdrop
  click, or Escape.
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/presentation/pages/AssessmentSelectPage.tsx apps/web/src/presentation/pages/AssessmentSelectPage.test.tsx docs/superpowers/specs/screens/05-assessment-select.md
git commit -m "feat(web): make AssessmentSelectPage's trust footer open the encryption info modal"
```

---

### Task 2: Wire the modal into `AssessmentResultPage`

**Files:**
- Modify: `apps/web/src/presentation/pages/AssessmentResultPage.tsx`
- Modify: `apps/web/src/presentation/pages/AssessmentResultPage.test.tsx`
- Modify: `docs/superpowers/specs/screens/07-result.md`

**Interfaces:**
- Consumes: `EncryptionInfoModal` (existing) — `{ isOpen: boolean; onClose: () => void }` from
  `apps/web/src/presentation/components/EncryptionInfoModal.tsx`.

- [ ] **Step 1: Write the failing tests**

Add these two tests to the `describe("AssessmentResultPage", ...)` block in
`apps/web/src/presentation/pages/AssessmentResultPage.test.tsx`, after the existing
`"redirects to /assessment when there is no navigation state..."` test, before the closing
`});`. This file has no `userEvent` import yet — add it alongside the existing imports:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { AssessmentResultPage } from "./AssessmentResultPage";
```

```tsx
  it("opens the encryption info modal when the on-device stamp is tapped", async () => {
    const user = userEvent.setup();
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });

    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    expect(screen.getByRole("dialog", { name: "Criptografia AES-256" })).toBeInTheDocument();
  });

  it("closes the encryption info modal from the close button", async () => {
    const user = userEvent.setup();
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });
    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/AssessmentResultPage.test.tsx`
Expected: FAIL on the 2 new tests (no element with accessible name "Saiba mais sobre a
criptografia AES-256" exists yet — the on-device stamp is still a plain `<div>`). The 4
pre-existing tests still pass.

- [ ] **Step 3: Turn the on-device stamp into a modal trigger**

Replace the full contents of `apps/web/src/presentation/pages/AssessmentResultPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { ResultBandCard } from "../components/ResultBandCard";
import { RiskSignalCallout } from "../components/RiskSignalCallout";
import { EncryptionInfoModal } from "../components/EncryptionInfoModal";
import { bandFor } from "../lib/band-for";
import { routes } from "../lib/routes";

interface ResultLocationState {
  scaleType: "PHQ-9" | "GAD-7";
  totalScore: number;
  max: number;
  riskSignal: boolean;
}

function isResultState(value: unknown): value is ResultLocationState {
  return (
    !!value &&
    typeof value === "object" &&
    "scaleType" in value &&
    "totalScore" in value &&
    "max" in value &&
    "riskSignal" in value
  );
}

export function AssessmentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = isResultState(location.state) ? location.state : null;
  const [isEncryptionInfoOpen, setIsEncryptionInfoOpen] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate(routes.assessment, { replace: true });
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const { scaleType, totalScore, max, riskSignal } = state;
  const band = bandFor(scaleType, totalScore);

  return (
    <PhoneShell>
      <div className="pt-7">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsEncryptionInfoOpen(true)}
            aria-label="Saiba mais sobre a criptografia AES-256"
            className="flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Lock size={12} className="text-muted-2" />
            <span className="font-mono text-eyebrow uppercase text-muted-2">processado no seu aparelho</span>
          </button>
          <PrivacyBadge />
        </div>

        <div className="mt-4">
          <ResultBandCard scaleType={scaleType} score={totalScore} max={max} band={band} />
        </div>

        <p className="my-[18px] text-body text-muted">
          Isto é um sinal, não um diagnóstico. Ele ajuda a decidir o próximo passo — no seu tempo.
        </p>

        {riskSignal && (
          <div className="mb-[18px]">
            <RiskSignalCallout onConnect={() => navigate(routes.crisis)} />
          </div>
        )}

        <Button variant="primary" onClick={() => navigate(routes.chat)}>
          Conversar com o acolhimento
        </Button>
        <div className="mt-3">
          <Button variant="ghost" onClick={() => navigate(routes.home)}>
            Voltar ao início
          </Button>
        </div>
      </div>
      <EncryptionInfoModal
        isOpen={isEncryptionInfoOpen}
        onClose={() => setIsEncryptionInfoOpen(false)}
      />
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/AssessmentResultPage.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Update the screen doc**

In `docs/superpowers/specs/screens/07-result.md`, replace this line in the "## Data / logic"
section:

```
- **Do not recompute** the score or refetch. `riskSignal` is display-only.
```

with:

```
- **Do not recompute** the score or refetch. `riskSignal` is display-only.
- The on-device stamp ("processado no seu aparelho") is a tappable button (accessible name
  "Saiba mais sobre a criptografia AES-256") that opens `EncryptionInfoModal` — the same
  non-technical AES-256/on-device explanation shown from the Consent screen. See
  `2026-07-12-trust-footer-modal-reuse-design.md` for the reuse rationale.
```

Then replace this line in the "## Interactions" section:

```
- Primary → `/chat`. Ghost → `/home`.
```

with:

```
- Primary → `/chat`. Ghost → `/home`.
- Tapping the on-device stamp → opens `EncryptionInfoModal`; closes via its close button,
  backdrop click, or Escape.
```

- [ ] **Step 6: Run the full frontend test suite**

Run: `pnpm --filter @zelo/web test`
Expected: all tests pass, including the existing `a11y.test.tsx` axe pass over both pages
(unaffected — the modal starts closed on both, so it contributes no extra DOM for axe to scan).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/presentation/pages/AssessmentResultPage.tsx apps/web/src/presentation/pages/AssessmentResultPage.test.tsx docs/superpowers/specs/screens/07-result.md
git commit -m "feat(web): make AssessmentResultPage's on-device stamp open the encryption info modal"
```
