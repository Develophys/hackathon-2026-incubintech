# David Feedback Chat Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two small chat-prompt/UI improvements before the 25/07 hackathon final (question-count cap, anxiety-rating CTA), and produce fully-planned, buildable-later work for a breathing-exercise feature and local encrypted chat history.

**Architecture:** Phase 1 touches only the existing chat system prompt and `ChatPage.tsx`, reusing the already-built GAD-7/PHQ-9 assessment flow — no new persistence, no new routes. Phases 2 and 3 each add one self-contained vertical slice (a new page + hook for breathing; a new port/adapter/use-case pair for chat persistence), following the exact layering and IndexedDB-plus-WebCrypto pattern the assessment feature already established, so a reviewer can recognize every piece by its existing sibling.

**Tech Stack:** React + react-router (web), NestJS (api), Vitest + Testing Library + `fake-indexeddb`, TypeScript, Zod (domain schemas in `@zelo/domain`), Tailwind classes matching existing components, `lucide-react` icons.

## Global Constraints

- No new backend/API endpoints anywhere in this plan — everything is a frontend or prompt-only change (per spec §A–D).
- Chat replies are plain text streams only; nothing in this plan may assume tool-calling or structured AI output (per spec §0).
- Any new local storage must be encrypted client-side before being written to IndexedDB, using the existing `EncryptionPort`/`WebCryptoEncryptionAdapter` — never store chat plaintext at rest (per spec §D).
- Follow existing Clean-Architecture-style layering exactly: `domain/` types, `ports/` interfaces, `use-cases/` orchestration, `infrastructure/` adapters, `presentation/` hooks and pages, wired together only in `app/container.ts` (never inside a component or hook via `new`).
- All new UI copy is in Portuguese, in the same colloquial register as the rest of the app.

---

## Phase 1 — Ship before 25/07

### Task 1: Cap the AI to one question per reply

**Files:**
- Modify: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts`
- Test: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CHAT_SYSTEM_PROMPT` (existing export) now also contains the substring `"no máximo uma pergunta por resposta"` — later tasks don't depend on this, but Task 2 edits the same file/region.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { CHAT_SYSTEM_PROMPT } from "./chat-system-prompt";

describe("CHAT_SYSTEM_PROMPT", () => {
  it("caps the assistant to one question per reply", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/no máximo uma pergunta por resposta/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: FAIL — received string does not match `/no máximo uma pergunta por resposta/i`

- [ ] **Step 3: Add the rule to the prompt**

In `chat-system-prompt.ts`, inside the `Regras de tom` block, immediately after the existing line that starts `"Nem toda resposta precisa seguir a fórmula..."` (around line 40), add:

```
- Faça no máximo uma pergunta por resposta. Muitas respostas podem não ter pergunta nenhuma — uma reação ou observação curta já é suficiente; nem toda resposta precisa terminar em pergunta.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: PASS

- [ ] **Step 5: Manual verification (prompt behavior can't be unit-tested beyond string presence)**

Start the API locally (`pnpm --filter @zelo/api dev`) and the web app, open `/chat`, and send 2-3 messages describing stress/overwhelm. Confirm the assistant's replies never contain more than one `?`-terminated question, and that at least one reply has no question at all.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts
git commit -m "feat(chat): cap AI replies to at most one question per turn"
```

---

### Task 2: Let the AI suggest a quick anxiety check-in

**Files:**
- Modify: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts`
- Modify: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CHAT_SYSTEM_PROMPT` also contains the substring `"avaliação rápida"` — Task 3's CTA button is the actual clickable action this pairs with; the two are independent (button is always visible regardless of what the AI says, per spec §B).

- [ ] **Step 1: Write the failing test**

```ts
  it("permits the assistant to suggest a quick check-in when it detects distress", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/avaliação rápida/i);
  });
```

Add this as a second `it` block inside the existing `describe("CHAT_SYSTEM_PROMPT", ...)` from Task 1.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: FAIL on the new test — no match for `/avaliação rápida/i`

- [ ] **Step 3: Add the rule to the prompt**

Directly below the line added in Task 1, add:

```
- Quando perceber sinais de ansiedade ou sobrecarga na fala da pessoa, você pode mencionar a ideia de fazer uma avaliação rápida do que ela está sentindo — não é obrigatório, não repita isso a cada mensagem, e não conduza a conversa inteira em torno disso.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: PASS (both tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts
git commit -m "feat(chat): permit AI to suggest a quick anxiety check-in on distress signals"
```

---

### Task 3: Add the "Avaliar como estou" CTA to ChatPage

**Files:**
- Modify: `apps/web/src/presentation/pages/ChatPage.tsx`
- Modify: `apps/web/src/presentation/pages/ChatPage.test.tsx`

**Interfaces:**
- Consumes: `routes.assessment` (existing export from `apps/web/src/presentation/lib/routes.ts`, already `"/assessment"`, already routed to `AssessmentSelectPage` in `router.tsx`) — no new route needed.
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Add to `apps/web/src/presentation/pages/ChatPage.test.tsx`, inside the existing `describe("ChatPage", ...)` block:

```ts
  it("shows an assessment CTA that navigates to /assessment", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/assessment" element={<div>Assessment select screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /avaliar como estou/i }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });
```

Note: this test renders its own `<MemoryRouter>` (rather than using the file's `renderChat()` helper) because `renderChat()`'s route table doesn't include `/assessment`. Do not add `/assessment` to `renderChat()`'s table — that would make the earlier "always shows..." test's assertions ambiguous about which button they're checking.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: FAIL — `Unable to find role="button" with name /avaliar como estou/i`

- [ ] **Step 3: Add the button**

In `ChatPage.tsx`, import `ClipboardList` (or similar) from `lucide-react` alongside the existing `HeartHandshake` import, and add a second button directly below the existing "Falar com uma pessoa real" button (after line 69's closing `</button>`, before the comment on line 71):

```tsx
        <button
          type="button"
          onClick={() => navigate(routes.assessment)}
          className="mx-4 mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-surface-brand p-[13px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ClipboardList size={18} />
          Avaliar como estou
        </button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/ChatPage.tsx apps/web/src/presentation/pages/ChatPage.test.tsx
git commit -m "feat(chat): add persistent CTA routing to the existing GAD-7/PHQ-9 assessment flow"
```

**Phase 1 is now complete and demo-ready.** Tasks 4–10 below are post-hackathon scope (spec §C/§D) — plan them now, build them later.

---

## Phase 2 — Breathing exercise (post-hackathon, spec §C)

### Task 4: `useBreathingCycle` hook (box-breathing timer logic)

**Files:**
- Create: `apps/web/src/presentation/hooks/useBreathingCycle.ts`
- Test: `apps/web/src/presentation/hooks/useBreathingCycle.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `useBreathingCycle()` returning `{ phase: BreathingPhase; label: string; secondsLeft: number; cycleCount: number; isRunning: boolean; start(): void; stop(): void }`, and the exported type `BreathingPhase = "inspire" | "segure1" | "expire" | "segure2"`. Task 5's page imports both.

- [ ] **Step 1: Write the failing test**

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBreathingCycle } from "./useBreathingCycle";

describe("useBreathingCycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on the inspire phase with 4 seconds left, not running", () => {
    const { result } = renderHook(() => useBreathingCycle());
    expect(result.current.phase).toBe("inspire");
    expect(result.current.secondsLeft).toBe(4);
    expect(result.current.isRunning).toBe(false);
  });

  it("advances through all four phases one second at a time after start()", () => {
    const { result } = renderHook(() => useBreathingCycle());

    act(() => result.current.start());
    expect(result.current.phase).toBe("inspire");

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.phase).toBe("segure1");

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.phase).toBe("expire");

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.phase).toBe("segure2");
  });

  it("increments cycleCount once a full 4-phase cycle completes", () => {
    const { result } = renderHook(() => useBreathingCycle());
    act(() => result.current.start());

    act(() => vi.advanceTimersByTime(4000 * 4));
    expect(result.current.cycleCount).toBe(1);
    expect(result.current.phase).toBe("inspire");
  });

  it("stops advancing once stop() is called", () => {
    const { result } = renderHook(() => useBreathingCycle());
    act(() => result.current.start());
    act(() => result.current.stop());

    const phaseAtStop = result.current.phase;
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.phase).toBe(phaseAtStop);
    expect(result.current.isRunning).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/presentation/hooks/useBreathingCycle.test.ts`
Expected: FAIL — `Cannot find module './useBreathingCycle'`

- [ ] **Step 3: Implement the hook**

```ts
import { useEffect, useState } from "react";

export type BreathingPhase = "inspire" | "segure1" | "expire" | "segure2";

const PHASE_ORDER: BreathingPhase[] = ["inspire", "segure1", "expire", "segure2"];
const PHASE_LABELS: Record<BreathingPhase, string> = {
  inspire: "Inspire",
  segure1: "Segure",
  expire: "Expire",
  segure2: "Segure",
};
const PHASE_SECONDS = 4;

export function useBreathingCycle() {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASE_SECONDS);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds > 1) return prevSeconds - 1;

        setPhaseIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % PHASE_ORDER.length;
          if (nextIndex === 0) setCycleCount((prevCount) => prevCount + 1);
          return nextIndex;
        });

        return PHASE_SECONDS;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const phase = PHASE_ORDER[phaseIndex];

  return {
    phase,
    label: PHASE_LABELS[phase],
    secondsLeft,
    cycleCount,
    isRunning,
    start: () => setIsRunning(true),
    stop: () => setIsRunning(false),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/presentation/hooks/useBreathingCycle.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/hooks/useBreathingCycle.ts apps/web/src/presentation/hooks/useBreathingCycle.test.ts
git commit -m "feat(breathing): add useBreathingCycle box-breathing timer hook"
```

---

### Task 5: `BreathingExercisePage` + route + a11y coverage

**Files:**
- Create: `apps/web/src/presentation/pages/BreathingExercisePage.tsx`
- Create: `apps/web/src/presentation/pages/BreathingExercisePage.test.tsx`
- Modify: `apps/web/src/presentation/lib/routes.ts`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/presentation/pages/a11y.test.tsx`

**Interfaces:**
- Consumes: `useBreathingCycle()` (Task 4), `BackButton` (existing `apps/web/src/presentation/ui/BackButton.tsx`), `PhoneShell` (existing).
- Produces: `routes.breathing = "/breathing"`, registered in `router.tsx` and exported as `BreathingExercisePage` — Task 6's chat CTA button navigates here.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { BreathingExercisePage } from "./BreathingExercisePage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/breathing"]}>
      <Routes>
        <Route path="/breathing" element={<BreathingExercisePage />} />
        <Route path="/chat" element={<div>Chat screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BreathingExercisePage", () => {
  it("shows a start control before running and the inspire label once started", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole("button", { name: /começar/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /começar/i }));
    expect(screen.getByText("Inspire")).toBeInTheDocument();
  });

  it("navigates back to /chat on back button click", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/BreathingExercisePage.test.tsx`
Expected: FAIL — `Cannot find module './BreathingExercisePage'`

- [ ] **Step 3: Add the route constant**

In `apps/web/src/presentation/lib/routes.ts`, add one entry (after `chat: "/chat",`):

```ts
  breathing: "/breathing",
```

- [ ] **Step 4: Implement the page**

```tsx
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { useBreathingCycle } from "../hooks/useBreathingCycle";
import { routes } from "../lib/routes";

const SCALE_BY_PHASE: Record<string, string> = {
  inspire: "scale-100",
  segure1: "scale-100",
  expire: "scale-50",
  segure2: "scale-50",
};

export function BreathingExercisePage() {
  const navigate = useNavigate();
  const { phase, label, secondsLeft, cycleCount, isRunning, start, stop } = useBreathingCycle();

  return (
    <PhoneShell bg="surface">
      <div className="flex min-h-full flex-col items-center pt-[30px]">
        <div className="flex w-full items-center gap-3">
          <BackButton onClick={() => navigate(routes.chat)} />
        </div>

        <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-6">
          <div
            className={`h-40 w-40 rounded-full bg-brand transition-transform duration-1000 ease-in-out ${SCALE_BY_PHASE[phase]}`}
          />
          <p className="text-h1 text-ink">{isRunning ? label : "Pronto para começar"}</p>
          {isRunning && <p className="text-body text-muted">{secondsLeft}s · ciclo {cycleCount}</p>}
        </div>

        <button
          type="button"
          onClick={isRunning ? stop : start}
          className="mx-4 mb-6 flex min-h-[44px] w-[calc(100%-32px)] items-center justify-center rounded-2xl bg-brand p-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {isRunning ? "Parar" : "Começar"}
        </button>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 5: Register the route**

In `apps/web/src/app/router.tsx`, add the import (alongside the other page imports):

```ts
import { BreathingExercisePage } from "../presentation/pages/BreathingExercisePage";
```

And add an entry to `routeChildren` (after the `chat` entry):

```ts
  {
    path: "breathing",
    Component: BreathingExercisePage,
  },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/BreathingExercisePage.test.tsx`
Expected: PASS (both tests)

- [ ] **Step 7: Add to the a11y screen list**

In `apps/web/src/presentation/pages/a11y.test.tsx`, add the import (alongside the other page imports) and one entry to the `SCREENS` array (after the `Chat` entry):

```ts
import { BreathingExercisePage } from "./BreathingExercisePage";
```

```ts
  { name: "BreathingExercise", Component: BreathingExercisePage, path: "/breathing" },
```

- [ ] **Step 8: Run the a11y suite to verify no violations**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/a11y.test.tsx`
Expected: PASS, including the new `"BreathingExercise has no axe violations"` case

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/presentation/pages/BreathingExercisePage.tsx apps/web/src/presentation/pages/BreathingExercisePage.test.tsx apps/web/src/presentation/lib/routes.ts apps/web/src/app/router.tsx apps/web/src/presentation/pages/a11y.test.tsx
git commit -m "feat(breathing): add BreathingExercisePage, route, and a11y coverage"
```

---

### Task 6: Wire the breathing CTA into ChatPage + prompt permission

**Files:**
- Modify: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts`
- Modify: `apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts`
- Modify: `apps/web/src/presentation/pages/ChatPage.tsx`
- Modify: `apps/web/src/presentation/pages/ChatPage.test.tsx`

**Interfaces:**
- Consumes: `routes.breathing` (Task 5).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Write the failing prompt test**

Add a third `it` to the existing `describe("CHAT_SYSTEM_PROMPT", ...)` block:

```ts
  it("permits the assistant to suggest a breathing exercise when articulation is hard", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/exercício de respiração/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: FAIL on the new test

- [ ] **Step 3: Add the prompt rule**

In `chat-system-prompt.ts`, directly below the anxiety-check-in rule added in Task 2:

```
- Se a pessoa parecer estar com dificuldade de se expressar por estar muito ansiosa ou agitada, você pode sugerir experimentar um exercício de respiração guiado antes de continuar a conversa.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/api test -- src/modules/chat/application/prompts/chat-system-prompt.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Write the failing UI test**

Add to `ChatPage.test.tsx`, inside `describe("ChatPage", ...)`:

```ts
  it("shows a breathing-exercise CTA that navigates to /breathing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/breathing" element={<div>Breathing screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /exercício de respiração/i }));
    expect(screen.getByText("Breathing screen")).toBeInTheDocument();
  });
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: FAIL — button not found

- [ ] **Step 7: Add the button**

In `ChatPage.tsx`, import `Wind` from `lucide-react` and `routes` already imported; add a third button below the "Avaliar como estou" button from Task 3:

```tsx
        <button
          type="button"
          onClick={() => navigate(routes.breathing)}
          className="mx-4 mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-surface-brand p-[13px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Wind size={18} />
          Exercício de respiração
        </button>
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: PASS (all tests)

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts apps/api/src/modules/chat/application/prompts/chat-system-prompt.test.ts apps/web/src/presentation/pages/ChatPage.tsx apps/web/src/presentation/pages/ChatPage.test.tsx
git commit -m "feat(chat): surface breathing-exercise CTA and prompt permission"
```

---

## Phase 3 — Local encrypted chat history (post-hackathon, spec §D)

### Task 7: Chat message record domain type, port, and IndexedDB adapter

**Files:**
- Create: `apps/web/src/domain/chat-message-record.ts`
- Create: `apps/web/src/ports/local-chat-store.port.ts`
- Create: `apps/web/src/infrastructure/storage/indexeddb-chat-store.adapter.ts`
- Test: `apps/web/src/infrastructure/storage/indexeddb-chat-store.adapter.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ChatMessageRecord { id: string; conversationId: string; role: "user" | "assistant"; ciphertext: string; createdAt: string }`, `LocalChatStorePort { save(record): Promise<void>; listByConversation(conversationId: string): Promise<ChatMessageRecord[]> }`, and `IndexedDbChatStoreAdapter implements LocalChatStorePort` — Task 8's use cases depend on all three.

- [ ] **Step 1: Write the failing test**

```ts
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbChatStoreAdapter } from "./indexeddb-chat-store.adapter";
import type { ChatMessageRecord } from "../../domain/chat-message-record";

const RECORD_A: ChatMessageRecord = {
  id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
  conversationId: "00000000-0000-4000-8000-000000000001",
  role: "user",
  ciphertext: "base64-ciphertext-a==",
  createdAt: "2026-07-20T12:00:00.000Z",
};

const RECORD_B: ChatMessageRecord = {
  id: "b3f1c2b0-1234-4a5b-9c6d-000000000002",
  conversationId: "00000000-0000-4000-8000-000000000002",
  role: "assistant",
  ciphertext: "base64-ciphertext-b==",
  createdAt: "2026-07-20T12:01:00.000Z",
};

describe("IndexedDbChatStoreAdapter", () => {
  it("saves records and lists only the ones matching the given conversationId", async () => {
    const adapter = new IndexedDbChatStoreAdapter();

    await adapter.save(RECORD_A);
    await adapter.save(RECORD_B);

    expect(await adapter.listByConversation(RECORD_A.conversationId)).toEqual([RECORD_A]);
    expect(await adapter.listByConversation(RECORD_B.conversationId)).toEqual([RECORD_B]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/infrastructure/storage/indexeddb-chat-store.adapter.test.ts`
Expected: FAIL — `Cannot find module './indexeddb-chat-store.adapter'`

- [ ] **Step 3: Add the domain type**

```ts
export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  ciphertext: string;
  createdAt: string;
}
```

- [ ] **Step 4: Add the port**

```ts
import type { ChatMessageRecord } from "../domain/chat-message-record";

export interface LocalChatStorePort {
  save(record: ChatMessageRecord): Promise<void>;
  listByConversation(conversationId: string): Promise<ChatMessageRecord[]>;
}
```

- [ ] **Step 5: Implement the adapter**

```ts
import type { LocalChatStorePort } from "../../ports/local-chat-store.port";
import type { ChatMessageRecord } from "../../domain/chat-message-record";

const DB_NAME = "zelo-chat-messages";
const STORE_NAME = "messages";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbChatStoreAdapter implements LocalChatStorePort {
  async save(record: ChatMessageRecord): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listByConversation(conversationId: string): Promise<ChatMessageRecord[]> {
    const db = await openDb();
    const all = await new Promise<ChatMessageRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as ChatMessageRecord[]);
      request.onerror = () => reject(request.error);
    });
    return all.filter((record) => record.conversationId === conversationId);
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/infrastructure/storage/indexeddb-chat-store.adapter.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/domain/chat-message-record.ts apps/web/src/ports/local-chat-store.port.ts apps/web/src/infrastructure/storage/indexeddb-chat-store.adapter.ts apps/web/src/infrastructure/storage/indexeddb-chat-store.adapter.test.ts
git commit -m "feat(chat-history): add ChatMessageRecord domain type, port, and IndexedDB adapter"
```

---

### Task 8: `PersistChatMessageUseCase` and `GetChatHistoryUseCase`

**Files:**
- Create: `apps/web/src/use-cases/persist-chat-message.usecase.ts`
- Create: `apps/web/src/use-cases/persist-chat-message.usecase.test.ts`
- Create: `apps/web/src/use-cases/get-chat-history.usecase.ts`
- Create: `apps/web/src/use-cases/get-chat-history.usecase.test.ts`
- Modify: `apps/web/src/presentation/hooks/useChatConversation.ts` (only to import `ChatUiMessage` from its new home — no behavior change in this task)

**Interfaces:**
- Consumes: `LocalChatStorePort`, `EncryptionPort` (existing `apps/web/src/ports/encryption.port.ts`) — injected directly, no new wrapper interfaces, matching the precedent already set by `GetAssessmentHistoryUseCase` injecting `EncryptionPort` directly rather than through an `EncryptAssessmentUseCase`-style wrapper.
- Produces: `PersistChatMessageUseCase.execute(params: { conversationId: string; role: "user" | "assistant"; content: string }): Promise<void>`, `GetChatHistoryUseCase.execute(conversationId: string): Promise<ChatUiMessage[]>`, and the relocated `ChatUiMessage` type (now exported from `get-chat-history.usecase.ts`) — Task 10's hook consumes all three.

- [ ] **Step 1: Write the failing test for persistence**

```ts
import { describe, expect, it, vi } from "vitest";
import { PersistChatMessageUseCase } from "./persist-chat-message.usecase";
import type { LocalChatStorePort } from "../ports/local-chat-store.port";
import type { EncryptionPort } from "../ports/encryption.port";

describe("PersistChatMessageUseCase", () => {
  it("encrypts the message content and saves a record with a generated id and timestamp", async () => {
    const encryption: EncryptionPort = {
      encrypt: vi.fn().mockResolvedValue("cipher-abc"),
      decrypt: vi.fn(),
    };
    const store: LocalChatStorePort = {
      save: vi.fn().mockResolvedValue(undefined),
      listByConversation: vi.fn(),
    };
    const useCase = new PersistChatMessageUseCase(store, encryption);

    await useCase.execute({ conversationId: "conv-1", role: "user", content: "estou exausta" });

    expect(encryption.encrypt).toHaveBeenCalledWith("estou exausta");
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1", role: "user", ciphertext: "cipher-abc" }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/use-cases/persist-chat-message.usecase.test.ts`
Expected: FAIL — `Cannot find module './persist-chat-message.usecase'`

- [ ] **Step 3: Implement `PersistChatMessageUseCase`**

```ts
import type { LocalChatStorePort } from "../ports/local-chat-store.port";
import type { EncryptionPort } from "../ports/encryption.port";

export interface PersistChatMessageParams {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}

export class PersistChatMessageUseCase {
  constructor(
    private readonly localStore: LocalChatStorePort,
    private readonly encryption: EncryptionPort,
  ) {}

  async execute(params: PersistChatMessageParams): Promise<void> {
    const ciphertext = await this.encryption.encrypt(params.content);
    await this.localStore.save({
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      role: params.role,
      ciphertext,
      createdAt: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/use-cases/persist-chat-message.usecase.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for history retrieval**

```ts
import { describe, expect, it, vi } from "vitest";
import { GetChatHistoryUseCase } from "./get-chat-history.usecase";
import type { LocalChatStorePort } from "../ports/local-chat-store.port";
import type { EncryptionPort } from "../ports/encryption.port";
import type { ChatMessageRecord } from "../domain/chat-message-record";

describe("GetChatHistoryUseCase", () => {
  it("returns decrypted messages sorted oldest-first", async () => {
    const records: ChatMessageRecord[] = [
      {
        id: "2",
        conversationId: "conv-1",
        role: "assistant",
        ciphertext: "cipher-2",
        createdAt: "2026-07-20T12:01:00.000Z",
      },
      {
        id: "1",
        conversationId: "conv-1",
        role: "user",
        ciphertext: "cipher-1",
        createdAt: "2026-07-20T12:00:00.000Z",
      },
    ];
    const store: LocalChatStorePort = {
      save: vi.fn(),
      listByConversation: vi.fn().mockResolvedValue(records),
    };
    const encryption: EncryptionPort = {
      encrypt: vi.fn(),
      decrypt: vi.fn(async (ciphertext: string) => (ciphertext === "cipher-1" ? "oi" : "tudo bem?")),
    };
    const useCase = new GetChatHistoryUseCase(store, encryption);

    const messages = await useCase.execute("conv-1");

    expect(messages).toEqual([
      { role: "user", content: "oi" },
      { role: "assistant", content: "tudo bem?" },
    ]);
  });

  it("skips a record that fails to decrypt instead of throwing", async () => {
    const records: ChatMessageRecord[] = [
      { id: "1", conversationId: "conv-1", role: "user", ciphertext: "broken", createdAt: "2026-07-20T12:00:00.000Z" },
    ];
    const store: LocalChatStorePort = { save: vi.fn(), listByConversation: vi.fn().mockResolvedValue(records) };
    const encryption: EncryptionPort = {
      encrypt: vi.fn(),
      decrypt: vi.fn().mockRejectedValue(new Error("bad key")),
    };
    const useCase = new GetChatHistoryUseCase(store, encryption);

    await expect(useCase.execute("conv-1")).resolves.toEqual([]);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/use-cases/get-chat-history.usecase.test.ts`
Expected: FAIL — `Cannot find module './get-chat-history.usecase'`

- [ ] **Step 7: Implement `GetChatHistoryUseCase` and relocate `ChatUiMessage`**

```ts
import type { LocalChatStorePort } from "../ports/local-chat-store.port";
import type { EncryptionPort } from "../ports/encryption.port";

export interface ChatUiMessage {
  role: "user" | "assistant";
  content: string;
}

export class GetChatHistoryUseCase {
  constructor(
    private readonly localStore: LocalChatStorePort,
    private readonly encryption: EncryptionPort,
  ) {}

  async execute(conversationId: string): Promise<ChatUiMessage[]> {
    const records = await this.localStore.listByConversation(conversationId);
    const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const messages: ChatUiMessage[] = [];
    for (const record of sorted) {
      try {
        const content = await this.encryption.decrypt(record.ciphertext);
        messages.push({ role: record.role, content });
      } catch {
        continue;
      }
    }
    return messages;
  }
}
```

- [ ] **Step 8: Update `useChatConversation.ts` to import the relocated type**

In `apps/web/src/presentation/hooks/useChatConversation.ts`, remove the local `export interface ChatUiMessage { ... }` (lines 6-9) and replace with:

```ts
import type { ChatUiMessage } from "../../use-cases/get-chat-history.usecase";
```

Re-export it from the hook file too, since `ChatPage.tsx` or other consumers may import `ChatUiMessage` from the hook module:

```ts
export type { ChatUiMessage };
```

- [ ] **Step 9: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/use-cases/get-chat-history.usecase.test.ts src/presentation/hooks`
Expected: PASS (no existing test imports `ChatUiMessage` from `useChatConversation.ts` directly today, so this is a safe, non-breaking move — confirm with a repo-wide check if unsure: `grep -rn "ChatUiMessage" apps/web/src`)

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/use-cases/persist-chat-message.usecase.ts apps/web/src/use-cases/persist-chat-message.usecase.test.ts apps/web/src/use-cases/get-chat-history.usecase.ts apps/web/src/use-cases/get-chat-history.usecase.test.ts apps/web/src/presentation/hooks/useChatConversation.ts
git commit -m "feat(chat-history): add persist/retrieve use cases, relocate ChatUiMessage type"
```

---

### Task 9: Wire the new use cases into `container.ts`

**Files:**
- Modify: `apps/web/src/app/container.ts`

**Interfaces:**
- Consumes: `IndexedDbChatStoreAdapter` (Task 7), `WebCryptoEncryptionAdapter` (existing), `PersistChatMessageUseCase`, `GetChatHistoryUseCase` (Task 8).
- Produces: `persistChatMessageUseCase`, `getChatHistoryUseCase` singletons — Task 10's hook imports both from this file, matching how it already imports `sendChatMessageUseCase`.

- [ ] **Step 1: Add the imports**

In `apps/web/src/app/container.ts`, add alongside the existing imports:

```ts
import { PersistChatMessageUseCase } from "../use-cases/persist-chat-message.usecase";
import { GetChatHistoryUseCase } from "../use-cases/get-chat-history.usecase";
import { IndexedDbChatStoreAdapter } from "../infrastructure/storage/indexeddb-chat-store.adapter";
```

- [ ] **Step 2: Add the singletons**

Add after the existing `sendChatMessageUseCase` export:

```ts
export const persistChatMessageUseCase = new PersistChatMessageUseCase(
  new IndexedDbChatStoreAdapter(),
  new WebCryptoEncryptionAdapter(),
);
export const getChatHistoryUseCase = new GetChatHistoryUseCase(
  new IndexedDbChatStoreAdapter(),
  new WebCryptoEncryptionAdapter(),
);
```

This follows the same pattern as `submitAssessmentUseCase`/`getAssessmentHistoryUseCase`, each constructing their own `WebCryptoEncryptionAdapter()` instance rather than sharing one — consistent with existing precedent, not a new decision.

- [ ] **Step 3: Verify the file still compiles**

Run: `pnpm --filter @zelo/web exec tsc --noEmit`
Expected: no new type errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/container.ts
git commit -m "feat(chat-history): wire persist/retrieve chat-history use cases into the container"
```

---

### Task 10: Load and save chat history from `useChatConversation`

**Files:**
- Modify: `apps/web/src/presentation/hooks/useChatConversation.ts`
- Modify: `apps/web/src/presentation/pages/ChatPage.test.tsx`

**Interfaces:**
- Consumes: `persistChatMessageUseCase`, `getChatHistoryUseCase` (Task 9, imported from `../../app/container`, matching how `sendChatMessageUseCase` is already imported in this file).
- Produces: `useChatConversation` now loads history on mount and persists every message — no other file depends on this behavior.

**Important — this task changes a shared dependency of every existing `ChatPage` test:** once the hook calls `getChatHistoryUseCase.execute()` on mount, any test that renders `<ChatPage />` without mocking it will hit the *real* `IndexedDbChatStoreAdapter`, which calls the browser's `indexedDB` global — undefined in this project's plain jsdom test environment (confirmed by grepping for `fake-indexeddb`: only the two adapter test files import it; no global polyfill exists in `vitest.setup.ts`). `HomePage.test.tsx` already mocks its equivalent (`getAssessmentHistoryUseCase.execute`) in every test that renders `HomePage` for exactly this reason — this task follows the same convention via a shared `beforeEach` default, since 5 of the file's 6 tests want the identical trivial value (`[]`) and only the new test needs a different one.

- [ ] **Step 1: Add a shared default mock for the new dependency**

At the top of `ChatPage.test.tsx`, change the import line:

```ts
import { describe, expect, it, vi } from "vitest";
```

to:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
```

Then add, as the first statement inside `describe("ChatPage", ...)` (before the existing `it` blocks):

```ts
  beforeEach(() => {
    vi.spyOn(container.getChatHistoryUseCase, "execute").mockResolvedValue([]);
  });
```

This makes every pre-existing test (the original three, plus Task 3's and Task 6's CTA tests) safe to run once the hook change below lands, without editing each of them individually.

- [ ] **Step 2: Write the failing test**

Add to `ChatPage.test.tsx`, inside `describe("ChatPage", ...)`, after the existing tests:

```ts
  it("loads persisted history on mount and persists new messages as they're sent", async () => {
    vi.spyOn(container.getChatHistoryUseCase, "execute").mockResolvedValue([
      { role: "user", content: "mensagem antiga" },
    ]);
    const persistSpy = vi.spyOn(container.persistChatMessageUseCase, "execute").mockResolvedValue(undefined);
    vi.spyOn(container.sendChatMessageUseCase, "execute").mockReturnValue(fakeAssistantStream());

    renderChat();
    expect(await screen.findByText("mensagem antiga")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Escreva como você está…"), "Estou bem");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Oi, tudo bem?")).toBeInTheDocument();
    expect(persistSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user", content: "Estou bem" }),
    );
    expect(persistSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "assistant", content: "Oi, tudo bem?" }),
    );
  });
```

This test's own `vi.spyOn(container.getChatHistoryUseCase, "execute")` call overrides the `beforeEach` default for this test only (Vitest's `mockResolvedValue` replaces the prior implementation on the same spy).

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: FAIL — "mensagem antiga" never rendered, and/or `persistSpy` never called (the hook doesn't call either use case yet)

- [ ] **Step 4: Implement history loading and persistence in the hook**

Replace the full contents of `useChatConversation.ts` with:

```ts
import { useCallback, useEffect, useState } from "react";
import type { AnonymizedMessage } from "@zelo/domain";
import { getChatHistoryUseCase, persistChatMessageUseCase, sendChatMessageUseCase } from "../../app/container";
import { isChatErrorEvent } from "../../ports/chat-gateway.port";
import type { ChatUiMessage } from "../../use-cases/get-chat-history.usecase";

export type { ChatUiMessage };

/**
 * Uses plain React state instead of TanStack Query: TanStack Query models a
 * single request → response cycle, but this hook consumes an incremental
 * token stream and must re-render on every chunk. The spec's "TanStack Query
 * lives in presentation/hooks" rule is honored in spirit — this is still the
 * hooks layer, just using the primitive that actually fits a streaming case.
 */
export function useChatConversation(conversationId: string) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisisFallback, setCrisisFallback] = useState(false);
  const [providerError, setProviderError] = useState(false);

  useEffect(() => {
    getChatHistoryUseCase.execute(conversationId).then(setMessages);
  }, [conversationId]);

  const sendMessage = useCallback(
    async (rawUserText: string, hasActiveRiskSignal: boolean) => {
      const history: AnonymizedMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: "user", content: rawUserText }, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      setProviderError(false);
      setCrisisFallback(false);
      void persistChatMessageUseCase.execute({ conversationId, role: "user", content: rawUserText });

      let assistantContent = "";

      for await (const event of sendChatMessageUseCase.execute({
        conversationId,
        history,
        rawUserText,
        hasActiveRiskSignal,
      })) {
        if (isChatErrorEvent(event)) {
          if (event.error === "crisis_fallback_required") {
            setCrisisFallback(true);
          } else {
            setProviderError(true);
          }
          continue;
        }
        assistantContent += event.delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantContent };
          return next;
        });
      }

      setIsStreaming(false);
      if (assistantContent.length > 0) {
        void persistChatMessageUseCase.execute({ conversationId, role: "assistant", content: assistantContent });
      }
    },
    [conversationId, messages],
  );

  return { messages, isStreaming, crisisFallback, providerError, sendMessage };
}
```

Note: `persistChatMessageUseCase.execute(...)` calls are intentionally not awaited inline (`void ...`) — persistence must not block the UI stream, matching this hook's existing streaming-first design. A save failing silently only costs that one message from history, not the live conversation.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- src/presentation/pages/ChatPage.test.tsx`
Expected: PASS (all tests in the file — the pre-existing ones now pass because of the `beforeEach` default from Step 1, and the new test's own `mockResolvedValue` in Step 2 overrides that default for itself)

- [ ] **Step 6: Run the full web test suite to check for regressions**

Run: `pnpm --filter @zelo/web test`
Expected: PASS — no test outside `ChatPage.test.tsx` imports `useChatConversation` directly, but confirm with `grep -rn "useChatConversation" apps/web/src` if any other consumer surfaces.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/presentation/hooks/useChatConversation.ts apps/web/src/presentation/pages/ChatPage.test.tsx
git commit -m "feat(chat-history): load persisted history on mount and persist messages as they're sent"
```

---

## Plan self-review notes

- **Spec coverage:** §A → Task 1. §B → Tasks 2-3. §C → Tasks 4-6. §D → Tasks 7-10. All four spec sections have at least one task.
- **Scope boundary respected:** Tasks 1-3 are the only ones intended to ship before 25/07; Tasks 4-10 are explicitly later-phase, matching the approved spec's two-tier status.
- **Type consistency check:** `ChatUiMessage` is defined once (Task 8, `get-chat-history.usecase.ts`) and re-exported (not redefined) everywhere else it's used (Task 10's hook). `LocalChatStorePort`/`ChatMessageRecord` names are used identically across Tasks 7-9. `routes.breathing` is defined once (Task 5) and consumed once (Task 6).
