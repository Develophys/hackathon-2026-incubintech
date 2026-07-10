# Home & Assessment Vertical Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core daily-use loop — Home hub → scale picker → one-question-per-screen PHQ-9/GAD-7 → result with band + risk branch — replacing the current all-questions-on-one-page scaffold with the paced Sereno flow, while keeping the existing scoring/submission pipeline untouched.

**Architecture:** Rebuilds `HomePage`, `Phq9AssessmentPage`, `Gad7AssessmentPage` in place (same routes, new presentation) and adds `AssessmentSelectPage` + `AssessmentResultPage`. Introduces a `QuestionCard` component, a presentation-layer `bandFor()` scoring-band lookup, and `ResultBandCard`/`RiskSignalCallout` components. Retires `AssessmentForm.tsx` and `AssessmentResultBanner.tsx`, which become fully unreferenced once the assessment pages are rebuilt. No changes to `domain/`, `ports/`, `use-cases/`, or `infrastructure/` — this plan only consumes `ScoreAssessmentUseCase` (via `SubmitAssessmentUseCase`/`useSubmitAssessment`) and the existing domain scale constants.

**Tech Stack:** React 19, `react-router` v8, `@tanstack/react-query` (existing `useSubmitAssessment` hook), Vitest + Testing Library.

## Global Constraints

- **Prerequisites:** Design System Foundation plan (`2026-07-10-07-...`) and Onboarding & Consent plan (`2026-07-10-08-...`) must be implemented first — this plan consumes their primitives, `routes`, and the router shape they established.
- `riskSignal` never crosses the network. The submit pipeline (`SubmitAssessmentUseCase`) already strips it — this plan must not construct any network payload containing it. `riskSignal` in `navigate(..., { state })` is fine (never leaves the client).
- Scoring stays on-device: always go through `useSubmitAssessment` → `SubmitAssessmentUseCase` → `ScoreAssessmentUseCase`. Never recompute or duplicate scoring logic in a page component.
- `MBI-HSS` is not selectable in the UI — `ScoreAssessmentUseCase` throws for it by design. The picker renders it disabled ("em breve"); it must not be tappable and must not route anywhere.
- Band logic (`bandFor`) lives in the **presentation layer**, not `domain/` — per spec, this is UI framing, not clinical logic.
- Questions/options come from the existing domain constants (`PHQ9_QUESTIONS`, `GAD7_QUESTIONS`, `FREQUENCY_RESPONSE_OPTIONS`) — never hardcode a copy of the item text.
- "Isto é um sinal, não um diagnóstico" framing must be present and prominent on the result screen.
- PT-BR copy is normative (per the four screen specs this plan implements).
- No raw hex/emoji in JSX except two named exceptions already established: `ScoreDial`'s data-driven band pill, and the Home history chart's placeholder bar color `bg-[#CDDBD4]` (explicit in `04-home.md`, not a reusable token — a chart-only decorative value).
- Lock icon (`lucide-react`) replaces the 🔒 emoji used in the prototype/spec text everywhere it appears in this plan's screens.

---

## File Structure

```
apps/web/src/
  presentation/
    lib/
      band-for.ts                               (new)
      band-for.test.ts                          (new)
    components/
      QuestionCard.tsx                           (new)
      QuestionCard.test.tsx                      (new)
      ResultBandCard.tsx                          (new)
      RiskSignalCallout.tsx                       (new)
      ResultBandCard.test.tsx                     (new)
      AssessmentForm.tsx                          (delete)
      AssessmentResultBanner.tsx                  (delete)
    pages/
      HomePage.tsx                                (replace scaffold)
      HomePage.test.tsx                            (new)
      AssessmentSelectPage.tsx                     (new)
      AssessmentSelectPage.test.tsx                (new)
      AssessmentResultPage.tsx                     (new)
      AssessmentResultPage.test.tsx                (new)
      Phq9AssessmentPage.tsx                       (replace: one-question-per-screen)
      Phq9AssessmentPage.test.tsx                  (replace)
      Gad7AssessmentPage.tsx                       (replace: same pattern)
      Gad7AssessmentPage.test.tsx                  (new)
  app/
    router.tsx                                    (modify: add /assessment, /assessment/result)
    router.test.tsx                               (modify: extend with the new routes)
```

---

## Task 1: `HomePage` (replaces the current scaffold)

**Files:**
- Replace: `apps/web/src/presentation/pages/HomePage.tsx`
- Test: `apps/web/src/presentation/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `BottomNav`, `Card`, `IconBadge`, `PrivacyBadge` (Design System plan); `routes` (Onboarding plan).
- Produces: `HomePage` mounted at `/home` (route already wired in the Onboarding plan; this task only replaces the component body).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { HomePage } from "./HomePage";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/assessment" element={<div>Assessment select screen</div>} />
        <Route path="/chat" element={<div>Chat screen</div>} />
        <Route path="/peers" element={<div>Peers screen</div>} />
        <Route path="/manager" element={<div>Manager screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders the greeting, privacy badge, and hero check-in CTA", () => {
    renderHome();
    expect(screen.getByText("Olá.")).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer check-in" })).toBeInTheDocument();
  });

  it("renders the history chart with exactly one warn peak and one brand latest bar", () => {
    renderHome();
    const bars = screen.getAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.filter((bar) => bar.className.includes("bg-warn"))).toHaveLength(1);
    expect(bars.filter((bar) => bar.className.includes("bg-brand"))).toHaveLength(1);
  });

  it("navigates to /assessment when the hero CTA is tapped", async () => {
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: "Fazer check-in" }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });

  it("navigates to chat from the quick action card", async () => {
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: /conversar agora/i }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });

  it("shows Início as the active BottomNav tab", () => {
    renderHome();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test presentation/pages/HomePage -- --run`
Expected: FAIL — current scaffold has none of this content.

- [ ] **Step 3: Write the implementation**

```tsx
import { MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BottomNav } from "../layout/BottomNav";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { routes } from "../lib/routes";

// TODO(history): placeholder until a history endpoint exists — do not fabricate a use-case.
const HISTORY_BARS = [30, 45, 40, 70, 35, 55] as const;
const PEAK_INDEX = 3;
const LATEST_INDEX = HISTORY_BARS.length - 1;

export function HomePage() {
  const navigate = useNavigate();

  const handleNavigate = (tab: "home" | "checkin" | "chat" | "you") => {
    if (tab === "home") navigate(routes.home);
    if (tab === "checkin") navigate(routes.assessment);
    if (tab === "chat") navigate(routes.chat);
    // "you" tab: no destination yet — TODO(week2): profile/revoke-consent screen.
  };

  return (
    <PhoneShell footer={<BottomNav active="home" onNavigate={handleNavigate} />}>
      <div className="flex flex-col pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-muted-2">Bom te ver por aqui</p>
            <p className="font-serif text-[25px] text-ink">Olá.</p>
          </div>
          <PrivacyBadge />
        </div>

        <div className="mt-5">
          <Card size="lg" tone="brand">
            <p className="font-serif text-[21px]">Como você está hoje?</p>
            <p className="mt-1 text-label opacity-85">Um check-in de 5 minutos, só para você.</p>
            <button
              type="button"
              onClick={() => navigate(routes.assessment)}
              className="mt-4 min-h-[52px] w-full rounded-pill bg-white px-4 font-sans text-[16px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Fazer check-in
            </button>
          </Card>
        </div>

        <div className="mt-[14px]">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-body font-extrabold text-ink">Seu histórico</p>
              <p className="font-mono text-[12px] text-muted-2">últimas 6 semanas</p>
            </div>
            <div className="mt-3 flex h-14 items-end gap-2">
              {HISTORY_BARS.map((height, index) => (
                <div
                  key={index}
                  data-testid="history-bar"
                  className={`w-full rounded-md ${
                    index === LATEST_INDEX ? "bg-brand" : index === PEAK_INDEX ? "bg-warn" : "bg-[#CDDBD4]"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-[14px] flex gap-3">
          <button
            type="button"
            onClick={() => navigate(routes.chat)}
            className="flex-1 rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <IconBadge icon={MessageCircle} />
            <p className="mt-2 text-body font-extrabold text-ink">Conversar agora</p>
          </button>
          <button
            type="button"
            onClick={() => navigate(routes.peers)}
            className="flex-1 rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <IconBadge icon={Users} />
            <p className="mt-2 text-body font-extrabold text-ink">Falar com um par</p>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate(routes.manager)}
          className="mt-4 text-label font-semibold text-muted underline"
        >
          Ver painel do gestor (demo)
        </button>
      </div>
    </PhoneShell>
  );
}
```

> Note: `routes.peers` and `routes.manager` already exist in the `routes` helper (Onboarding plan, Task 2) even though `/peers` and `/manager` aren't wired in `router.tsx` until the Support Surfaces plan. Navigating there before that plan lands is a dead link in a real browser but does not break this plan's tests (each test wires only the routes it needs).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test presentation/pages/HomePage -- --run`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/HomePage.tsx apps/web/src/presentation/pages/HomePage.test.tsx
git commit -m "feat(web): rebuild HomePage as the Sereno hub"
```

---

## Task 2: `AssessmentSelectPage`

**Files:**
- Create: `apps/web/src/presentation/pages/AssessmentSelectPage.tsx`
- Test: `apps/web/src/presentation/pages/AssessmentSelectPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`; `routes`.
- Produces: `AssessmentSelectPage`, mounted at `/assessment` in Task 10.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { AssessmentSelectPage } from "./AssessmentSelectPage";

function renderSelect() {
  return render(
    <MemoryRouter initialEntries={["/assessment"]}>
      <Routes>
        <Route path="/assessment" element={<AssessmentSelectPage />} />
        <Route path="/assessment/phq9" element={<div>PHQ-9 screen</div>} />
        <Route path="/assessment/gad7" element={<div>GAD-7 screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AssessmentSelectPage", () => {
  it("renders the title, both active scales, and the disabled MBI-HSS row", () => {
    renderSelect();
    expect(screen.getByText("Autoavaliação")).toBeInTheDocument();
    expect(screen.getByText("PHQ-9")).toBeInTheDocument();
    expect(screen.getByText("Humor e sinais de depressão")).toBeInTheDocument();
    expect(screen.getByText("GAD-7")).toBeInTheDocument();
    expect(screen.getByText("Ansiedade")).toBeInTheDocument();
    expect(screen.getByText("MBI-HSS")).toBeInTheDocument();
    expect(screen.getByText("em breve")).toBeInTheDocument();
  });

  it("MBI-HSS is not a button and does not navigate anywhere", () => {
    renderSelect();
    expect(screen.queryByRole("button", { name: /MBI-HSS/i })).not.toBeInTheDocument();
  });

  it("navigates to PHQ-9 and GAD-7 correctly", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button", { name: /PHQ-9/i }));
    expect(screen.getByText("PHQ-9 screen")).toBeInTheDocument();
  });

  it("shows the on-device trust line", () => {
    renderSelect();
    expect(screen.getByText("tudo processado no seu aparelho")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test AssessmentSelectPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import { Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { routes } from "../lib/routes";

export function AssessmentSelectPage() {
  const navigate = useNavigate();

  return (
    <PhoneShell>
      <div className="pt-[26px]">
        <button type="button" onClick={() => navigate(routes.home)} className="text-label font-semibold text-muted">
          ← Início
        </button>
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

        <div className="mt-6 flex items-center justify-center gap-1">
          <Lock size={12} className="text-muted-2" />
          <span className="font-mono text-eyebrow uppercase text-muted-2">tudo processado no seu aparelho</span>
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test AssessmentSelectPage -- --run`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/AssessmentSelectPage.tsx apps/web/src/presentation/pages/AssessmentSelectPage.test.tsx
git commit -m "feat(web): add AssessmentSelectPage"
```

---

## Task 3: `QuestionCard` component

**Files:**
- Create: `apps/web/src/presentation/components/QuestionCard.tsx`
- Test: `apps/web/src/presentation/components/QuestionCard.test.tsx`

**Interfaces:**
- Produces: `QuestionCard` — consumed by `Phq9AssessmentPage` and `Gad7AssessmentPage` (Tasks 7, 8).

```ts
interface QuestionCardProps {
  question: string;
  options: readonly { value: number; label: string }[];
  selected?: number;
  onSelect: (value: number) => void;
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "./QuestionCard";

const OPTIONS = [
  { value: 0, label: "Nenhuma vez" },
  { value: 1, label: "Vários dias" },
];

describe("QuestionCard", () => {
  it("renders the question and all options", () => {
    render(<QuestionCard question="Pouco interesse..." options={OPTIONS} onSelect={vi.fn()} />);
    expect(screen.getByText("Pouco interesse...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nenhuma vez" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vários dias" })).toBeInTheDocument();
  });

  it("calls onSelect with the option value", async () => {
    const onSelect = vi.fn();
    render(<QuestionCard question="Q" options={OPTIONS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Vários dias" }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("marks the selected option as pressed", () => {
    render(<QuestionCard question="Q" options={OPTIONS} selected={0} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Nenhuma vez" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Vários dias" })).toHaveAttribute("aria-pressed", "false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test QuestionCard -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
interface QuestionCardProps {
  question: string;
  options: readonly { value: number; label: string }[];
  selected?: number;
  onSelect: (value: number) => void;
}

export function QuestionCard({ question, options, selected, onSelect }: QuestionCardProps) {
  return (
    <div>
      <h2 className="mb-[26px] mt-[10px] font-serif text-h2 text-ink">{question}</h2>
      <div className="flex flex-col gap-[11px]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => onSelect(option.value)}
            className={`rounded-input border p-[16px_18px] text-left text-label font-semibold text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              selected === option.value ? "border-brand bg-surface-brand" : "border-line bg-surface"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test QuestionCard -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/components/QuestionCard.tsx apps/web/src/presentation/components/QuestionCard.test.tsx
git commit -m "feat(web): add QuestionCard for one-question-per-screen assessments"
```

---

## Task 4: `bandFor` score-band lookup

**Files:**
- Create: `apps/web/src/presentation/lib/band-for.ts`
- Test: `apps/web/src/presentation/lib/band-for.test.ts`

**Interfaces:**
- Produces: `bandFor(scaleType, score): ScoreBand` and the `ScoreBand` type — consumed by `ResultBandCard` (Task 5) and `AssessmentResultPage` (Task 6).

```ts
export interface ScoreBand { label: string; fg: string; bg: string; }
export function bandFor(scaleType: "PHQ-9" | "GAD-7", score: number): ScoreBand;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { bandFor } from "./band-for";

describe("bandFor", () => {
  it.each([
    [4, "Mínimo"],
    [5, "Leve"],
    [9, "Leve"],
    [10, "Moderado"],
    [14, "Moderado"],
    [15, "Moderadamente grave"],
    [19, "Moderadamente grave"],
    [20, "Grave"],
    [27, "Grave"],
  ])("PHQ-9 score %i maps to band %s", (score, label) => {
    expect(bandFor("PHQ-9", score).label).toBe(label);
  });

  it.each([
    [4, "Mínimo"],
    [5, "Leve"],
    [9, "Leve"],
    [10, "Moderado"],
    [14, "Moderado"],
    [15, "Grave"],
    [21, "Grave"],
  ])("GAD-7 score %i maps to band %s", (score, label) => {
    expect(bandFor("GAD-7", score).label).toBe(label);
  });

  it("returns fg/bg colors alongside the label", () => {
    const band = bandFor("PHQ-9", 12);
    expect(band).toEqual({ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test band-for -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
export interface ScoreBand {
  label: string;
  fg: string;
  bg: string;
}

interface BandEntry {
  max: number;
  band: ScoreBand;
}

const PHQ9_BANDS: BandEntry[] = [
  { max: 4, band: { label: "Mínimo", fg: "#2F6B5E", bg: "#E3ECE7" } },
  { max: 9, band: { label: "Leve", fg: "#3F7D5C", bg: "#E5EFE6" } },
  { max: 14, band: { label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" } },
  { max: 19, band: { label: "Moderadamente grave", fg: "#A2453A", bg: "#F7EBE8" } },
  { max: 27, band: { label: "Grave", fg: "#8F2F26", bg: "#F5E4E1" } },
];

const GAD7_BANDS: BandEntry[] = [
  { max: 4, band: { label: "Mínimo", fg: "#2F6B5E", bg: "#E3ECE7" } },
  { max: 9, band: { label: "Leve", fg: "#3F7D5C", bg: "#E5EFE6" } },
  { max: 14, band: { label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" } },
  { max: 21, band: { label: "Grave", fg: "#8F2F26", bg: "#F5E4E1" } },
];

export function bandFor(scaleType: "PHQ-9" | "GAD-7", score: number): ScoreBand {
  const bands = scaleType === "PHQ-9" ? PHQ9_BANDS : GAD7_BANDS;
  const match = bands.find((entry) => score <= entry.max);
  return (match ?? bands[bands.length - 1]!).band;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test band-for -- --run`
Expected: PASS (17 tests across both `it.each` blocks plus the color test).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/lib/band-for.ts apps/web/src/presentation/lib/band-for.test.ts
git commit -m "feat(web): add PHQ-9/GAD-7 score-band lookup"
```

---

## Task 5: `ResultBandCard` and `RiskSignalCallout` components

**Files:**
- Create: `apps/web/src/presentation/components/ResultBandCard.tsx`
- Create: `apps/web/src/presentation/components/RiskSignalCallout.tsx`
- Test: `apps/web/src/presentation/components/ResultBandCard.test.tsx`

**Interfaces:**
- Consumes: `Card`, `ScoreDial` (Design System plan); `ScoreBand` (Task 4).
- Produces: both components, consumed by `AssessmentResultPage` (Task 6).

```ts
interface ResultBandCardProps { scaleType: "PHQ-9" | "GAD-7"; score: number; max: number; band: ScoreBand; }
interface RiskSignalCalloutProps { onConnect: () => void; }
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultBandCard } from "./ResultBandCard";
import { RiskSignalCallout } from "./RiskSignalCallout";

describe("ResultBandCard", () => {
  it("renders the scale label, score, and band", () => {
    render(
      <ResultBandCard
        scaleType="PHQ-9"
        score={12}
        max={27}
        band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }}
      />,
    );
    expect(screen.getByText("Sua pontuação PHQ-9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Moderado")).toBeInTheDocument();
  });
});

describe("RiskSignalCallout", () => {
  it("renders the risk copy and calls onConnect on tap", async () => {
    const onConnect = vi.fn();
    render(<RiskSignalCallout onConnect={onConnect} />);
    expect(screen.getByText("Notamos um sinal importante.")).toBeInTheDocument();
    expect(screen.getByText(/Você não está sozinho\(a\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Falar com alguém agora" }));
    expect(onConnect).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ResultBandCard -- --run`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementation**

`ResultBandCard.tsx`:

```tsx
import { Card } from "../ui/Card";
import { ScoreDial } from "../ui/ScoreDial";
import type { ScoreBand } from "../lib/band-for";

interface ResultBandCardProps {
  scaleType: "PHQ-9" | "GAD-7";
  score: number;
  max: number;
  band: ScoreBand;
}

export function ResultBandCard({ scaleType, score, max, band }: ResultBandCardProps) {
  return (
    <Card size="lg" className="text-center">
      <p className="text-caption text-muted-2">Sua pontuação {scaleType}</p>
      <div className="mt-2">
        <ScoreDial score={score} max={max} band={band} />
      </div>
    </Card>
  );
}
```

`RiskSignalCallout.tsx`:

```tsx
interface RiskSignalCalloutProps {
  onConnect: () => void;
}

export function RiskSignalCallout({ onConnect }: RiskSignalCalloutProps) {
  return (
    <div className="rounded-2xl border border-danger-border bg-danger-bg p-[18px]">
      <p className="text-body font-extrabold text-danger">Notamos um sinal importante.</p>
      <p className="mt-1 text-caption text-danger-ink">
        Você não está sozinho(a). Podemos te conectar com alguém agora.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 min-h-[52px] w-full rounded-pill bg-danger py-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
      >
        Falar com alguém agora
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ResultBandCard -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/components/ResultBandCard.tsx apps/web/src/presentation/components/RiskSignalCallout.tsx apps/web/src/presentation/components/ResultBandCard.test.tsx
git commit -m "feat(web): add ResultBandCard and RiskSignalCallout"
```

---

## Task 6: `AssessmentResultPage`

**Files:**
- Create: `apps/web/src/presentation/pages/AssessmentResultPage.tsx`
- Test: `apps/web/src/presentation/pages/AssessmentResultPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `Button` (Design System); `ResultBandCard`, `RiskSignalCallout` (Task 5); `bandFor` (Task 4); `routes`.
- Produces: `AssessmentResultPage`, mounted at `/assessment/result` in Task 10. Reads `useLocation().state` written by `Phq9AssessmentPage`/`Gad7AssessmentPage` (Tasks 7, 8) — never recomputes the score.

```ts
interface ResultLocationState {
  scaleType: "PHQ-9" | "GAD-7";
  totalScore: number;
  max: number;
  riskSignal: boolean;
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { AssessmentResultPage } from "./AssessmentResultPage";

function renderResult(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/assessment/result", state }]}>
      <Routes>
        <Route path="/assessment/result" element={<AssessmentResultPage />} />
        <Route path="/assessment" element={<div>Assessment select screen</div>} />
        <Route path="/chat" element={<div>Chat screen</div>} />
        <Route path="/crisis" element={<div>Crisis screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AssessmentResultPage", () => {
  it("renders the score, band, and 'sinal, não diagnóstico' reframe copy", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });
    expect(screen.getByText("Sua pontuação PHQ-9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Moderado")).toBeInTheDocument();
    expect(screen.getByText(/sinal, não um diagnóstico/)).toBeInTheDocument();
  });

  it("shows the risk callout when riskSignal is true without hiding the other CTAs", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 20, max: 27, riskSignal: true });
    expect(screen.getByText("Notamos um sinal importante.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conversar com o acolhimento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar ao início" })).toBeInTheDocument();
  });

  it("does not show the risk callout when riskSignal is false", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 3, max: 27, riskSignal: false });
    expect(screen.queryByText("Notamos um sinal importante.")).not.toBeInTheDocument();
  });

  it("redirects to /assessment when there is no navigation state (deep link or refresh)", async () => {
    renderResult(null);
    expect(await screen.findByText("Assessment select screen")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test AssessmentResultPage -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { ResultBandCard } from "../components/ResultBandCard";
import { RiskSignalCallout } from "../components/RiskSignalCallout";
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
        <div className="flex items-center justify-center gap-1">
          <Lock size={12} className="text-muted-2" />
          <span className="font-mono text-eyebrow uppercase text-muted-2">processado no seu aparelho</span>
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
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test AssessmentResultPage -- --run`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/AssessmentResultPage.tsx apps/web/src/presentation/pages/AssessmentResultPage.test.tsx
git commit -m "feat(web): add AssessmentResultPage"
```

---

## Task 7: Rebuild `Phq9AssessmentPage` as one-question-per-screen

**Files:**
- Replace: `apps/web/src/presentation/pages/Phq9AssessmentPage.tsx`
- Replace: `apps/web/src/presentation/pages/Phq9AssessmentPage.test.tsx`

**Interfaces:**
- Consumes: `PhoneShell`, `ProgressBar` (Design System); `QuestionCard` (Task 3); `useSubmitAssessment` (existing hook, unchanged); `PHQ9_QUESTIONS`, `FREQUENCY_RESPONSE_OPTIONS` (existing domain constants); `routes`.
- Produces: `Phq9AssessmentPage`, still mounted at `/assessment/phq9` (route already wired in the Onboarding plan; component body only).

- [ ] **Step 1: Write the failing test** (replaces the old `AssessmentForm`-based test entirely)

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Phq9AssessmentPage } from "./Phq9AssessmentPage";
import * as container from "../../app/container";
import { PHQ9_QUESTIONS } from "../../domain/assessment-scales/phq9";

function renderPhq9() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/assessment/phq9"]}>
        <Routes>
          <Route path="/assessment/phq9" element={<Phq9AssessmentPage />} />
          <Route path="/assessment" element={<div>Assessment select screen</div>} />
          <Route path="/assessment/result" element={<div>Result screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Phq9AssessmentPage", () => {
  beforeEach(() => {
    vi.spyOn(container.submitAssessmentUseCase, "execute").mockResolvedValue({
      totalScore: 5,
      riskSignal: false,
      submissionSucceeded: true,
    });
  });

  it("shows exactly one question at a time with an accurate progress counter", () => {
    renderPhq9();
    expect(screen.getByText(PHQ9_QUESTIONS[0])).toBeInTheDocument();
    expect(screen.queryByText(PHQ9_QUESTIONS[1])).not.toBeInTheDocument();
    expect(screen.getByText("1/9")).toBeInTheDocument();
  });

  it("auto-advances on selection; back steps to the previous question, then to the selector", async () => {
    const user = userEvent.setup();
    renderPhq9();

    await user.click(screen.getByRole("button", { name: "Nenhuma vez" }));
    expect(screen.getByText(PHQ9_QUESTIONS[1])).toBeInTheDocument();
    expect(screen.getByText("2/9")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText(PHQ9_QUESTIONS[0])).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });

  it("submits via the existing pipeline and navigates to the result screen with the on-device score", async () => {
    const user = userEvent.setup();
    renderPhq9();

    for (let i = 0; i < PHQ9_QUESTIONS.length; i++) {
      await user.click(screen.getByRole("button", { name: "Nenhuma vez" }));
    }

    await waitFor(() => {
      expect(screen.getByText("Result screen")).toBeInTheDocument();
    });

    expect(container.submitAssessmentUseCase.execute).toHaveBeenCalledWith({
      scaleType: "PHQ-9",
      answers: new Array(PHQ9_QUESTIONS.length).fill(0),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test Phq9AssessmentPage -- --run`
Expected: FAIL — old component renders `AssessmentForm`, not one-question-per-screen.

- [ ] **Step 3: Write the implementation**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { ProgressBar } from "../ui/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { PHQ9_QUESTIONS } from "../../domain/assessment-scales/phq9";
import { FREQUENCY_RESPONSE_OPTIONS } from "../../domain/assessment-scales/frequency-scale";
import { useSubmitAssessment } from "../hooks/useSubmitAssessment";
import { routes } from "../lib/routes";

export function Phq9AssessmentPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useSubmitAssessment();
  const [answers, setAnswers] = useState<(number | undefined)[]>(() =>
    new Array(PHQ9_QUESTIONS.length).fill(undefined),
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const total = PHQ9_QUESTIONS.length;
  const isLast = questionIndex === total - 1;

  const handleBack = () => {
    if (questionIndex === 0) {
      navigate(routes.assessment);
      return;
    }
    setQuestionIndex((index) => index - 1);
  };

  const handleSelect = async (value: number) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = value;
    setAnswers(nextAnswers);

    if (!isLast) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    const result = await mutateAsync({ scaleType: "PHQ-9", answers: nextAnswers as number[] });
    navigate(routes.result, {
      state: { scaleType: "PHQ-9", totalScore: result.totalScore, max: 27, riskSignal: result.riskSignal },
    });
  };

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-6">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Voltar" onClick={handleBack} className="text-ink">
            ←
          </button>
          <div className="flex-1">
            <ProgressBar value={((questionIndex + 1) / total) * 100} />
          </div>
          <span className="font-mono text-[12px] text-muted-2">
            {questionIndex + 1}/{total}
          </span>
        </div>

        <p className="mt-[26px] text-caption text-muted-2">
          Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:
        </p>

        <QuestionCard
          question={PHQ9_QUESTIONS[questionIndex]}
          options={FREQUENCY_RESPONSE_OPTIONS}
          selected={answers[questionIndex]}
          onSelect={handleSelect}
        />
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test Phq9AssessmentPage -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/Phq9AssessmentPage.tsx apps/web/src/presentation/pages/Phq9AssessmentPage.test.tsx
git commit -m "feat(web): rebuild Phq9AssessmentPage as one-question-per-screen"
```

---

## Task 8: Rebuild `Gad7AssessmentPage` (same pattern)

**Files:**
- Replace: `apps/web/src/presentation/pages/Gad7AssessmentPage.tsx`
- Replace: `apps/web/src/presentation/pages/Gad7AssessmentPage.test.tsx`

**Interfaces:**
- Identical shape to Task 7, targeting `GAD7_QUESTIONS` (7 items), `scaleType: "GAD-7"`, `max: 21`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Gad7AssessmentPage } from "./Gad7AssessmentPage";
import * as container from "../../app/container";
import { GAD7_QUESTIONS } from "../../domain/assessment-scales/gad7";

function renderGad7() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/assessment/gad7"]}>
        <Routes>
          <Route path="/assessment/gad7" element={<Gad7AssessmentPage />} />
          <Route path="/assessment" element={<div>Assessment select screen</div>} />
          <Route path="/assessment/result" element={<div>Result screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Gad7AssessmentPage", () => {
  beforeEach(() => {
    vi.spyOn(container.submitAssessmentUseCase, "execute").mockResolvedValue({
      totalScore: 3,
      riskSignal: false,
      submissionSucceeded: true,
    });
  });

  it("shows exactly one question at a time with an accurate progress counter", () => {
    renderGad7();
    expect(screen.getByText(GAD7_QUESTIONS[0])).toBeInTheDocument();
    expect(screen.getByText("1/7")).toBeInTheDocument();
  });

  it("submits via the existing pipeline and navigates to the result screen with max=21", async () => {
    const user = userEvent.setup();
    renderGad7();

    for (let i = 0; i < GAD7_QUESTIONS.length; i++) {
      await user.click(screen.getByRole("button", { name: "Nenhuma vez" }));
    }

    await waitFor(() => {
      expect(screen.getByText("Result screen")).toBeInTheDocument();
    });

    expect(container.submitAssessmentUseCase.execute).toHaveBeenCalledWith({
      scaleType: "GAD-7",
      answers: new Array(GAD7_QUESTIONS.length).fill(0),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test Gad7AssessmentPage -- --run`
Expected: FAIL — old component renders `AssessmentForm`.

- [ ] **Step 3: Write the implementation**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { ProgressBar } from "../ui/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { GAD7_QUESTIONS } from "../../domain/assessment-scales/gad7";
import { FREQUENCY_RESPONSE_OPTIONS } from "../../domain/assessment-scales/frequency-scale";
import { useSubmitAssessment } from "../hooks/useSubmitAssessment";
import { routes } from "../lib/routes";

export function Gad7AssessmentPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useSubmitAssessment();
  const [answers, setAnswers] = useState<(number | undefined)[]>(() =>
    new Array(GAD7_QUESTIONS.length).fill(undefined),
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const total = GAD7_QUESTIONS.length;
  const isLast = questionIndex === total - 1;

  const handleBack = () => {
    if (questionIndex === 0) {
      navigate(routes.assessment);
      return;
    }
    setQuestionIndex((index) => index - 1);
  };

  const handleSelect = async (value: number) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = value;
    setAnswers(nextAnswers);

    if (!isLast) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    const result = await mutateAsync({ scaleType: "GAD-7", answers: nextAnswers as number[] });
    navigate(routes.result, {
      state: { scaleType: "GAD-7", totalScore: result.totalScore, max: 21, riskSignal: result.riskSignal },
    });
  };

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-6">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Voltar" onClick={handleBack} className="text-ink">
            ←
          </button>
          <div className="flex-1">
            <ProgressBar value={((questionIndex + 1) / total) * 100} />
          </div>
          <span className="font-mono text-[12px] text-muted-2">
            {questionIndex + 1}/{total}
          </span>
        </div>

        <p className="mt-[26px] text-caption text-muted-2">
          Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:
        </p>

        <QuestionCard
          question={GAD7_QUESTIONS[questionIndex]}
          options={FREQUENCY_RESPONSE_OPTIONS}
          selected={answers[questionIndex]}
          onSelect={handleSelect}
        />
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test Gad7AssessmentPage -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/Gad7AssessmentPage.tsx apps/web/src/presentation/pages/Gad7AssessmentPage.test.tsx
git commit -m "feat(web): rebuild Gad7AssessmentPage as one-question-per-screen"
```

---

## Task 9: Retire `AssessmentForm` and `AssessmentResultBanner`

**Files:**
- Delete: `apps/web/src/presentation/components/AssessmentForm.tsx`
- Delete: `apps/web/src/presentation/components/AssessmentResultBanner.tsx`

**Interfaces:** none — this task only removes now-dead code.

- [ ] **Step 1: Confirm nothing still imports them**

Run: `grep -rln "AssessmentForm\|AssessmentResultBanner" apps/web/src --include="*.tsx" --include="*.ts"`
Expected: no output (both `Phq9AssessmentPage.tsx` and `Gad7AssessmentPage.tsx` were rewritten in Tasks 7-8 to use `QuestionCard` instead).

- [ ] **Step 2: Delete the files**

```bash
git rm apps/web/src/presentation/components/AssessmentForm.tsx apps/web/src/presentation/components/AssessmentResultBanner.tsx
```

- [ ] **Step 3: Run the full test suite and build**

Run: `pnpm --filter web test -- --run && pnpm --filter web build`
Expected: all tests pass, build succeeds — confirms no dangling references.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(web): remove AssessmentForm and AssessmentResultBanner, superseded by one-question-per-screen flow"
```

> `HumanHandoffPanel.tsx` is **not** touched here — it is still used by `ChatPage.tsx` and stays until the Support Surfaces plan decides its fate.

---

## Task 10: Wire `/assessment` and `/assessment/result` into the router

**Files:**
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`

**Interfaces:**
- Consumes: `AssessmentSelectPage` (Task 2), `AssessmentResultPage` (Task 6).
- Produces: final route table after this plan — adds `assessment` and `assessment/result` to the children already established in the Onboarding plan.

- [ ] **Step 1: Extend the router test**

Add two new routes to `buildTestRouter`'s children array in `apps/web/src/app/router.test.tsx` (import `AssessmentSelectPage` and `AssessmentResultPage`, add `{ path: "assessment", Component: AssessmentSelectPage }` and `{ path: "assessment/result", Component: AssessmentResultPage }`), then add:

```tsx
it("Home's check-in CTA reaches the assessment selector through the real route table", async () => {
  useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
  buildTestRouter("/home");
  const user = userEvent.setup();

  await user.click(await screen.findByRole("button", { name: "Fazer check-in" }));
  expect(await screen.findByText("Autoavaliação")).toBeInTheDocument();
});
```

(This requires adding `{ path: "home", Component: HomePage }` to `buildTestRouter`'s children if not already present from the Onboarding plan — it is.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test app/router -- --run`
Expected: FAIL — `buildTestRouter` doesn't yet include the `assessment` route.

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
import { AssessmentSelectPage } from "../presentation/pages/AssessmentSelectPage";
import { AssessmentResultPage } from "../presentation/pages/AssessmentResultPage";
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
      { path: "privacy", Component: PrivacyPage },
      { path: "consent", Component: ConsentPage },
      { path: "home", Component: HomePage },
      { path: "chat", Component: ChatPage },
      { path: "assessment", Component: AssessmentSelectPage },
      { path: "assessment/phq9", Component: Phq9AssessmentPage },
      { path: "assessment/gad7", Component: Gad7AssessmentPage },
      { path: "assessment/result", Component: AssessmentResultPage },
    ],
  },
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test app/router -- --run`
Expected: PASS (3 tests total in the file).

- [ ] **Step 5: Run the full test suite and build**

Run: `pnpm --filter web test -- --run && pnpm --filter web build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx
git commit -m "feat(web): wire assessment select and result routes"
```

---

## Acceptance criteria (whole plan)

- Completing a PHQ-9 flow shows the correct total & band on the result screen; answering item 9 (`PHQ9_RISK_ITEM_INDEX`) with any value > 0 surfaces the crisis affordance (`RiskSignalCallout`) on the result screen.
- Submit persists via `useSubmitAssessment` without `riskSignal` on the wire (guaranteed by the existing, untouched `SubmitAssessmentUseCase`).
- MBI-HSS is visibly disabled and non-interactive everywhere it appears.
- `/assessment/result` with no navigation state redirects to `/assessment` with no crash.
- Home's BottomNav shows Início active; check-in CTA and BottomNav Check-in both reach `/assessment`.
- `AssessmentForm.tsx` and `AssessmentResultBanner.tsx` no longer exist in the tree.

---

## Self-review notes

- **Spec coverage:** `04-home.md` → Task 1. `05-assessment-select.md` → Task 2. `06-assessment-question.md` (incl. `QuestionCard`) → Tasks 3, 7, 8. `07-result.md` (incl. `ResultBandCard`, `RiskSignalCallout`, band logic) → Tasks 4, 5, 6. Routing spec §3 (passing the result forward via `navigate(..., { state })`) → Tasks 6, 7, 8. File-map cleanup (`AssessmentForm`/`AssessmentResultBanner` superseded) → Task 9. Router wiring → Task 10.
- **Placeholder scan:** none found. The two explicit `// TODO(history)` / `// TODO(week2)` comments are spec-mandated placeholders for genuinely not-yet-built backend features, not plan placeholders.
- **Type consistency:** `ResultLocationState` in Task 6 matches the `state` object shape constructed in Task 7 and Task 8's `navigate(routes.result, { state: {...} })` calls exactly (`scaleType`, `totalScore`, `max`, `riskSignal`). `ScoreBand` from Task 4 flows unchanged into `ResultBandCard`'s `band` prop (Task 5) and `ScoreDial`'s `band` prop (Design System plan).
