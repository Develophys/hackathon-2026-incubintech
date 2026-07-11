# Home History — Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `HomePage`'s hardcoded `HISTORY_BARS` placeholder with the device's own real
assessment history, computed on-device from the encrypted records already saved locally by
every completed PHQ-9/GAD-7 check-in.

**Architecture:** A new use-case (`GetAssessmentHistoryUseCase`) reads every locally-stored
`AssessmentRecord` via the existing `LocalAssessmentStorePort`, decrypts each one's ciphertext
via the existing `EncryptionPort` (the AES key never leaves the device — decryption here is the
same operation the app already trusts for submission, just run in reverse), re-scores the
recovered answers via the existing `ScoreAssessmentUseCase`, and buckets the results into the
last 6 ISO calendar weeks. No backend change, no new Prisma model, no new network call — this
is entirely a read of data the app already has on-device. `PeersPage` and
`ManagerDashboardPage` are explicitly out of scope for this plan; see
`docs/superpowers/specs/identity-and-aggregation.md` for why and what replacing their
placeholders would actually require.

**Tech Stack:** TypeScript, `@tanstack/react-query` (matches the existing `useSubmitAssessment`
pattern), Vitest.

## Global Constraints

- No backend/API change. No new Prisma model, no new HTTP call. This plan only reads local,
  already-decryptable, on-device data.
- The AES key never leaves the device (existing guarantee from
  `WebCryptoEncryptionAdapter` — unchanged, not touched by this plan).
- A record that fails to decrypt or re-score must be skipped, never crash the whole history
  view — `HomePage` must always render even if one past record is corrupt.
- `MBI-HSS` records must never reach `ScoreAssessmentUseCase.execute` (it throws for that
  scale by design) — skip them defensively even though none should exist today, since MBI-HSS
  is disabled everywhere in the UI.
- PT-BR copy is normative; `"últimas 6 semanas"` stays accurate copy, which is why this plan
  buckets by real ISO calendar week rather than just "last 6 records" (the two aren't the same
  when check-ins are sparse or clustered).

---

## File Structure

```
apps/web/src/
  use-cases/
    get-assessment-history.usecase.ts        (new)
    get-assessment-history.usecase.test.ts   (new)
  app/
    container.ts                              (modify: export getAssessmentHistoryUseCase)
  presentation/
    hooks/
      useAssessmentHistory.ts                 (new)
    pages/
      HomePage.tsx                            (modify: consume real data instead of HISTORY_BARS)
      HomePage.test.tsx                       (modify: mock the use-case, add empty-state case)
```

---

## Task 1: `GetAssessmentHistoryUseCase`

**Files:**
- Create: `apps/web/src/use-cases/get-assessment-history.usecase.ts`
- Test: `apps/web/src/use-cases/get-assessment-history.usecase.test.ts`

**Interfaces:**
- Consumes: `LocalAssessmentStorePort.listAll()` (existing, unchanged), `EncryptionPort.decrypt()`
  (existing, unchanged), `ScoreAssessmentUseCase.execute(scaleType, answers)` (existing,
  unchanged).
- Produces: `GetAssessmentHistoryUseCase` with `execute(): Promise<WeeklyHistoryPoint[]>`, and
  the `WeeklyHistoryPoint` type (`{ weekStart: string; severityFraction: number | null }`) —
  consumed by `useAssessmentHistory` in Task 2. Also exports `startOfIsoWeek(date: Date): Date`
  purely so Task 1's own test can build deterministic fixture dates (not consumed elsewhere).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { GetAssessmentHistoryUseCase, startOfIsoWeek } from "./get-assessment-history.usecase";
import { ScoreAssessmentUseCase } from "./score-assessment.usecase";
import type { EncryptionPort } from "../ports/encryption.port";
import type { LocalAssessmentStorePort } from "../ports/local-assessment-store.port";
import type { AssessmentRecord } from "../domain/assessment-record";

class FakeEncryptionPort implements EncryptionPort {
  async encrypt(plaintext: string): Promise<string> {
    return plaintext;
  }
  async decrypt(ciphertext: string): Promise<string> {
    if (ciphertext === "corrupt") throw new Error("bad ciphertext");
    return ciphertext;
  }
}

class FakeLocalStore implements LocalAssessmentStorePort {
  constructor(private records: AssessmentRecord[]) {}
  async save(): Promise<void> {}
  async listAll(): Promise<AssessmentRecord[]> {
    return this.records;
  }
}

/** Thursday of the week N weeks before the current one — safely mid-week so the fixture
 * never lands on an ISO week boundary regardless of what day the test suite runs on. */
function midWeek(weeksAgo: number): string {
  const start = startOfIsoWeek(new Date());
  start.setUTCDate(start.getUTCDate() - weeksAgo * 7 + 3);
  return start.toISOString();
}

function record(overrides: Partial<AssessmentRecord>): AssessmentRecord {
  return {
    id: "r1",
    scaleType: "PHQ-9",
    capturedAt: midWeek(0),
    ciphertext: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    riskSignal: false,
    ...overrides,
  };
}

function buildUseCase(records: AssessmentRecord[]) {
  return new GetAssessmentHistoryUseCase(
    new FakeLocalStore(records),
    new FakeEncryptionPort(),
    new ScoreAssessmentUseCase(),
  );
}

describe("GetAssessmentHistoryUseCase", () => {
  it("returns 6 weekly buckets with null severity when there is no history", async () => {
    const result = await buildUseCase([]).execute();
    expect(result).toHaveLength(6);
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("decrypts and re-scores this week's record into the last bucket", async () => {
    const useCase = buildUseCase([
      record({ ciphertext: JSON.stringify([1, 1, 1, 0, 0, 0, 0, 0, 0]) }), // PHQ-9 sum=3
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(3 / 27);
    expect(result.slice(0, 5).every((point) => point.severityFraction === null)).toBe(true);
  });

  it("uses GAD-7's own max (21) to compute the severity fraction", async () => {
    const useCase = buildUseCase([
      record({ scaleType: "GAD-7", ciphertext: JSON.stringify([1, 1, 1, 1, 1, 1, 1]) }), // sum=7
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(7 / 21);
  });

  it("keeps only the most recent record when two fall in the same week", async () => {
    const earlier = midWeek(0);
    // One day after `earlier`, still inside the same week bucket — a real time difference,
    // not two records racing on the same millisecond (which a stable sort wouldn't resolve
    // the way this test expects).
    const later = new Date(new Date(earlier).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const useCase = buildUseCase([
      record({ capturedAt: earlier, ciphertext: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0]) }), // score 0
      record({ id: "r2", capturedAt: later, ciphertext: JSON.stringify([3, 3, 3, 3, 3, 3, 3, 3, 3]) }), // score 27
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(27 / 27);
  });

  it("skips a record that fails to decrypt instead of throwing", async () => {
    const result = await buildUseCase([record({ ciphertext: "corrupt" })]).execute();
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("skips MBI-HSS records defensively, since ScoreAssessmentUseCase throws for that scale", async () => {
    const result = await buildUseCase([record({ scaleType: "MBI-HSS" })]).execute();
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("places a record from 3 weeks ago in the correct bucket", async () => {
    const useCase = buildUseCase([
      record({ capturedAt: midWeek(3), ciphertext: JSON.stringify([2, 2, 2, 0, 0, 0, 0, 0, 0]) }), // score 6
    ]);
    const result = await useCase.execute();
    expect(result[2]?.severityFraction).toBeCloseTo(6 / 27);
    expect(result.filter((_, idx) => idx !== 2).every((point) => point.severityFraction === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- --run get-assessment-history`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { LocalAssessmentStorePort } from "../ports/local-assessment-store.port";
import type { EncryptionPort } from "../ports/encryption.port";
import { ScoreAssessmentUseCase } from "./score-assessment.usecase";

export interface WeeklyHistoryPoint {
  weekStart: string;
  severityFraction: number | null;
}

const WEEKS_TO_SHOW = 6;

/** Monday 00:00 UTC of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday(0) -> 7, so Monday(1) is always the start
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

interface ScoredPoint {
  capturedAt: Date;
  severityFraction: number;
}

export class GetAssessmentHistoryUseCase {
  constructor(
    private readonly localStore: LocalAssessmentStorePort,
    private readonly encryption: EncryptionPort,
    private readonly scoreAssessment: ScoreAssessmentUseCase,
  ) {}

  async execute(): Promise<WeeklyHistoryPoint[]> {
    const records = await this.localStore.listAll();
    const scored: ScoredPoint[] = [];

    for (const record of records) {
      if (record.scaleType === "MBI-HSS") continue;
      try {
        const plaintext = await this.encryption.decrypt(record.ciphertext);
        const answers = JSON.parse(plaintext) as number[];
        const { totalScore } = this.scoreAssessment.execute(record.scaleType, answers);
        // record.scaleType is "PHQ-9" | "GAD-7" here (MBI-HSS already skipped above) —
        // a direct ternary avoids relying on narrowing to index a lookup table.
        const max = record.scaleType === "PHQ-9" ? 27 : 21;
        scored.push({ capturedAt: new Date(record.capturedAt), severityFraction: totalScore / max });
      } catch {
        continue;
      }
    }

    return this.bucketIntoWeeks(scored);
  }

  private bucketIntoWeeks(scored: ScoredPoint[]): WeeklyHistoryPoint[] {
    const currentWeekStart = startOfIsoWeek(new Date());
    const buckets: WeeklyHistoryPoint[] = [];

    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      const inWeek = scored
        .filter((point) => point.capturedAt >= weekStart && point.capturedAt < weekEnd)
        .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

      buckets.push({
        weekStart: weekStart.toISOString(),
        severityFraction: inWeek[0]?.severityFraction ?? null,
      });
    }

    return buckets;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- --run get-assessment-history`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/use-cases/get-assessment-history.usecase.ts apps/web/src/use-cases/get-assessment-history.usecase.test.ts
git commit -m "feat(web): add GetAssessmentHistoryUseCase, decrypting + re-scoring local history into weekly buckets"
```

---

## Task 2: Wire real history into `HomePage`

**Files:**
- Modify: `apps/web/src/app/container.ts`
- Create: `apps/web/src/presentation/hooks/useAssessmentHistory.ts`
- Modify: `apps/web/src/presentation/pages/HomePage.tsx`
- Modify: `apps/web/src/presentation/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `GetAssessmentHistoryUseCase` (Task 1), `WeeklyHistoryPoint` (Task 1).
- Produces: `getAssessmentHistoryUseCase` container export, `useAssessmentHistory()` hook —
  neither consumed outside this task, this is the leaf that puts Task 1's use-case on screen.

This task has no independent test file for the hook/container wiring — this codebase's
existing convention (`useSubmitAssessment.ts` has no dedicated test) is that thin
`@tanstack/react-query` wrapper hooks are verified through the page that consumes them, not in
isolation. `HomePage.test.tsx`'s updated assertions are what actually exercises this task's
code, so the TDD cycle below is written against `HomePage.test.tsx`, not a hook-level test.

- [ ] **Step 1: Write the failing test**

Replace `HomePage.test.tsx`'s render helper (to add the `QueryClientProvider` the new
`useQuery`-based hook needs — `Phq9AssessmentPage.test.tsx` already does this for the same
reason) and its history-chart test, and add an empty-state case:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./HomePage";
import * as container from "../../app/container";

function renderHome() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/assessment" element={<div>Assessment select screen</div>} />
          <Route path="/chat" element={<div>Chat screen</div>} />
          <Route path="/peers" element={<div>Peers screen</div>} />
          <Route path="/manager" element={<div>Manager screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SIX_NULL_POINTS = Array.from({ length: 6 }, () => ({ weekStart: "", severityFraction: null }));

describe("HomePage", () => {
  it("renders the greeting, privacy badge, and hero check-in CTA", () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    expect(screen.getByText("Olá.")).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer check-in" })).toBeInTheDocument();
  });

  it("renders 6 neutral bars when there is no history yet", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    const bars = await screen.findAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.every((bar) => bar.className.includes("bg-line"))).toBe(true);
  });

  it("highlights the latest week and the peak week from real history", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue([
      { weekStart: "", severityFraction: null },
      { weekStart: "", severityFraction: 0.2 },
      { weekStart: "", severityFraction: 0.7 }, // peak
      { weekStart: "", severityFraction: null },
      { weekStart: "", severityFraction: 0.3 },
      { weekStart: "", severityFraction: 0.5 }, // latest
    ]);
    renderHome();
    const bars = await screen.findAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.filter((bar) => bar.className.includes("bg-warn"))).toHaveLength(1);
    expect(bars[2]?.className).toContain("bg-warn");
    expect(bars.filter((bar) => bar.className.includes("bg-brand"))).toHaveLength(1);
    expect(bars[5]?.className).toContain("bg-brand");
    expect(bars.filter((bar) => bar.className.includes("bg-line"))).toHaveLength(2);
  });

  it("navigates to /assessment when the hero CTA is tapped", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: "Fazer check-in" }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });

  it("navigates to chat from the quick action card", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: /conversar agora/i }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });

  it("shows Início as the active BottomNav tab", () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zelo/web test -- --run presentation/pages/HomePage`
Expected: FAIL — `container.getAssessmentHistoryUseCase` doesn't exist yet, and `HomePage`
still renders the hardcoded `HISTORY_BARS` (6 bars, but not matching the mocked data's
warn/brand pattern).

- [ ] **Step 3: Write the implementation**

Add to `apps/web/src/app/container.ts` (new import + new export, everything else in the file
unchanged):

```ts
import { GetAssessmentHistoryUseCase } from "../use-cases/get-assessment-history.usecase";
```

```ts
export const getAssessmentHistoryUseCase = new GetAssessmentHistoryUseCase(
  new IndexedDbAssessmentStoreAdapter(),
  new WebCryptoEncryptionAdapter(),
  new ScoreAssessmentUseCase(),
);
```

`apps/web/src/presentation/hooks/useAssessmentHistory.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getAssessmentHistoryUseCase } from "../../app/container";

export function useAssessmentHistory() {
  return useQuery({
    queryKey: ["assessment-history"],
    queryFn: () => getAssessmentHistoryUseCase.execute(),
  });
}
```

`HomePage.tsx` — replace the `HISTORY_BARS`/`PEAK_INDEX`/`LATEST_INDEX` constants and the
history card's rendering:

```tsx
import { MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BottomNav } from "../layout/BottomNav";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { routes } from "../lib/routes";
import { useAssessmentHistory } from "../hooks/useAssessmentHistory";
import type { WeeklyHistoryPoint } from "../../use-cases/get-assessment-history.usecase";

const EMPTY_POINTS: WeeklyHistoryPoint[] = Array.from({ length: 6 }, () => ({
  weekStart: "",
  severityFraction: null,
}));

const MIN_BAR_HEIGHT = 8;
const EMPTY_BAR_HEIGHT = 6;

function toBarHeights(points: WeeklyHistoryPoint[]): { height: number; hasData: boolean }[] {
  return points.map((point) =>
    point.severityFraction === null
      ? { height: EMPTY_BAR_HEIGHT, hasData: false }
      : { height: Math.max(MIN_BAR_HEIGHT, Math.round(point.severityFraction * 100)), hasData: true },
  );
}

function findPeakIndex(points: WeeklyHistoryPoint[]): number {
  let peakIndex = -1;
  let peakValue = -1;
  points.forEach((point, index) => {
    if (point.severityFraction !== null && point.severityFraction > peakValue) {
      peakValue = point.severityFraction;
      peakIndex = index;
    }
  });
  return peakIndex;
}

export function HomePage() {
  const navigate = useNavigate();
  const { data: history } = useAssessmentHistory();
  const points = history ?? EMPTY_POINTS;
  const bars = toBarHeights(points);
  const latestIndex = points.length - 1;
  const peakIndex = findPeakIndex(points);

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
              {bars.map((bar, index) => (
                <div
                  key={index}
                  data-testid="history-bar"
                  className={`w-full rounded-md ${
                    !bar.hasData
                      ? "bg-line"
                      : index === latestIndex
                        ? "bg-brand"
                        : index === peakIndex
                          ? "bg-warn"
                          : "bg-[#CDDBD4]"
                  }`}
                  style={{ height: `${bar.height}%` }}
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
          className="mt-4 min-h-[44px] text-left text-label font-semibold text-muted underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Ver painel do gestor (demo)
        </button>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zelo/web test -- --run presentation/pages/HomePage`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the full test suite and build**

Run: `pnpm --filter @zelo/web test -- --run && pnpm turbo run build --filter=@zelo/web`
Expected: all tests pass; build succeeds. (`pnpm --filter @zelo/web build` alone fails for a
pre-existing, unrelated Turborepo dependency-ordering reason — `@zelo/domain` isn't built
first when invoked that way. Use the `turbo run` form above, which builds `@zelo/domain`
first.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/container.ts apps/web/src/presentation/hooks/useAssessmentHistory.ts apps/web/src/presentation/pages/HomePage.tsx apps/web/src/presentation/pages/HomePage.test.tsx
git commit -m "feat(web): wire HomePage's history chart to real on-device assessment data"
```

---

## Acceptance criteria (whole plan)

- `HomePage`'s history card renders real data derived from the device's own locally-stored,
  encrypted assessment records — no hardcoded array.
- A brand-new device with zero completed assessments renders 6 neutral (`bg-line`) bars, not a
  crash and not fake data.
- A corrupt or undecryptable local record is skipped, not a crash.
- `MBI-HSS` records (which should never exist, since that scale is disabled everywhere) can't
  crash the history view even if one somehow does.
- No backend change. No new network call. `riskSignal` and raw answers still never leave the
  device as part of this feature (unchanged from the existing submit pipeline).
- `PeersPage` and `ManagerDashboardPage` are untouched by this plan.

---

## Self-review notes

- **Spec coverage:** This plan implements exactly the scope approved in conversation — real
  data for `HomePage`'s history chart only. `docs/superpowers/specs/identity-and-aggregation.md`
  covers the design for Peers/Manager but is explicitly not implemented by this plan.
- **Placeholder scan:** none found. The empty-state (all-null) rendering and the
  decrypt-failure/MBI-HSS skip paths are real, tested behavior, not TODOs.
- **Type consistency:** `WeeklyHistoryPoint` (Task 1) is consumed with the exact same shape
  (`weekStart`, `severityFraction`) by `HomePage.tsx` and its test in Task 2 — no renaming
  drift. `startOfIsoWeek` is exported from Task 1 specifically so Task 1's own test can build
  correct fixture dates; nothing outside Task 1's test file imports it.
