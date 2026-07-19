# Follow-up Mechanism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the follow-up KPI the ACM named as an evaluation criterion (`prd.md` FR-17, `user-stories.md` US-009) as two decoupled pieces: (A) a new fabricated aggregate metric on the manager dashboard, and (B) a local, on-device re-engagement prompt on Home.

**Architecture:** (A) mirrors the existing `SimulatedSignal` pipeline exactly (Prisma model → repository → use-case → controller → web port → dashboard card) with a sibling table and port. (B) is a pure use-case plus a Zustand `persist` store (same pattern as `manager-session.store.ts`), read by `HomePage`. Per the design spec §2, (A) and (B) never call into each other.

**Tech Stack:** NestJS + Prisma (API), React + Zustand + TanStack Query (web), Vitest everywhere, Supertest for the controller test.

## Global Constraints

- (A)'s new metric is computed from the **most recent seeded week only**, same convention `overallConcerningRate`/`segments` already use in `GetManagerSignalsUseCase`.
- (A) must return `0` (not `NaN`/`Infinity`) when the most recent week's `sent` is `0`.
- (B) writes only to `localStorage` (via Zustand `persist`) — no network call, no server write, ever.
- (B)'s prompt logic and (A)'s aggregate must not import from each other or share any module.
- `FOLLOWUP_INTERVAL_DAYS = 3` (design spec §5) — a named constant, not a magic number, in `should-show-followup-prompt.usecase.ts`.

---

### Task 1: `SimulatedFollowUp` Prisma model + seed data

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/prisma/seed-data.ts`
- Modify: `apps/api/prisma/seed-data.test.ts`
- Modify: `apps/api/prisma/seed.ts`
- Modify: `apps/api/prisma/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `SimulatedFollowUpSeedRow { weekStart: Date; sent: number; responded: number }` and `buildFollowUpSeedRows(referenceDate: Date): SimulatedFollowUpSeedRow[]` — Task 2's repository test and the seed script both import this.

- [ ] **Step 1: Write the failing test**

Append to `apps/api/prisma/seed-data.test.ts`:

```ts
import { buildFollowUpSeedRows } from "./seed-data.ts";

describe("buildFollowUpSeedRows", () => {
  const reference = new Date("2026-07-08T12:00:00.000Z"); // a Wednesday, week of 2026-07-06

  it("produces exactly 6 weeks of rows", () => {
    expect(buildFollowUpSeedRows(reference)).toHaveLength(6);
  });

  it("the most recent week's rate is neither 0% nor 100% (demo credibility)", () => {
    const rows = buildFollowUpSeedRows(reference).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    const mostRecent = rows[rows.length - 1]!;
    const rate = mostRecent.responded / mostRecent.sent;
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1);
  });

  it("the most recent week's weekStart is the Monday of the reference date's week", () => {
    const rows = buildFollowUpSeedRows(reference).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    expect(rows[rows.length - 1]!.weekStart.toISOString()).toBe("2026-07-06T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run prisma/seed-data.test.ts`
Expected: FAIL — `buildFollowUpSeedRows` is not exported yet.

- [ ] **Step 3: Write minimal implementation**

Append to `apps/api/prisma/seed-data.ts` (reuses the existing `startOfIsoWeek` already exported in this file):

```ts
export interface SimulatedFollowUpSeedRow {
  weekStart: Date;
  sent: number;
  responded: number;
}

const FOLLOW_UP_WEEKS_TO_SEED = 6;
// oldest week first; last entry is the current week. Chosen to read as a believable,
// improving-but-imperfect response rate for the demo (see seed-data.test.ts).
const FOLLOW_UP_SCENARIO: { sent: number; responded: number }[] = [
  { sent: 20, responded: 9 },
  { sent: 22, responded: 11 },
  { sent: 25, responded: 13 },
  { sent: 26, responded: 15 },
  { sent: 28, responded: 17 },
  { sent: 30, responded: 21 },
];

export function buildFollowUpSeedRows(referenceDate: Date): SimulatedFollowUpSeedRow[] {
  const currentWeekStart = startOfIsoWeek(referenceDate);
  const rows: SimulatedFollowUpSeedRow[] = [];

  for (let i = 0; i < FOLLOW_UP_WEEKS_TO_SEED; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - (FOLLOW_UP_WEEKS_TO_SEED - 1 - i) * 7);
    rows.push({ weekStart, sent: FOLLOW_UP_SCENARIO[i]!.sent, responded: FOLLOW_UP_SCENARIO[i]!.responded });
  }

  return rows;
}
```

Add the Prisma model to `apps/api/prisma/schema.prisma` (append after `SimulatedSignal`):

```prisma
model SimulatedFollowUp {
  id         String   @id @default(cuid())
  weekStart  DateTime
  sent       Int
  responded  Int
  createdAt  DateTime @default(now())

  @@unique([weekStart])
  @@map("simulated_follow_ups")
}
```

Update `apps/api/prisma/seed.ts` to also seed the new table:

```ts
import { PrismaService } from "../src/shared/prisma/prisma.service.ts";
import { buildSeedRows, buildFollowUpSeedRows } from "./seed-data.ts";

async function main() {
  const prisma = new PrismaService();
  const rows = buildSeedRows(new Date());
  const followUpRows = buildFollowUpSeedRows(new Date());

  await prisma.simulatedSignal.deleteMany();
  await prisma.simulatedSignal.createMany({ data: rows });

  await prisma.simulatedFollowUp.deleteMany();
  await prisma.simulatedFollowUp.createMany({ data: followUpRows });

  console.log(`Seeded ${rows.length} SimulatedSignal rows and ${followUpRows.length} SimulatedFollowUp rows.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Add a short section to `apps/api/prisma/README.md` (after the existing k-anonymity paragraph), documenting the new table using the same voice as the existing doc: what it seeds, that it's fabricated, and where the scenario table lives (`seed-data.ts`'s `FOLLOW_UP_SCENARIO`).

Generate and run the migration:

Run: `cd apps/api && npx prisma migrate dev --name add_simulated_follow_up`
Expected: a new `apps/api/prisma/migrations/<timestamp>_add_simulated_follow_up/` folder is created and applied to the local dev database without errors.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npx vitest run prisma/seed-data.test.ts`
Expected: PASS (all `buildSeedRows` tests plus the 3 new `buildFollowUpSeedRows` tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/seed-data.ts apps/api/prisma/seed-data.test.ts apps/api/prisma/seed.ts apps/api/prisma/README.md apps/api/prisma/migrations
git commit -m "feat: add SimulatedFollowUp model and seed data for follow-up KPI"
```

---

### Task 2: `followUpResponseRate` in `GetManagerSignalsUseCase`

**Files:**
- Create: `apps/api/src/modules/manager/application/ports/simulated-follow-up-repository.port.ts`
- Create: `apps/api/src/modules/manager/infrastructure/persistence/prisma-simulated-follow-up.repository.ts`
- Modify: `apps/api/src/modules/manager/application/use-cases/get-manager-signals.use-case.ts`
- Modify: `apps/api/src/modules/manager/application/use-cases/get-manager-signals.use-case.test.ts`
- Modify: `apps/api/src/modules/manager/manager.module.ts`
- Modify: `apps/api/src/modules/manager/infrastructure/manager.controller.test.ts`

**Interfaces:**
- Consumes: `SimulatedFollowUp` Prisma model (Task 1).
- Produces: `ManagerSignalsResponse.followUpResponseRate: number` — Task 3's web schema and dashboard card consume this exact field name.

- [ ] **Step 1: Write the failing test**

Append to `apps/api/src/modules/manager/application/use-cases/get-manager-signals.use-case.test.ts` (new import + new `FakeSimulatedFollowUpRepository`, then new `describe` block; also update every existing `new GetManagerSignalsUseCase(repository)` call in this file to `new GetManagerSignalsUseCase(repository, followUpRepository)` — the constructor is gaining a required second argument):

```ts
import type { SimulatedFollowUpRepository, SimulatedFollowUpRow } from "../ports/simulated-follow-up-repository.port.ts";

class FakeSimulatedFollowUpRepository implements SimulatedFollowUpRepository {
  constructor(private readonly rows: SimulatedFollowUpRow[]) {}
  async findAll(): Promise<SimulatedFollowUpRow[]> {
    return this.rows;
  }
}

describe("GetManagerSignalsUseCase - followUpResponseRate", () => {
  it("computes the rate from the most recent week only", async () => {
    const repository = new FakeSimulatedSignalRepository([]);
    const followUpRepository = new FakeSimulatedFollowUpRepository([
      { weekStart: WEEK_1, sent: 20, responded: 5 },
      { weekStart: WEEK_2, sent: 20, responded: 15 },
    ]);
    const useCase = new GetManagerSignalsUseCase(repository, followUpRepository);

    const result = await useCase.execute();

    expect(result.followUpResponseRate).toBe(0.75); // WEEK_2 (most recent): 15/20
  });

  it("returns 0, not NaN, when the most recent week's sent is 0", async () => {
    const repository = new FakeSimulatedSignalRepository([]);
    const followUpRepository = new FakeSimulatedFollowUpRepository([{ weekStart: WEEK_2, sent: 0, responded: 0 }]);
    const useCase = new GetManagerSignalsUseCase(repository, followUpRepository);

    const result = await useCase.execute();

    expect(result.followUpResponseRate).toBe(0);
  });

  it("returns 0 when there is no follow-up data at all", async () => {
    const repository = new FakeSimulatedSignalRepository([]);
    const followUpRepository = new FakeSimulatedFollowUpRepository([]);
    const useCase = new GetManagerSignalsUseCase(repository, followUpRepository);

    const result = await useCase.execute();

    expect(result.followUpResponseRate).toBe(0);
  });
});
```

Every existing `new GetManagerSignalsUseCase(repository)` call earlier in this same file must become `new GetManagerSignalsUseCase(repository, new FakeSimulatedFollowUpRepository([]))` — the constructor signature is changing for everyone, not just the new tests.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run src/modules/manager/application/use-cases/get-manager-signals.use-case.test.ts`
Expected: FAIL (TypeScript error: `GetManagerSignalsUseCase` expects 1 argument, or `followUpResponseRate` is `undefined`).

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/src/modules/manager/application/ports/simulated-follow-up-repository.port.ts`:

```ts
export interface SimulatedFollowUpRow {
  weekStart: Date;
  sent: number;
  responded: number;
}

export interface SimulatedFollowUpRepository {
  findAll(): Promise<SimulatedFollowUpRow[]>;
}

export const SIMULATED_FOLLOW_UP_REPOSITORY = Symbol("SIMULATED_FOLLOW_UP_REPOSITORY");
```

Create `apps/api/src/modules/manager/infrastructure/persistence/prisma-simulated-follow-up.repository.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import type { SimulatedFollowUpRepository, SimulatedFollowUpRow } from "../../application/ports/simulated-follow-up-repository.port.ts";
import { PrismaService } from "../../../../shared/prisma/prisma.service.ts";

@Injectable()
export class PrismaSimulatedFollowUpRepository implements SimulatedFollowUpRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<SimulatedFollowUpRow[]> {
    const rows = await this.prisma.simulatedFollowUp.findMany();
    return rows.map((row) => ({ weekStart: row.weekStart, sent: row.sent, responded: row.responded }));
  }
}
```

Modify `get-manager-signals.use-case.ts` — add the import, constructor parameter, interface field, and computation:

```ts
import { Inject, Injectable } from "@nestjs/common";
import { K_ANONYMITY_THRESHOLD } from "../constants.ts";
import {
  SIMULATED_SIGNAL_REPOSITORY,
  type SimulatedSignalRepository,
  type SimulatedSignalRow,
} from "../ports/simulated-signal-repository.port.ts";
import {
  SIMULATED_FOLLOW_UP_REPOSITORY,
  type SimulatedFollowUpRepository,
} from "../ports/simulated-follow-up-repository.port.ts";

export interface ManagerSignalsResponse {
  overallConcerningRate: number;
  checkInsLast4Weeks: number;
  weeklyTrend: { weekStart: string; concerningRate: number }[];
  segments: { label: string; value: number; n: number }[];
  followUpResponseRate: number;
}

const RECENT_WEEKS_FOR_VOLUME = 4;

@Injectable()
export class GetManagerSignalsUseCase {
  constructor(
    @Inject(SIMULATED_SIGNAL_REPOSITORY) private readonly repository: SimulatedSignalRepository,
    @Inject(SIMULATED_FOLLOW_UP_REPOSITORY) private readonly followUpRepository: SimulatedFollowUpRepository,
  ) {}

  async execute(): Promise<ManagerSignalsResponse> {
    const rows = await this.repository.findAll();
    const followUpResponseRate = await this.computeFollowUpResponseRate();

    if (rows.length === 0) {
      return { overallConcerningRate: 0, checkInsLast4Weeks: 0, weeklyTrend: [], segments: [], followUpResponseRate };
    }

    const weekTimes = [...new Set(rows.map((r) => r.weekStart.getTime()))].sort((a, b) => a - b);
    const mostRecentWeek = weekTimes[weekTimes.length - 1]!;

    const byDepartment = new Map<string, SimulatedSignalRow[]>();
    for (const row of rows) {
      const list = byDepartment.get(row.department) ?? [];
      list.push(row);
      byDepartment.set(row.department, list);
    }

    const segments: { label: string; value: number; n: number }[] = [];
    let visibleConcerning = 0;
    let visibleCheckIns = 0;

    for (const [department, deptRows] of byDepartment) {
      const currentWeekRow = deptRows.find((r) => r.weekStart.getTime() === mostRecentWeek);
      if (!currentWeekRow || currentWeekRow.checkIns < K_ANONYMITY_THRESHOLD) continue;

      segments.push({
        label: department,
        value: Math.round((currentWeekRow.concerning / currentWeekRow.checkIns) * 100),
        n: currentWeekRow.checkIns,
      });
      visibleConcerning += currentWeekRow.concerning;
      visibleCheckIns += currentWeekRow.checkIns;
    }

    const overallConcerningRate = visibleCheckIns === 0 ? 0 : visibleConcerning / visibleCheckIns;

    const recentWeekTimes = new Set(weekTimes.slice(-RECENT_WEEKS_FOR_VOLUME));
    const checkInsLast4Weeks = rows
      .filter((r) => recentWeekTimes.has(r.weekStart.getTime()))
      .reduce((sum, r) => sum + r.checkIns, 0);

    const weeklyTrend = weekTimes.map((weekTime) => {
      const weekRows = rows.filter((r) => r.weekStart.getTime() === weekTime);
      const totalCheckIns = weekRows.reduce((sum, r) => sum + r.checkIns, 0);
      const totalConcerning = weekRows.reduce((sum, r) => sum + r.concerning, 0);
      return {
        weekStart: new Date(weekTime).toISOString(),
        concerningRate: totalCheckIns === 0 ? 0 : totalConcerning / totalCheckIns,
      };
    });

    return { overallConcerningRate, checkInsLast4Weeks, weeklyTrend, segments, followUpResponseRate };
  }

  private async computeFollowUpResponseRate(): Promise<number> {
    const rows = await this.followUpRepository.findAll();
    if (rows.length === 0) return 0;

    const mostRecent = rows.reduce((latest, row) => (row.weekStart > latest.weekStart ? row : latest));
    return mostRecent.sent === 0 ? 0 : mostRecent.responded / mostRecent.sent;
  }
}
```

Update `apps/api/src/modules/manager/manager.module.ts` to provide the new repository:

```ts
import { PrismaSimulatedFollowUpRepository } from "./infrastructure/persistence/prisma-simulated-follow-up.repository.ts";
import { SIMULATED_FOLLOW_UP_REPOSITORY } from "./application/ports/simulated-follow-up-repository.port.ts";
```

and add `{ provide: SIMULATED_FOLLOW_UP_REPOSITORY, useClass: PrismaSimulatedFollowUpRepository }` to the `providers` array, alongside the existing `SIMULATED_SIGNAL_REPOSITORY` entry.

Update `manager.controller.test.ts`: import `SIMULATED_FOLLOW_UP_REPOSITORY` and a `FakeSimulatedFollowUpRepository` (same trivial shape as the signal one), instantiate it in `beforeAll`, and add `{ provide: SIMULATED_FOLLOW_UP_REPOSITORY, useValue: followUpRepository }` to the `providers` array passed to `Test.createTestingModule` — otherwise Nest's DI container fails to resolve `GetManagerSignalsUseCase`'s new constructor dependency and every test in this file breaks.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npx vitest run src/modules/manager`
Expected: PASS — all existing `get-manager-signals.use-case.test.ts` tests (updated constructor calls), the 3 new `followUpResponseRate` tests, and `manager.controller.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/manager
git commit -m "feat: compute followUpResponseRate in GetManagerSignalsUseCase"
```

---

### Task 3: Web — surface `followUpResponseRate` on the manager dashboard

**Files:**
- Modify: `apps/web/src/ports/manager-signals.port.ts`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`

**Interfaces:**
- Consumes: `ManagerSignalsResponse.followUpResponseRate` (Task 2, same field name, crosses the HTTP boundary via `ManagerSignalsResponseSchema`).
- Produces: nothing for later tasks (leaf).

- [ ] **Step 1: Write the failing test**

`ManagerDashboardPage.test.tsx` mocks `container.getManagerSignalsUseCase.execute` directly (via `vi.spyOn`) to resolve a top-level `SIGNALS_RESPONSE` fixture object, and renders through its existing `renderManager()` helper. Add `followUpResponseRate: 0.7` to that `SIGNALS_RESPONSE` object, then add:

```tsx
it("renders the follow-up response rate KPI card", async () => {
  renderManager();
  await waitFor(() => {
    expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
  });
  expect(screen.getByText("70%")).toBeInTheDocument();
  expect(screen.getByText("taxa de resposta do follow-up")).toBeInTheDocument();
});

it("labels the existing check-ins card as questionários respondidos", async () => {
  renderManager();
  await waitFor(() => {
    expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
  });
  expect(screen.getByText("questionários respondidos (4 semanas)")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: FAIL — neither string exists in the current component, and `SIGNALS_RESPONSE.followUpResponseRate` is `undefined` until Step 3.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/src/ports/manager-signals.port.ts`, add the field to the schema:

```ts
export const ManagerSignalsResponseSchema = z.object({
  overallConcerningRate: z.number(),
  checkInsLast4Weeks: z.number(),
  weeklyTrend: z.array(z.object({ weekStart: z.string(), concerningRate: z.number() })),
  segments: z.array(z.object({ label: z.string(), value: z.number(), n: z.number() })),
  followUpResponseRate: z.number(),
});
```

In `ManagerDashboardPage.tsx`: relabel the second KPI card's caption and add a third card. Replace:

```tsx
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-brand">{checkInsLast4Weeks}</p>
            <p className="text-caption text-muted">check-ins nas últimas 4 semanas</p>
          </Card>
        </div>
```

with:

```tsx
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-brand">{checkInsLast4Weeks}</p>
            <p className="text-caption text-muted">questionários respondidos (4 semanas)</p>
          </Card>
        </div>

        <div className="mt-3">
          <Card className="text-center">
            <p className="font-serif text-[30px] text-brand">{Math.round(followUpResponseRate * 100)}%</p>
            <p className="text-caption text-muted">taxa de resposta do follow-up</p>
          </Card>
        </div>
```

and add the destructuring line alongside the existing ones:

```ts
  const followUpResponseRate = data?.followUpResponseRate ?? 0;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ports/manager-signals.port.ts apps/web/src/presentation/pages/ManagerDashboardPage.tsx apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx
git commit -m "feat: show follow-up response rate KPI on manager dashboard"
```

---

### Task 4: `ShouldShowFollowUpPromptUseCase`

**Files:**
- Create: `apps/web/src/use-cases/should-show-followup-prompt.usecase.ts`
- Test: `apps/web/src/use-cases/should-show-followup-prompt.usecase.test.ts`

**Interfaces:**
- Consumes: `WeeklyHistoryPoint[]` shape is not actually needed here — this use case takes the raw most-recent-assessment date directly (simpler, avoids importing the history-bucketing type for a concern that doesn't need weekly buckets). See Task 6 for how `HomePage` supplies that date.
- Produces: `ShouldShowFollowUpPromptUseCase.execute(input: { mostRecentAssessmentAt: Date | null; alreadyAnswered: boolean; now: Date }): boolean` — Task 6 imports this signature directly.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { ShouldShowFollowUpPromptUseCase, FOLLOWUP_INTERVAL_DAYS } from "./should-show-followup-prompt.usecase";

describe("ShouldShowFollowUpPromptUseCase", () => {
  const useCase = new ShouldShowFollowUpPromptUseCase();
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("returns false when there is no assessment yet", () => {
    expect(useCase.execute({ mostRecentAssessmentAt: null, alreadyAnswered: false, now })).toBe(false);
  });

  it(`returns false when fewer than ${FOLLOWUP_INTERVAL_DAYS} days have passed`, () => {
    const recent = new Date(now);
    recent.setUTCDate(recent.getUTCDate() - (FOLLOWUP_INTERVAL_DAYS - 1));
    expect(useCase.execute({ mostRecentAssessmentAt: recent, alreadyAnswered: false, now })).toBe(false);
  });

  it(`returns true when at least ${FOLLOWUP_INTERVAL_DAYS} days have passed and no answer yet`, () => {
    const old = new Date(now);
    old.setUTCDate(old.getUTCDate() - FOLLOWUP_INTERVAL_DAYS);
    expect(useCase.execute({ mostRecentAssessmentAt: old, alreadyAnswered: false, now })).toBe(true);
  });

  it("returns false when already answered, regardless of elapsed time", () => {
    const old = new Date(now);
    old.setUTCDate(old.getUTCDate() - FOLLOWUP_INTERVAL_DAYS - 10);
    expect(useCase.execute({ mostRecentAssessmentAt: old, alreadyAnswered: true, now })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/use-cases/should-show-followup-prompt.usecase.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// Resolves US-009's open question (exact follow-up interval) for the hackathon PoC —
// see docs/superpowers/specs/2026-07-19-followup-mechanism-design.md §5 for why 3 days.
export const FOLLOWUP_INTERVAL_DAYS = 3;

export interface ShouldShowFollowUpPromptInput {
  mostRecentAssessmentAt: Date | null;
  alreadyAnswered: boolean;
  now: Date;
}

export class ShouldShowFollowUpPromptUseCase {
  execute({ mostRecentAssessmentAt, alreadyAnswered, now }: ShouldShowFollowUpPromptInput): boolean {
    if (alreadyAnswered || mostRecentAssessmentAt === null) return false;

    const elapsedMs = now.getTime() - mostRecentAssessmentAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    return elapsedDays >= FOLLOWUP_INTERVAL_DAYS;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/use-cases/should-show-followup-prompt.usecase.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/use-cases/should-show-followup-prompt.usecase.ts apps/web/src/use-cases/should-show-followup-prompt.usecase.test.ts
git commit -m "feat: add ShouldShowFollowUpPromptUseCase (3-day local re-engagement check)"
```

---

### Task 5: `useFollowUpStore` (local, persisted answer)

**Files:**
- Create: `apps/web/src/stores/followup.store.ts`
- Test: `apps/web/src/stores/followup.store.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `useFollowUpStore` with state `{ answer: "yes" | "no" | null; answeredAt: string | null }` and actions `recordAnswer(answer: "yes" | "no"): void` — Task 6 imports `useFollowUpStore` directly.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { useFollowUpStore } from "./followup.store";

describe("useFollowUpStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useFollowUpStore.setState({ answer: null, answeredAt: null });
  });

  it("starts with no answer", () => {
    expect(useFollowUpStore.getState().answer).toBeNull();
  });

  it("recordAnswer persists the answer to localStorage", () => {
    useFollowUpStore.getState().recordAnswer("yes");

    expect(useFollowUpStore.getState().answer).toBe("yes");
    expect(useFollowUpStore.getState().answeredAt).not.toBeNull();

    const persisted = JSON.parse(localStorage.getItem("zelo.followup")!);
    expect(persisted.state.answer).toBe("yes");
  });

  it("recordAnswer('no') is stored distinctly from 'yes'", () => {
    useFollowUpStore.getState().recordAnswer("no");
    expect(useFollowUpStore.getState().answer).toBe("no");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/stores/followup.store.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FollowUpState {
  answer: "yes" | "no" | null;
  answeredAt: string | null;
  recordAnswer: (answer: "yes" | "no") => void;
}

export const useFollowUpStore = create<FollowUpState>()(
  persist(
    (set) => ({
      answer: null,
      answeredAt: null,
      recordAnswer: (answer) => set({ answer, answeredAt: new Date().toISOString() }),
    }),
    { name: "zelo.followup", storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/stores/followup.store.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/followup.store.ts apps/web/src/stores/followup.store.test.ts
git commit -m "feat: add local-only followup.store for the Home re-engagement prompt"
```

---

### Task 6: Wire the prompt into `HomePage`

**Files:**
- Modify: `apps/web/src/presentation/pages/HomePage.tsx`
- Modify: `apps/web/src/presentation/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `ShouldShowFollowUpPromptUseCase` (Task 4), `useFollowUpStore` (Task 5), `useAssessmentHistory()` (existing — its `WeeklyHistoryPoint[]` gives the most recent non-null week; see implementation below for how the exact assessment date is derived from it).
- Produces: nothing for later tasks (leaf).

- [ ] **Step 1: Write the failing test**

`HomePage.test.tsx` mocks `container.getAssessmentHistoryUseCase.execute` directly (via `vi.spyOn`, same convention as `ManagerDashboardPage.test.tsx`), resolving an array of `{ weekStart, severityFraction }` points. Add the import and a `beforeEach` at the top of the `describe` block, then two new tests using a fixture whose most recent populated week is old enough to trigger the prompt:

```tsx
import { useFollowUpStore } from "../../stores/followup.store";

// inside describe("HomePage", () => { ... }), before the existing `it` blocks:
beforeEach(() => {
  localStorage.clear();
  useFollowUpStore.setState({ answer: null, answeredAt: null });
});

const OLD_ENOUGH_WEEK_START = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 10); // well past FOLLOWUP_INTERVAL_DAYS (3)
  return d.toISOString();
})();

it("shows the follow-up prompt when the most recent assessment is old enough and unanswered", async () => {
  vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue([
    { weekStart: OLD_ENOUGH_WEEK_START, severityFraction: 0.4 },
  ]);
  renderHome();
  expect(await screen.findByText("Como você está, um tempo depois?")).toBeInTheDocument();
});

it("hides the prompt after answering, and does not write to any network", async () => {
  vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue([
    { weekStart: OLD_ENOUGH_WEEK_START, severityFraction: 0.4 },
  ]);
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const user = userEvent.setup();
  renderHome();
  await screen.findByText("Como você está, um tempo depois?");
  await user.click(screen.getByRole("button", { name: "Estou bem" }));
  expect(screen.queryByText("Como você está, um tempo depois?")).not.toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/presentation/pages/HomePage.test.tsx`
Expected: FAIL — no follow-up prompt exists yet.

- [ ] **Step 3: Write minimal implementation**

In `HomePage.tsx`, add the imports and a small derivation + render block. Add near the top:

```tsx
import { ShouldShowFollowUpPromptUseCase } from "../../use-cases/should-show-followup-prompt.usecase";
import { useFollowUpStore } from "../../stores/followup.store";

const shouldShowFollowUpPromptUseCase = new ShouldShowFollowUpPromptUseCase();

function mostRecentAssessmentDate(points: WeeklyHistoryPoint[]): Date | null {
  const withData = points.filter((p) => p.severityFraction !== null && p.weekStart !== "");
  if (withData.length === 0) return null;
  return new Date(withData[withData.length - 1]!.weekStart);
}
```

Inside the `HomePage` component, alongside the existing `points`/`bars` derivations:

```tsx
  const answer = useFollowUpStore((state) => state.answer);
  const recordAnswer = useFollowUpStore((state) => state.recordAnswer);
  const showFollowUpPrompt = shouldShowFollowUpPromptUseCase.execute({
    mostRecentAssessmentAt: mostRecentAssessmentDate(points),
    alreadyAnswered: answer !== null,
    now: new Date(),
  });
```

And render the card, placed above the existing history chart card (exact JSX position: right after the header block, before whatever the first existing `<Card>` is — check the file's current structure before inserting):

```tsx
        {showFollowUpPrompt && (
          <div className="mt-4">
            <Card>
              <p className="text-body font-extrabold text-ink">Como você está, um tempo depois?</p>
              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={() => recordAnswer("yes")}>
                  Estou bem
                </Button>
                <Button variant="outline" onClick={() => recordAnswer("no")}>
                  Não estou bem
                </Button>
              </div>
            </Card>
          </div>
        )}
```

`Card` and `Button` are already imported in this file if it already uses them elsewhere (`ManagerDashboardPage.tsx` pattern) — if `HomePage.tsx` does not yet import `Button`, add `import { Button } from "../ui/Button";` alongside the existing `Card` import.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/presentation/pages/HomePage.test.tsx`
Expected: PASS

Then run the full web suite once:

Run: `cd apps/web && npx vitest run`
Expected: PASS, no regressions from the new imports/state.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/pages/HomePage.tsx apps/web/src/presentation/pages/HomePage.test.tsx
git commit -m "feat: show local follow-up re-engagement prompt on Home"
```

---

## Self-review notes (already applied above)

- **Spec coverage:** design spec §3-4 (A) → Tasks 1-3; §5 (B) → Tasks 4-6; §6 acceptance criteria are each asserted by at least one test above (most-recent-week-only, 0-not-NaN, relabeled caption, 3rd KPI card, prompt visibility conditions, no network on answer).
- **Type consistency:** `SimulatedFollowUpRow`/`SimulatedFollowUpRepository` (Task 2) match between the port, the Prisma repository, and the fake used in tests. `ShouldShowFollowUpPromptUseCase.execute`'s input shape (Task 4) matches exactly how Task 6 calls it. `useFollowUpStore`'s `answer`/`recordAnswer` names (Task 5) match Task 6's usage.
- **No placeholders:** every step has complete code. The one open real-world dependency — exact mock shape for `useAssessmentHistory` in Task 6 — is explicitly flagged as "check the existing file first," not silently guessed, because guessing wrong here would be worse than a documented check.
