# Manager Dashboard Skeleton Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "0%/0" fallback flash on `ManagerDashboardPage`'s first load with per-section skeleton placeholders shaped like each section's real content.

**Architecture:** Add a new `Skeleton` primitive (`apps/web/src/presentation/ui/Skeleton.tsx`) — a pulsing gray `<div>`, styled and tested like the codebase's other UI primitives (`Card`, `Button`). Then wire `ManagerDashboardPage.tsx` to read the `isLoading` flag TanStack Query's `useQuery` already provides (currently unused) and, while true, render three small module-level skeleton components (`KpiCardSkeleton`, `TrendCardSkeleton`, `SegmentsCardSkeleton`) in place of the real `Card` content for each of the four data-driven sections.

**Tech Stack:** React, TypeScript, Tailwind CSS (`animate-pulse` utility), TanStack Query v5, Vitest + Testing Library.

## Global Constraints

- Skeleton primitive base classes are `animate-pulse bg-line` only — it must NOT bake in a `rounded-*` class. Every call site supplies its own rounding (`rounded-md` for bars/text placeholders, `rounded-pill` for the segments track), because Tailwind's generated CSS order (not className string order) determines which same-property utility wins, so mixing a hardcoded `rounded-md` in the primitive with a call-site `rounded-pill` override would be unreliable.
- The `Skeleton` primitive renders `data-testid="skeleton"` unconditionally (not configurable) — tests assert on this fixed testid.
- Trend card skeleton uses exactly 6 same-height bars (matching "últimas 6 semanas" in the real card's caption). Segments card skeleton uses exactly 3 fixed rows (real row count is unknown before data arrives).
- The "Análise com IA" section (driven by `useManagerInsight()`) is out of scope — do not modify it.
- No behavior change to the loaded (non-loading) state — real content JSX must render exactly as it does today once `isLoading` is false.

---

### Task 1: `Skeleton` UI primitive

**Files:**
- Create: `apps/web/src/presentation/ui/Skeleton.tsx`
- Test: `apps/web/src/presentation/ui/Skeleton.test.tsx`

**Interfaces:**
- Produces: `Skeleton({ className?: string })` — a React component rendering `<div data-testid="skeleton" className="animate-pulse bg-line <className>" />`. Task 2 imports this by name from `@/presentation/ui/Skeleton` and composes it into `KpiCardSkeleton`, `TrendCardSkeleton`, `SegmentsCardSkeleton`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/presentation/ui/Skeleton.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a pulsing gray block", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse", "bg-line");
  });

  it("merges a custom className for sizing and shape", () => {
    render(<Skeleton className="h-4 w-20 rounded-pill" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("h-4", "w-20", "rounded-pill");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `apps/web`): `npx vitest run src/presentation/ui/Skeleton.test.tsx`
Expected: FAIL — `Skeleton.tsx` does not exist yet (module not found).

- [ ] **Step 3: Implement `Skeleton.tsx`**

Create `apps/web/src/presentation/ui/Skeleton.tsx`:

```tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div data-testid="skeleton" className={["animate-pulse bg-line", className].join(" ")} />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `apps/web`): `npx vitest run src/presentation/ui/Skeleton.test.tsx`
Expected: PASS (2/2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/Skeleton.tsx apps/web/src/presentation/ui/Skeleton.test.tsx
git commit -m "$(cat <<'EOF'
feat: add Skeleton UI primitive for loading placeholders
EOF
)"
```

---

### Task 2: Per-section skeletons on `ManagerDashboardPage`

**Files:**
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`

**Interfaces:**
- Consumes: `Skeleton({ className })` from Task 1 (`@/presentation/ui/Skeleton`).

- [ ] **Step 1: Write the failing test**

In `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`, add this test inside the existing `describe("ManagerDashboardPage", ...)` block (after the existing tests, before the closing `});`):

```tsx
  it("shows skeleton placeholders while signals are loading, then replaces them with real content", async () => {
    let resolveSignals!: (value: typeof SIGNALS_RESPONSE) => void;
    const pending = new Promise<typeof SIGNALS_RESPONSE>((resolve) => {
      resolveSignals = resolve;
    });
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockReturnValue(pending);

    renderManager();

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("Plantão noturno")).not.toBeInTheDocument();

    resolveSignals(SIGNALS_RESPONSE);

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId("skeleton")).toHaveLength(0);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `apps/web`): `npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx -t "shows skeleton placeholders"`
Expected: FAIL — `screen.getAllByTestId("skeleton")` finds zero elements (the page doesn't render any skeleton yet).

- [ ] **Step 3: Wire skeletons into `ManagerDashboardPage.tsx`**

Full new content for `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`:

```tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { PhoneShell } from "@/presentation/layout/PhoneShell";
import { BackButton } from "@/presentation/ui/BackButton";
import { PrivacyBadge } from "@/presentation/ui/PrivacyBadge";
import { SectionLabel } from "@/presentation/ui/SectionLabel";
import { Card } from "@/presentation/ui/Card";
import { Button } from "@/presentation/ui/Button";
import { Skeleton } from "@/presentation/ui/Skeleton";
import { routes } from "@/presentation/lib/routes";
import { useManagerSignals } from "@/presentation/hooks/useManagerSignals";
import { useManagerInsight } from "@/presentation/hooks/useManagerInsight";
import { useManagerSessionStore } from "@/stores/manager-session.store";
import { UnauthorizedManagerError } from "@/ports/manager-signals.port";

const MIN_TREND_BAR_HEIGHT = 8;
const TREND_SKELETON_BAR_COUNT = 6;
const SEGMENTS_SKELETON_ROW_COUNT = 3;

function toTrendBarHeights(trend: { concerningRate: number }[]): number[] {
  return trend.map((point) => Math.max(MIN_TREND_BAR_HEIGHT, Math.round(point.concerningRate * 100)));
}

function KpiCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card className={["text-center", className].join(" ")}>
      <Skeleton className="mx-auto h-[30px] w-16 rounded-md" />
      <Skeleton className="mx-auto mt-2 h-3 w-32 rounded-md" />
    </Card>
  );
}

function TrendCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-4 w-32 rounded-md" />
      <div className="mt-3 flex h-14 items-end gap-2">
        {Array.from({ length: TREND_SKELETON_BAR_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-full w-full rounded-md" />
        ))}
      </div>
    </Card>
  );
}

function SegmentsCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-4 w-28 rounded-md" />
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: SEGMENTS_SKELETON_ROW_COUNT }, (_, index) => (
          <div key={index}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-3 w-14 rounded-md" />
            </div>
            <Skeleton className="mt-1 h-2 w-full rounded-pill" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const clearSession = useManagerSessionStore((state) => state.clearSession);
  const { data, error, isError, isLoading } = useManagerSignals();
  const insight = useManagerInsight();

  useEffect(() => {
    if (isError && error instanceof UnauthorizedManagerError) {
      clearSession();
      navigate(routes.managerLogin, { replace: true });
    }
  }, [isError, error, clearSession, navigate]);

  const trend = data?.weeklyTrend ?? [];
  const bars = toTrendBarHeights(trend);
  const segments = data?.segments ?? [];
  const overallConcerningRate = data?.overallConcerningRate ?? 0;
  const checkInsLast4Weeks = data?.checkInsLast4Weeks ?? 0;
  const followUpResponseRate = data?.followUpResponseRate ?? 0;

  return (
    <PhoneShell bg="canvas-alt">
      <div className="pt-[26px]">
        <div className="flex items-center justify-between">
          <BackButton label="Sair da demo" onClick={() => navigate(routes.home)} />
          <PrivacyBadge />
        </div>
        <div className="mt-4">
          <SectionLabel>Painel do gestor</SectionLabel>
        </div>
        <h1 className="mt-2 text-h2 text-ink">Tendências da equipe</h1>
        <p className="mt-1 text-caption text-muted">
          Somente dados anônimos e agregados. Segmentos com menos de 5 respostas ficam ocultos
          para evitar re-identificação.
        </p>

        <div className="mt-5 flex gap-3">
          {isLoading ? (
            <>
              <KpiCardSkeleton className="flex-1" />
              <KpiCardSkeleton className="flex-1" />
            </>
          ) : (
            <>
              <Card className="flex-1 text-center">
                <p className="font-serif text-[30px] text-warn">{Math.round(overallConcerningRate * 100)}%</p>
                <p className="text-caption text-muted">sinais de burnout na equipe</p>
              </Card>
              <Card className="flex-1 text-center">
                <p className="font-serif text-[30px] text-brand">{checkInsLast4Weeks}</p>
                <p className="text-caption text-muted">questionários respondidos (4 semanas)</p>
              </Card>
            </>
          )}
        </div>

        <div className="mt-3">
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card className="text-center">
              <p className="font-serif text-[30px] text-brand">{Math.round(followUpResponseRate * 100)}%</p>
              <p className="text-caption text-muted">taxa de resposta do follow-up</p>
            </Card>
          )}
        </div>

        <div className="mt-[14px]">
          {isLoading ? (
            <TrendCardSkeleton />
          ) : (
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-body font-extrabold text-ink">Tendência geral</p>
                <p className="font-mono text-[12px] text-muted-2">últimas 6 semanas</p>
              </div>
              <div className="mt-3 flex h-14 items-end gap-2">
                {bars.map((height, index) => (
                  <div key={index} data-testid="trend-bar" className="w-full rounded-md bg-brand" style={{ height: `${height}%` }} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="mt-[14px]">
          {isLoading ? (
            <SegmentsCardSkeleton />
          ) : (
            <Card>
              <p className="text-body font-extrabold text-ink">Sinais por setor</p>
              <div className="mt-3 flex flex-col gap-3">
                {segments.map((segment) => (
                  <div key={segment.label}>
                    <div className="flex items-center justify-between text-label text-ink-2">
                      <span>{segment.label}</span>
                      <span className="font-mono text-[12px] text-muted-2">
                        {segment.value}% · n={segment.n}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-pill bg-canvas-alt">
                      <div className="h-full rounded-pill bg-brand" style={{ width: `${segment.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="mt-[14px]">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-body font-extrabold text-ink">Análise com IA</p>
              <Link to={routes.managerHistory} className="text-label font-bold text-brand">
                Ver histórico
              </Link>
            </div>
            {!insight.data && (
              <div className="mt-3">
                <Button className="p-2" variant="outline" full={false} loading={insight.isPending} onClick={() => insight.mutate()}>
                  Gerar análise
                </Button>
                {insight.isError && (
                  <p role="alert" className="mt-2 text-label text-danger">
                    Não foi possível gerar a análise agora. Tente novamente.
                  </p>
                )}
              </div>
            )}
            {insight.data && (
              <div className="mt-3">
                <p className="text-label text-ink-2">{insight.data.interpretation}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {insight.data.suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-label text-ink-2">
                      <span className="text-brand">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run the new test to verify it passes**

Run (from `apps/web`): `npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx -t "shows skeleton placeholders"`
Expected: PASS.

- [ ] **Step 5: Run the full `ManagerDashboardPage` test file**

Run (from `apps/web`): `npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: all tests PASS (the 7 pre-existing tests plus the new one — 8/8), confirming the loaded-state JSX is unchanged.

- [ ] **Step 6: Run the full test suite and typecheck**

Run (from `apps/web`): `npx vitest run`
Expected: all tests PASS (previously 226; should now be 228 — 2 new `Skeleton.test.tsx` tests + 1 new `ManagerDashboardPage.test.tsx` test).

Run (from `apps/web`): `npx tsc --noEmit`
Expected: no new errors introduced by this change.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/presentation/pages/ManagerDashboardPage.tsx apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx
git commit -m "$(cat <<'EOF'
feat: show per-section skeletons while manager dashboard signals load

Replaces the 0%/0 fallback flash on first load with skeleton
placeholders shaped like each section's real content (KPI cards,
trend chart, segments list), driven by useManagerSignals' isLoading.
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
