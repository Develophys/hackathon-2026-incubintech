# Encryption Info Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Consent screen's "Criptografia AES-256..." note tappable, opening a
non-technical modal that explains what AES-256 is and how it protects the user's anonymity,
with a link to further reading.

**Architecture:** A new, purpose-built `EncryptionInfoModal` component
(`apps/web/src/presentation/components/EncryptionInfoModal.tsx`) — the first Modal/Dialog-shaped
component in this codebase, scoped to this one case (not a generic reusable primitive).
`ConsentPage.tsx`'s encryption note becomes a `<button>` trigger with local `useState`, opening
the modal.

**Tech Stack:** React 19, Tailwind (existing design tokens only, no new ones), `lucide-react`
icons, Vitest + React Testing Library + `@testing-library/user-event`.

## Global Constraints

- No new Tailwind design tokens — reuse existing ones (`rounded-card-lg`, `shadow-card-lg`,
  `bg-surface`, `bg-ink/50`, `text-h2`, `text-label`, `text-ink`, `text-ink-2`, `text-muted`,
  `text-brand`), matching `apps/web/src/presentation/ui/Card.tsx`'s `size="lg"` visual style.
- Modal copy (PT-BR) is exact, from the design spec §4 — no paraphrasing:
  - Title: `Criptografia AES-256`
  - Body paragraph 1: `AES-256 é um método de criptografia usado por bancos, governos e aplicativos de mensagens para proteger informações sensíveis.`
  - Body paragraph 2: `Antes de qualquer resposta sair do seu aparelho, ela é transformada em um código que só pode ser lido com uma chave que existe apenas no seu dispositivo — nem o Zelo consegue abrir esse código.`
  - Body paragraph 3: `Isso significa que suas respostas ficam protegidas, e sua identidade permanece anônima.`
  - Link text: `Para mais informações, acesse a documentação →`
  - Link href: `https://pt.wikipedia.org/wiki/Advanced_Encryption_Standard`
- Link opens in a new tab: `target="_blank" rel="noopener noreferrer"`, with visually-hidden
  `" (abre em nova aba)"` text for screen readers.
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title. Closes on
  close-button click, backdrop click, and `Escape` keydown. Focus moves to the close button on
  open.
- Does not touch `apps/web/src/infrastructure/crypto/web-crypto-encryption.adapter.ts` or any
  encryption behavior — copy/UI only.
- Does not build a generic reusable `Modal` primitive — this component is specific to this one
  use case (see design spec §2).

---

### Task 1: `EncryptionInfoModal` component

**Files:**
- Create: `apps/web/src/presentation/components/EncryptionInfoModal.tsx`
- Test: `apps/web/src/presentation/components/EncryptionInfoModal.test.tsx`

**Interfaces:**
- Produces: `EncryptionInfoModal` — a React component with props
  `{ isOpen: boolean; onClose: () => void }`. Renders `null` when `isOpen` is `false`. When
  `isOpen` is `true`, renders a full-screen backdrop (`data-testid="modal-backdrop"`) and a
  dialog box (`role="dialog"`, accessible name "Criptografia AES-256" via `aria-labelledby`)
  containing the title, three body paragraphs, a close button (accessible name "Fechar"), and a
  documentation link (accessible name starting with "Para mais informações"). Task 2 imports and
  renders this component from `ConsentPage.tsx`.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/presentation/components/EncryptionInfoModal.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EncryptionInfoModal } from "./EncryptionInfoModal";

describe("EncryptionInfoModal", () => {
  it("renders nothing when closed", () => {
    render(<EncryptionInfoModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title, body, and documentation link when open", () => {
    render(<EncryptionInfoModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Criptografia AES-256" })).toBeInTheDocument();
    expect(
      screen.getByText(/AES-256 é um método de criptografia usado por bancos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nem o\s*Zelo consegue abrir esse código/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/suas respostas ficam protegidas, e sua identidade permanece\s*anônima/),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Para mais informações/ });
    expect(link).toHaveAttribute(
      "href",
      "https://pt.wikipedia.org/wiki/Advanced_Encryption_Standard",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<EncryptionInfoModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<EncryptionInfoModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the dialog", async () => {
    const onClose = vi.fn();
    render(<EncryptionInfoModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<EncryptionInfoModal isOpen onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("moves focus to the close button when opened", () => {
    render(<EncryptionInfoModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/components/EncryptionInfoModal.test.tsx`
Expected: FAIL — `Cannot find module './EncryptionInfoModal'`.

- [ ] **Step 3: Implement `EncryptionInfoModal`**

Create `apps/web/src/presentation/components/EncryptionInfoModal.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface EncryptionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_LINK = "https://pt.wikipedia.org/wiki/Advanced_Encryption_Standard";

export function EncryptionInfoModal({ isOpen, onClose }: EncryptionInfoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="encryption-info-title"
        className="relative max-w-[340px] rounded-card-lg bg-surface p-[22px] shadow-card-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 text-muted"
        >
          <X size={20} />
        </button>
        <h2 id="encryption-info-title" className="pr-6 text-h2 text-ink">
          Criptografia AES-256
        </h2>
        <p className="mt-3 text-label text-ink-2">
          AES-256 é um método de criptografia usado por bancos, governos e aplicativos de
          mensagens para proteger informações sensíveis.
        </p>
        <p className="mt-3 text-label text-ink-2">
          Antes de qualquer resposta sair do seu aparelho, ela é transformada em um código que
          só pode ser lido com uma chave que existe apenas no seu dispositivo — nem o Zelo
          consegue abrir esse código.
        </p>
        <p className="mt-3 text-label text-ink-2">
          Isso significa que suas respostas ficam protegidas, e sua identidade permanece
          anônima.
        </p>
        <a
          href={DOC_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-label font-bold text-brand"
        >
          Para mais informações, acesse a documentação →
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/components/EncryptionInfoModal.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/components/EncryptionInfoModal.tsx apps/web/src/presentation/components/EncryptionInfoModal.test.tsx
git commit -m "feat(web): add EncryptionInfoModal component"
```

---

### Task 2: Wire the modal into `ConsentPage` and update docs

**Files:**
- Modify: `apps/web/src/presentation/pages/ConsentPage.tsx`
- Modify: `apps/web/src/presentation/pages/ConsentPage.test.tsx`
- Modify: `docs/superpowers/specs/screens/03-consent.md`

**Interfaces:**
- Consumes: `EncryptionInfoModal` (Task 1) — `{ isOpen: boolean; onClose: () => void }`.

- [ ] **Step 1: Write the failing test**

Add this test to the `describe("ConsentPage", ...)` block in
`apps/web/src/presentation/pages/ConsentPage.test.tsx` (after the existing three tests, before
the closing `});`):

```tsx
  it("opens the encryption info modal when the encryption note is tapped", async () => {
    renderConsent();

    await userEvent.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    expect(screen.getByRole("dialog", { name: "Criptografia AES-256" })).toBeInTheDocument();
  });

  it("closes the encryption info modal from the close button", async () => {
    renderConsent();
    await userEvent.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ConsentPage.test.tsx`
Expected: FAIL on the 2 new tests (no element with accessible name "Saiba mais sobre a
criptografia AES-256" exists yet — the encryption note is still a plain `<div>`). The 3
pre-existing tests still pass.

- [ ] **Step 3: Turn the encryption note into a modal trigger**

Replace the full contents of `apps/web/src/presentation/pages/ConsentPage.tsx`:

```tsx
import { useState, type ReactNode } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";
import { EncryptionInfoModal } from "../components/EncryptionInfoModal";

const ROWS: ReactNode[] = [
  <>Entendo que o Zelo <strong>não emite diagnóstico</strong> e não substitui atendimento profissional.</>,
  <>Autorizo o uso <strong>anônimo e agregado</strong> dos meus sinais para melhorar o cuidado da equipe.</>,
  <>Minha identidade só é revelada se <strong>eu escolher</strong> falar com uma pessoa.</>,
];

export function ConsentPage() {
  const navigate = useNavigate();
  const grant = useConsentStore((state) => state.grant);
  const [isEncryptionInfoOpen, setIsEncryptionInfoOpen] = useState(false);

  const handleAccept = () => {
    grant();
    navigate(routes.home, { replace: true });
  };

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <BackButton label="Voltar" onClick={() => navigate(routes.privacy)} />
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
        <button
          type="button"
          onClick={() => setIsEncryptionInfoOpen(true)}
          aria-label="Saiba mais sobre a criptografia AES-256"
          className="mt-[14px] flex w-full items-center gap-2 rounded-2xl bg-surface-brand p-[13px] font-mono text-[12.5px] leading-relaxed text-brand"
        >
          <Lock size={16} />
          <span className="flex-1 text-left">
            Criptografia AES-256 no seu aparelho antes de qualquer envio.
          </span>
          <ChevronRight size={16} />
        </button>
        <div className="mt-[24px]">
          <Button variant="primary" onClick={handleAccept}>
            Aceitar e entrar
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

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ConsentPage.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full frontend test suite**

Run: `pnpm --filter @zelo/web test`
Expected: all tests pass, including the existing `a11y.test.tsx` axe pass over `ConsentPage`
(unaffected — the modal starts closed, so it contributes no extra DOM for axe to scan).

- [ ] **Step 6: Update the screen doc**

In `docs/superpowers/specs/screens/03-consent.md`, replace this line in the "## Data / logic"
section:

```
- On CTA: `useConsentStore().grant()` then `navigate(routes.home, { replace: true })`.
```

with:

```
- On CTA: `useConsentStore().grant()` then `navigate(routes.home, { replace: true })`.
- The encryption note is a tappable button (accessible name "Saiba mais sobre a criptografia
  AES-256") that opens `EncryptionInfoModal` — a non-technical explanation of what AES-256 is
  and how it protects the user's anonymity, with a link to further reading
  (`https://pt.wikipedia.org/wiki/Advanced_Encryption_Standard`). See
  `2026-07-12-encryption-info-modal-design.md` for the full design and exact copy.
```

Then replace this line in the "## Interactions" section:

```
- Back → Privacy.
```

with:

```
- Back → Privacy.
- Tapping the encryption note → opens `EncryptionInfoModal`; closes via its close button,
  backdrop click, or Escape.
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/presentation/pages/ConsentPage.tsx apps/web/src/presentation/pages/ConsentPage.test.tsx docs/superpowers/specs/screens/03-consent.md
git commit -m "feat(web): make the Consent screen's encryption note open an explanatory modal"
```
