# Manager Insight History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every successful "Gerar análise" generation auto-saves to a new `ManagerInsight` table;
managers get a new `/manager/history` screen listing past analyses, each downloadable as PDF or
plain text (client-side, manager's choice).

**Architecture:** Backend: a new Prisma model + repository + a small `GetManagerInsightHistoryUseCase`
inside the existing `apps/api/src/modules/manager/` module; `GenerateManagerInsightUseCase` gets
one addition (save-after-generate, failure-tolerant); a new `GET /manager/insights/history`
endpoint reuses `ManagerAuthGuard`. Frontend: a new port/adapter/use-case/hook mirroring the
existing manager-signals pattern, a new `ManagerInsightHistoryPage` + route, and a client-side
download helper (`jsPDF` for PDF, `Blob` for plain text) in `presentation/lib/`.

**Tech Stack:** NestJS 10, Prisma 7 (Postgres), Zod (backend); React 19, TanStack Query 5, `jsPDF`
(new dependency, frontend only). No other new dependencies.

## Global Constraints

- No new privacy boundary: `ManagerInsight` rows only ever store what `GenerateManagerInsightUseCase`
  already generates from `GetManagerSignalsUseCase`'s existing k≥5-suppressed output — never
  individual data, never raw assessment content.
- Auto-save is automatic on every successful generation — no opt-in action from the manager.
- A save failure must never prevent the generated insight from being returned to the caller —
  log it (via NestJS `Logger`), don't let it propagate as a generation failure.
- No pagination on the history endpoint — return the full list, ordered newest-first.
- Downloads (PDF and plain text) are 100% client-side — no backend endpoint, no new backend
  dependency for this.
- The download helper (`download-manager-insight.ts`) lives in `apps/web/src/presentation/lib/`,
  not `use-cases/` — it touches browser/DOM APIs (`Blob`, anchor elements, `jsPDF`) directly,
  which `use-cases/` must never do (existing boundary rule: use-cases never import React or
  `infrastructure/`).
- History is shared across all managers (single shared login code, no individual accounts) — this
  is accepted, but must be logged as `TD-002` in `docs/superpowers/specs/technical-debt.md`,
  following the exact format of the existing `TD-001` entry.

---

### Task 1: `ManagerInsight` model, migration, port, and repository

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/modules/manager/application/ports/manager-insight-repository.port.ts`
- Create: `apps/api/src/modules/manager/infrastructure/persistence/prisma-manager-insight.repository.ts`

**Interfaces:**
- Produces: `StoredManagerInsight { id: string; interpretation: string; suggestedActions: string[]; summary: string; generatedAt: Date }`;
  `ManagerInsightRepository { save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void>; findAll(): Promise<StoredManagerInsight[]> }`;
  `MANAGER_INSIGHT_REPOSITORY` DI token; `PrismaManagerInsightRepository implements ManagerInsightRepository`.
  Task 2 consumes `ManagerInsightRepository`/`MANAGER_INSIGHT_REPOSITORY`. Task 3 consumes
  `StoredManagerInsight` and wires `PrismaManagerInsightRepository` into the module.

- [ ] **Step 1: Add the `ManagerInsight` model**

Add this model to `apps/api/prisma/schema.prisma`, after the existing `SimulatedSignal` model:

```prisma
model ManagerInsight {
  id               String   @id @default(cuid())
  interpretation   String
  suggestedActions String[]
  summary          String
  generatedAt      DateTime @default(now())

  @@map("manager_insights")
}
```

- [ ] **Step 2: Create the migration**

Run: `pnpm --filter @zelo/api exec prisma migrate dev --name add_manager_insight`
Expected: a new folder appears under `apps/api/prisma/migrations/` (timestamped,
`..._add_manager_insight`) containing a `migration.sql` that creates the `manager_insights`
table; the command ends with "Your database is now in sync with your schema."

- [ ] **Step 3: Regenerate the Prisma client**

Run: `pnpm --filter @zelo/api exec prisma generate`
Expected: "Generated Prisma Client ... to .\generated\prisma" — the generated client now has a
`prisma.managerInsight` model accessor.

- [ ] **Step 4: Add the repository port**

Create `apps/api/src/modules/manager/application/ports/manager-insight-repository.port.ts`:

```ts
export interface StoredManagerInsight {
  id: string;
  interpretation: string;
  suggestedActions: string[];
  summary: string;
  generatedAt: Date;
}

export interface ManagerInsightRepository {
  save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void>;
  findAll(): Promise<StoredManagerInsight[]>;
}

export const MANAGER_INSIGHT_REPOSITORY = Symbol("MANAGER_INSIGHT_REPOSITORY");
```

- [ ] **Step 5: Implement `PrismaManagerInsightRepository`**

Create `apps/api/src/modules/manager/infrastructure/persistence/prisma-manager-insight.repository.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import type { ManagerInsightRepository, StoredManagerInsight } from "../../application/ports/manager-insight-repository.port.ts";
import { PrismaService } from "../../../../shared/prisma/prisma.service.ts";

@Injectable()
export class PrismaManagerInsightRepository implements ManagerInsightRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void> {
    await this.prisma.managerInsight.create({ data: entry });
  }

  async findAll(): Promise<StoredManagerInsight[]> {
    const rows = await this.prisma.managerInsight.findMany({ orderBy: { generatedAt: "desc" } });
    return rows.map((row) => ({
      id: row.id,
      interpretation: row.interpretation,
      suggestedActions: row.suggestedActions,
      summary: row.summary,
      generatedAt: row.generatedAt,
    }));
  }
}
```

No dedicated test file for this repository — matches the existing precedent:
`PrismaSimulatedSignalRepository` also has no dedicated test; it's exercised indirectly through
`manager.controller.test.ts`'s fakes (Task 3 adds the equivalent coverage for this repository).

- [ ] **Step 6: Verify the build compiles**

Run: `pnpm --filter @zelo/api exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations apps/api/src/modules/manager/application/ports/manager-insight-repository.port.ts apps/api/src/modules/manager/infrastructure/persistence/prisma-manager-insight.repository.ts
git commit -m "feat(api): add ManagerInsight model, migration, port, and repository"
```

---

### Task 2: Auto-save on `GenerateManagerInsightUseCase`

**Files:**
- Modify: `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts`
- Modify: `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`

**Interfaces:**
- Consumes: `ManagerInsightRepository`, `MANAGER_INSIGHT_REPOSITORY`, `StoredManagerInsight` (Task 1).
- Produces: `GenerateManagerInsightUseCase`'s constructor now takes a third parameter
  (`ManagerInsightRepository`); its `execute()` signature and return type
  (`Promise<ManagerInsightResponse>`) are unchanged. Task 3's controller test and DI wiring must
  supply this third provider.

- [ ] **Step 1: Read the current file**

Read `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts`
before editing — Step 3 below replaces its full contents.

- [ ] **Step 2: Write the failing tests**

Replace the full contents of
`apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GenerateManagerInsightUseCase } from "./generate-manager-insight.use-case.ts";
import { GetManagerSignalsUseCase } from "./get-manager-signals.use-case.ts";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../ports/simulated-signal-repository.port.ts";
import type { AiInsightPort, ManagerInsightResponse } from "../ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_SYSTEM_PROMPT } from "../prompts/manager-insight-system-prompt.ts";
import type { ManagerInsightRepository, StoredManagerInsight } from "../ports/manager-insight-repository.port.ts";

class FakeSimulatedSignalRepository implements SimulatedSignalRepository {
  constructor(private readonly rows: SimulatedSignalRow[]) {}
  async findAll(): Promise<SimulatedSignalRow[]> {
    return this.rows;
  }
}

class FakeAiInsightPort implements AiInsightPort {
  public lastParams: { summary: string; systemPrompt: string } | null = null;
  constructor(private readonly result: ManagerInsightResponse) {}
  async generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse> {
    this.lastParams = params;
    return this.result;
  }
}

class FakeManagerInsightRepository implements ManagerInsightRepository {
  public savedEntries: { interpretation: string; suggestedActions: string[]; summary: string }[] = [];
  public shouldFailSave = false;
  async save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void> {
    if (this.shouldFailSave) {
      throw new Error("save failed");
    }
    this.savedEntries.push(entry);
  }
  async findAll(): Promise<StoredManagerInsight[]> {
    return [];
  }
}

const WEEK_1 = new Date("2026-06-15T00:00:00.000Z");
const WEEK_2 = new Date("2026-06-22T00:00:00.000Z");

describe("GenerateManagerInsightUseCase", () => {
  it("formats the current ManagerSignalsResponse into a PT-BR summary and forwards it with the system prompt", async () => {
    const signalsRepository = new FakeSimulatedSignalRepository([
      { department: "UTI", weekStart: WEEK_1, checkIns: 10, concerning: 3 },
      { department: "UTI", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
    ]);
    const getManagerSignals = new GetManagerSignalsUseCase(signalsRepository);
    const aiInsight = new FakeAiInsightPort({ interpretation: "texto", suggestedActions: ["ação 1"] });
    const insightRepository = new FakeManagerInsightRepository();
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, aiInsight, insightRepository);

    const result = await useCase.execute();

    expect(result).toEqual({ interpretation: "texto", suggestedActions: ["ação 1"] });
    expect(aiInsight.lastParams?.systemPrompt).toBe(MANAGER_INSIGHT_SYSTEM_PROMPT);
    expect(aiInsight.lastParams?.summary).toContain("Taxa geral de sinais preocupantes: 60%");
    expect(aiInsight.lastParams?.summary).toContain("UTI: 60% (n=10)");
    expect(aiInsight.lastParams?.summary).toContain(
      "Tendência semanal (taxa de sinais preocupantes por semana, 2 semanas): 30%, 60%",
    );
  });

  it("propagates whatever the AiInsightPort throws (e.g. InsightGenerationFailedError from the adapter)", async () => {
    const signalsRepository = new FakeSimulatedSignalRepository([
      { department: "UTI", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
    ]);
    const getManagerSignals = new GetManagerSignalsUseCase(signalsRepository);
    class ThrowingAiInsightPort implements AiInsightPort {
      async generateInsight(): Promise<ManagerInsightResponse> {
        throw new Error("boom");
      }
    }
    const insightRepository = new FakeManagerInsightRepository();
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, new ThrowingAiInsightPort(), insightRepository);

    await expect(useCase.execute()).rejects.toThrow("boom");
    expect(insightRepository.savedEntries).toEqual([]);
  });

  it("saves the generated insight to the repository after a successful generation", async () => {
    const signalsRepository = new FakeSimulatedSignalRepository([
      { department: "UTI", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
    ]);
    const getManagerSignals = new GetManagerSignalsUseCase(signalsRepository);
    const aiInsight = new FakeAiInsightPort({ interpretation: "texto", suggestedActions: ["ação 1"] });
    const insightRepository = new FakeManagerInsightRepository();
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, aiInsight, insightRepository);

    await useCase.execute();

    expect(insightRepository.savedEntries).toEqual([
      { interpretation: "texto", suggestedActions: ["ação 1"], summary: aiInsight.lastParams?.summary },
    ]);
  });

  it("still returns the generated insight even if saving to the repository fails", async () => {
    const signalsRepository = new FakeSimulatedSignalRepository([
      { department: "UTI", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
    ]);
    const getManagerSignals = new GetManagerSignalsUseCase(signalsRepository);
    const aiInsight = new FakeAiInsightPort({ interpretation: "texto", suggestedActions: ["ação 1"] });
    const insightRepository = new FakeManagerInsightRepository();
    insightRepository.shouldFailSave = true;
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, aiInsight, insightRepository);

    const result = await useCase.execute();

    expect(result).toEqual({ interpretation: "texto", suggestedActions: ["ação 1"] });
  });
});
```

- [ ] **Step 3: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`
Expected: FAIL — `GenerateManagerInsightUseCase` constructor takes 2 arguments, tests pass 3
(TypeScript error) / the two new tests fail since `save()` is never called.

- [ ] **Step 4: Implement the auto-save**

Replace the full contents of
`apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts`:

```ts
import { Inject, Injectable, Logger } from "@nestjs/common";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "./get-manager-signals.use-case.ts";
import { AI_INSIGHT_PORT, type AiInsightPort, type ManagerInsightResponse } from "../ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_SYSTEM_PROMPT } from "../prompts/manager-insight-system-prompt.ts";
import { MANAGER_INSIGHT_REPOSITORY, type ManagerInsightRepository } from "../ports/manager-insight-repository.port.ts";

@Injectable()
export class GenerateManagerInsightUseCase {
  private readonly logger = new Logger(GenerateManagerInsightUseCase.name);

  constructor(
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(AI_INSIGHT_PORT) private readonly aiInsight: AiInsightPort,
    @Inject(MANAGER_INSIGHT_REPOSITORY) private readonly insightRepository: ManagerInsightRepository,
  ) {}

  async execute(): Promise<ManagerInsightResponse> {
    const signals = await this.getManagerSignals.execute();
    const summary = this.formatSummary(signals);
    const result = await this.aiInsight.generateInsight({ summary, systemPrompt: MANAGER_INSIGHT_SYSTEM_PROMPT });

    try {
      await this.insightRepository.save({
        interpretation: result.interpretation,
        suggestedActions: result.suggestedActions,
        summary,
      });
    } catch (error) {
      this.logger.error(
        "Failed to save generated manager insight to history",
        error instanceof Error ? error.stack : String(error),
      );
    }

    return result;
  }

  private formatSummary(signals: ManagerSignalsResponse): string {
    const trendLine = signals.weeklyTrend.map((point) => `${Math.round(point.concerningRate * 100)}%`).join(", ");
    const segmentLines = signals.segments
      .map((segment) => `  - ${segment.label}: ${segment.value}% (n=${segment.n})`)
      .join("\n");

    return [
      "Dados agregados da equipe (última semana visível, últimas 6 semanas de tendência):",
      `- Taxa geral de sinais preocupantes: ${Math.round(signals.overallConcerningRate * 100)}%`,
      `- Check-ins nas últimas 4 semanas: ${signals.checkInsLast4Weeks}`,
      `- Tendência semanal (taxa de sinais preocupantes por semana, ${signals.weeklyTrend.length} semanas): ${trendLine}`,
      "- Por setor (apenas setores com 5+ respostas, por privacidade):",
      segmentLines,
    ].join("\n");
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts
git commit -m "feat(api): auto-save generated manager insights, tolerating save failures"
```

---

### Task 3: History endpoint, controller, and module wiring

**Files:**
- Create: `apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.ts`
- Create: `apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.test.ts`
- Modify: `apps/api/src/modules/manager/infrastructure/manager.controller.ts`
- Modify: `apps/api/src/modules/manager/infrastructure/manager.controller.test.ts`
- Modify: `apps/api/src/modules/manager/manager.module.ts`

**Interfaces:**
- Consumes: `ManagerInsightRepository`, `MANAGER_INSIGHT_REPOSITORY`, `StoredManagerInsight`,
  `PrismaManagerInsightRepository` (Task 1); `GenerateManagerInsightUseCase`'s new 3-arg
  constructor (Task 2).
- Produces: working `GET /manager/insights/history` HTTP endpoint returning
  `StoredManagerInsight[]`, newest-first. This is what Task 4's frontend adapter calls.

- [ ] **Step 1: Write the failing use-case test**

Create `apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GetManagerInsightHistoryUseCase } from "./get-manager-insight-history.use-case.ts";
import type { ManagerInsightRepository, StoredManagerInsight } from "../ports/manager-insight-repository.port.ts";

class FakeManagerInsightRepository implements ManagerInsightRepository {
  constructor(private readonly rows: StoredManagerInsight[]) {}
  async save(): Promise<void> {
    throw new Error("not used in this test");
  }
  async findAll(): Promise<StoredManagerInsight[]> {
    return this.rows;
  }
}

describe("GetManagerInsightHistoryUseCase", () => {
  it("returns whatever the repository's findAll() returns, unchanged", async () => {
    const rows: StoredManagerInsight[] = [
      { id: "1", interpretation: "texto 1", suggestedActions: ["ação"], summary: "resumo 1", generatedAt: new Date("2026-07-01T00:00:00.000Z") },
      { id: "2", interpretation: "texto 2", suggestedActions: [], summary: "resumo 2", generatedAt: new Date("2026-06-01T00:00:00.000Z") },
    ];
    const repository = new FakeManagerInsightRepository(rows);
    const useCase = new GetManagerInsightHistoryUseCase(repository);

    const result = await useCase.execute();

    expect(result).toEqual(rows);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/get-manager-insight-history.use-case.test.ts`
Expected: FAIL — `Cannot find module './get-manager-insight-history.use-case.ts'`.

- [ ] **Step 3: Implement `GetManagerInsightHistoryUseCase`**

Create `apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import { MANAGER_INSIGHT_REPOSITORY, type ManagerInsightRepository, type StoredManagerInsight } from "../ports/manager-insight-repository.port.ts";

@Injectable()
export class GetManagerInsightHistoryUseCase {
  constructor(@Inject(MANAGER_INSIGHT_REPOSITORY) private readonly repository: ManagerInsightRepository) {}

  async execute(): Promise<StoredManagerInsight[]> {
    return this.repository.findAll();
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/get-manager-insight-history.use-case.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Extend the controller test with the new endpoint's failing cases**

Replace the full contents of `apps/api/src/modules/manager/infrastructure/manager.controller.test.ts`:

```ts
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import request from "supertest";
import { ManagerController } from "./manager.controller.ts";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";
import { LoginManagerUseCase } from "../application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase } from "../application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "../application/use-cases/generate-manager-insight.use-case.ts";
import { GetManagerInsightHistoryUseCase } from "../application/use-cases/get-manager-insight-history.use-case.ts";
import { ManagerTokenService } from "../application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "../application/ports/simulated-signal-repository.port.ts";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../application/ports/simulated-signal-repository.port.ts";
import { AI_INSIGHT_PORT, InsightGenerationFailedError } from "../application/ports/ai-insight.port.ts";
import type { AiInsightPort, ManagerInsightResponse } from "../application/ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_REPOSITORY } from "../application/ports/manager-insight-repository.port.ts";
import type { ManagerInsightRepository, StoredManagerInsight } from "../application/ports/manager-insight-repository.port.ts";

class FakeSimulatedSignalRepository implements SimulatedSignalRepository {
  public rows: SimulatedSignalRow[] = [];
  async findAll(): Promise<SimulatedSignalRow[]> {
    return this.rows;
  }
}

class FakeAiInsightPort implements AiInsightPort {
  public shouldFail = false;
  async generateInsight(): Promise<ManagerInsightResponse> {
    if (this.shouldFail) {
      throw new InsightGenerationFailedError("simulated failure");
    }
    return { interpretation: "análise de teste", suggestedActions: ["ação de teste"] };
  }
}

class FakeManagerInsightRepository implements ManagerInsightRepository {
  public rows: StoredManagerInsight[] = [];
  async save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void> {
    this.rows.unshift({ id: `id-${this.rows.length + 1}`, generatedAt: new Date(), ...entry });
  }
  async findAll(): Promise<StoredManagerInsight[]> {
    return this.rows;
  }
}

function fakeConfig(): ConfigService {
  const values: Record<string, string> = { MANAGER_ACCESS_CODE: "test-code", MANAGER_TOKEN_SECRET: "test-secret" };
  return { getOrThrow: (key: string) => values[key], get: () => undefined } as unknown as ConfigService;
}

describe("manager controller", () => {
  let app: INestApplication;
  let repository: FakeSimulatedSignalRepository;
  let aiInsightPort: FakeAiInsightPort;
  let insightRepository: FakeManagerInsightRepository;

  beforeAll(async () => {
    repository = new FakeSimulatedSignalRepository();
    aiInsightPort = new FakeAiInsightPort();
    insightRepository = new FakeManagerInsightRepository();
    const moduleRef = await Test.createTestingModule({
      controllers: [ManagerController],
      providers: [
        LoginManagerUseCase,
        GetManagerSignalsUseCase,
        GenerateManagerInsightUseCase,
        GetManagerInsightHistoryUseCase,
        ManagerTokenService,
        ManagerAuthGuard,
        { provide: SIMULATED_SIGNAL_REPOSITORY, useValue: repository },
        { provide: AI_INSIGHT_PORT, useValue: aiInsightPort },
        { provide: MANAGER_INSIGHT_REPOSITORY, useValue: insightRepository },
        { provide: ConfigService, useValue: fakeConfig() },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function getToken(): Promise<string> {
    const login = await request(app.getHttpServer()).post("/manager/login").send({ code: "test-code" });
    return login.body.token;
  }

  it("POST /manager/login returns a token for the correct code", async () => {
    const response = await request(app.getHttpServer()).post("/manager/login").send({ code: "test-code" });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.expiresAt).toEqual(expect.any(String));
  });

  it("POST /manager/login rejects the wrong code with 401", async () => {
    const response = await request(app.getHttpServer()).post("/manager/login").send({ code: "wrong-code" });

    expect(response.status).toBe(401);
  });

  it("POST /manager/login rejects a malformed body with 400", async () => {
    const response = await request(app.getHttpServer()).post("/manager/login").send({});

    expect(response.status).toBe(400);
  });

  it("GET /manager/signals rejects a request with no token", async () => {
    const response = await request(app.getHttpServer()).get("/manager/signals");

    expect(response.status).toBe(401);
  });

  it("GET /manager/signals returns aggregated data for a valid token, suppressing n<5 departments", async () => {
    repository.rows = [
      { department: "A", weekStart: new Date("2026-06-22T00:00:00.000Z"), checkIns: 10, concerning: 6 },
      { department: "Tiny", weekStart: new Date("2026-06-22T00:00:00.000Z"), checkIns: 3, concerning: 1 },
    ];
    const token = await getToken();

    const response = await request(app.getHttpServer()).get("/manager/signals").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.segments).toEqual([{ label: "A", value: 60, n: 10 }]);
  });

  it("POST /manager/insights rejects a request with no token", async () => {
    const response = await request(app.getHttpServer()).post("/manager/insights");

    expect(response.status).toBe(401);
  });

  it("POST /manager/insights returns the structured insight for a valid token", async () => {
    aiInsightPort.shouldFail = false;
    const token = await getToken();

    const response = await request(app.getHttpServer()).post("/manager/insights").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ interpretation: "análise de teste", suggestedActions: ["ação de teste"] });
  });

  it("POST /manager/insights returns 502 when insight generation fails", async () => {
    aiInsightPort.shouldFail = true;
    const token = await getToken();

    const response = await request(app.getHttpServer()).post("/manager/insights").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(502);
    aiInsightPort.shouldFail = false;
  });

  it("GET /manager/insights/history rejects a request with no token", async () => {
    const response = await request(app.getHttpServer()).get("/manager/insights/history");

    expect(response.status).toBe(401);
  });

  it("POST /manager/insights auto-saves to history, visible via GET /manager/insights/history", async () => {
    insightRepository.rows = [];
    aiInsightPort.shouldFail = false;
    const token = await getToken();

    await request(app.getHttpServer()).post("/manager/insights").set("Authorization", `Bearer ${token}`);
    const response = await request(app.getHttpServer())
      .get("/manager/insights/history")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({ interpretation: "análise de teste", suggestedActions: ["ação de teste"] }),
    ]);
  });
});
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/manager.controller.test.ts`
Expected: FAIL on the 2 new `/manager/insights/history` tests (route doesn't exist yet — 404s).
The 8 pre-existing tests still pass.

- [ ] **Step 7: Add the endpoint**

Replace the full contents of `apps/api/src/modules/manager/infrastructure/manager.controller.ts`:

```ts
import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { LoginManagerUseCase, InvalidManagerCodeError } from "../application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "../application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "../application/use-cases/generate-manager-insight.use-case.ts";
import { GetManagerInsightHistoryUseCase } from "../application/use-cases/get-manager-insight-history.use-case.ts";
import { InsightGenerationFailedError, type ManagerInsightResponse } from "../application/ports/ai-insight.port.ts";
import type { StoredManagerInsight } from "../application/ports/manager-insight-repository.port.ts";
import type { IssuedManagerToken } from "../application/services/manager-token.service.ts";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";

const LoginRequestSchema = z.object({ code: z.string().min(1) });

@Controller("manager")
export class ManagerController {
  constructor(
    @Inject(LoginManagerUseCase) private readonly loginManager: LoginManagerUseCase,
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(GenerateManagerInsightUseCase) private readonly generateManagerInsight: GenerateManagerInsightUseCase,
    @Inject(GetManagerInsightHistoryUseCase) private readonly getManagerInsightHistory: GetManagerInsightHistoryUseCase,
  ) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: unknown): IssuedManagerToken {
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    try {
      return this.loginManager.execute(parsed.data.code);
    } catch (error) {
      if (error instanceof InvalidManagerCodeError) {
        throw new UnauthorizedException();
      }
      throw error;
    }
  }

  @Get("signals")
  @UseGuards(ManagerAuthGuard)
  async signals(): Promise<ManagerSignalsResponse> {
    return this.getManagerSignals.execute();
  }

  @Post("insights")
  @HttpCode(200)
  @UseGuards(ManagerAuthGuard)
  async insights(): Promise<ManagerInsightResponse> {
    try {
      return await this.generateManagerInsight.execute();
    } catch (error) {
      if (error instanceof InsightGenerationFailedError) {
        throw new BadGatewayException();
      }
      throw error;
    }
  }

  @Get("insights/history")
  @UseGuards(ManagerAuthGuard)
  async insightsHistory(): Promise<StoredManagerInsight[]> {
    return this.getManagerInsightHistory.execute();
  }
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/manager.controller.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 9: Wire the module**

Replace the full contents of `apps/api/src/modules/manager/manager.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ManagerController } from "./infrastructure/manager.controller.ts";
import { ManagerAuthGuard } from "./infrastructure/manager-auth.guard.ts";
import { PrismaSimulatedSignalRepository } from "./infrastructure/persistence/prisma-simulated-signal.repository.ts";
import { PrismaManagerInsightRepository } from "./infrastructure/persistence/prisma-manager-insight.repository.ts";
import { GroqInsightAdapter } from "./infrastructure/ai-providers/groq-insight.adapter.ts";
import { LoginManagerUseCase } from "./application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase } from "./application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "./application/use-cases/generate-manager-insight.use-case.ts";
import { GetManagerInsightHistoryUseCase } from "./application/use-cases/get-manager-insight-history.use-case.ts";
import { ManagerTokenService } from "./application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "./application/ports/simulated-signal-repository.port.ts";
import { AI_INSIGHT_PORT } from "./application/ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_REPOSITORY } from "./application/ports/manager-insight-repository.port.ts";

@Module({
  controllers: [ManagerController],
  providers: [
    LoginManagerUseCase,
    GetManagerSignalsUseCase,
    GenerateManagerInsightUseCase,
    GetManagerInsightHistoryUseCase,
    ManagerTokenService,
    ManagerAuthGuard,
    { provide: SIMULATED_SIGNAL_REPOSITORY, useClass: PrismaSimulatedSignalRepository },
    { provide: AI_INSIGHT_PORT, useClass: GroqInsightAdapter },
    { provide: MANAGER_INSIGHT_REPOSITORY, useClass: PrismaManagerInsightRepository },
  ],
})
export class ManagerModule {}
```

- [ ] **Step 10: Run the whole backend test suite**

Run: `pnpm --filter @zelo/api test`
Expected: all tests pass (the two pre-existing DB-connectivity-dependent tests,
`prisma.service.test.ts` and `health.controller.test.ts`, may time out in a sandbox with no
reachable Postgres — this is a known, pre-existing environment limitation unrelated to this
task; everything else must pass).

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.ts apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.test.ts apps/api/src/modules/manager/infrastructure/manager.controller.ts apps/api/src/modules/manager/infrastructure/manager.controller.test.ts apps/api/src/modules/manager/manager.module.ts
git commit -m "feat(api): add GET /manager/insights/history endpoint"
```

---

### Task 4: Frontend history port, adapter, use-case, and hook

**Files:**
- Create: `apps/web/src/ports/manager-insight-history.port.ts`
- Create: `apps/web/src/infrastructure/http/http-manager-insight-history.adapter.ts`
- Create: `apps/web/src/use-cases/get-manager-insight-history.usecase.ts`
- Test: `apps/web/src/use-cases/get-manager-insight-history.usecase.test.ts`
- Create: `apps/web/src/presentation/hooks/useManagerInsightHistory.ts`

**Interfaces:**
- Consumes: `UnauthorizedManagerError` (from `apps/web/src/ports/manager-signals.port.ts` —
  reused, not duplicated, same as the existing insight adapter does).
- Produces: `StoredManagerInsight { id: string; interpretation: string; suggestedActions: string[]; summary: string; generatedAt: string }`
  (note: `generatedAt` is a `string` on the frontend — it comes over the wire as an ISO string,
  matching how `weekStart` is typed as `string` in `manager-signals.port.ts`, not `Date`);
  `ManagerInsightHistoryPort { fetchHistory(token: string): Promise<StoredManagerInsight[]> }`;
  `GetManagerInsightHistoryUseCase.execute(token: string): Promise<StoredManagerInsight[]>`;
  `useManagerInsightHistory()` hook (`useQuery`, same token/enabled pattern as
  `useManagerSignals`). Task 5 imports `StoredManagerInsight` from this port. Task 6 consumes
  `useManagerInsightHistory` and `StoredManagerInsight`.

- [ ] **Step 1: Add the port**

Create `apps/web/src/ports/manager-insight-history.port.ts`:

```ts
import { z } from "zod";

export const StoredManagerInsightSchema = z.object({
  id: z.string(),
  interpretation: z.string(),
  suggestedActions: z.array(z.string()),
  summary: z.string(),
  generatedAt: z.string(),
});
export type StoredManagerInsight = z.infer<typeof StoredManagerInsightSchema>;

export interface ManagerInsightHistoryPort {
  fetchHistory(token: string): Promise<StoredManagerInsight[]>;
}
```

- [ ] **Step 2: Add the HTTP adapter**

Create `apps/web/src/infrastructure/http/http-manager-insight-history.adapter.ts`:

```ts
import type { ManagerInsightHistoryPort, StoredManagerInsight } from "../../ports/manager-insight-history.port";
import { StoredManagerInsightSchema } from "../../ports/manager-insight-history.port";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpManagerInsightHistoryAdapter implements ManagerInsightHistoryPort {
  async fetchHistory(token: string): Promise<StoredManagerInsight[]> {
    const response = await fetch(`${API_BASE_URL}/manager/insights/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      throw new UnauthorizedManagerError();
    }
    if (!response.ok) {
      throw new Error(`manager insight history fetch failed with status ${response.status}`);
    }

    const body = await response.json();
    return StoredManagerInsightSchema.array().parse(body);
  }
}
```

- [ ] **Step 3: Write the failing use-case test**

Create `apps/web/src/use-cases/get-manager-insight-history.usecase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GetManagerInsightHistoryUseCase } from "./get-manager-insight-history.usecase";
import type { ManagerInsightHistoryPort, StoredManagerInsight } from "../ports/manager-insight-history.port";

class FakeManagerInsightHistoryPort implements ManagerInsightHistoryPort {
  constructor(private readonly rows: StoredManagerInsight[]) {}
  async fetchHistory(): Promise<StoredManagerInsight[]> {
    return this.rows;
  }
}

describe("GetManagerInsightHistoryUseCase", () => {
  it("returns whatever the port's fetchHistory() returns", async () => {
    const rows: StoredManagerInsight[] = [
      { id: "1", interpretation: "texto", suggestedActions: ["ação"], summary: "resumo", generatedAt: "2026-07-01T00:00:00.000Z" },
    ];
    const useCase = new GetManagerInsightHistoryUseCase(new FakeManagerInsightHistoryPort(rows));

    const result = await useCase.execute("valid-token");

    expect(result).toEqual(rows);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @zelo/web exec vitest run src/use-cases/get-manager-insight-history.usecase.test.ts`
Expected: FAIL — `Cannot find module './get-manager-insight-history.usecase'`.

- [ ] **Step 5: Implement the use-case**

Create `apps/web/src/use-cases/get-manager-insight-history.usecase.ts`:

```ts
import type { ManagerInsightHistoryPort, StoredManagerInsight } from "../ports/manager-insight-history.port";

export class GetManagerInsightHistoryUseCase {
  constructor(private readonly historyPort: ManagerInsightHistoryPort) {}

  async execute(token: string): Promise<StoredManagerInsight[]> {
    return this.historyPort.fetchHistory(token);
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @zelo/web exec vitest run src/use-cases/get-manager-insight-history.usecase.test.ts`
Expected: PASS (1 test).

- [ ] **Step 7: Add the hook**

Create `apps/web/src/presentation/hooks/useManagerInsightHistory.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getManagerInsightHistoryUseCase } from "../../app/container";
import { useManagerSessionStore } from "../../stores/manager-session.store";

export function useManagerInsightHistory() {
  const token = useManagerSessionStore((state) => state.token);

  return useQuery({
    queryKey: ["manager-insight-history", token],
    queryFn: () => getManagerInsightHistoryUseCase.execute(token!),
    enabled: token !== null,
    retry: false,
  });
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/ports/manager-insight-history.port.ts apps/web/src/infrastructure/http/http-manager-insight-history.adapter.ts apps/web/src/use-cases/get-manager-insight-history.usecase.ts apps/web/src/use-cases/get-manager-insight-history.usecase.test.ts apps/web/src/presentation/hooks/useManagerInsightHistory.ts
git commit -m "feat(web): add manager insight history port, adapter, use-case, and hook"
```

---

### Task 5: Client-side PDF/text download helper

**Files:**
- Modify: `apps/web/package.json` (add `jspdf` dependency)
- Create: `apps/web/src/presentation/lib/download-manager-insight.ts`
- Test: `apps/web/src/presentation/lib/download-manager-insight.test.ts`

**Interfaces:**
- Consumes: `StoredManagerInsight` (Task 4).
- Produces: `downloadInsightAsText(entry: StoredManagerInsight): void`,
  `downloadInsightAsPdf(entry: StoredManagerInsight): void`. Task 6's page wires both to
  download buttons.

- [ ] **Step 1: Add the `jspdf` dependency**

Run: `pnpm --filter @zelo/web add jspdf`
Expected: `apps/web/package.json`'s `dependencies` now includes a `"jspdf"` entry, and
`pnpm-lock.yaml` is updated.

- [ ] **Step 2: Write the failing tests**

Create `apps/web/src/presentation/lib/download-manager-insight.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const { textMock, saveMock, setFontSizeMock, splitTextToSizeMock } = vi.hoisted(() => ({
  textMock: vi.fn(),
  saveMock: vi.fn(),
  setFontSizeMock: vi.fn(),
  splitTextToSizeMock: vi.fn((text: string) => [text]),
}));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    text: textMock,
    setFontSize: setFontSizeMock,
    splitTextToSize: splitTextToSizeMock,
    save: saveMock,
  })),
}));

import { downloadInsightAsPdf, downloadInsightAsText } from "./download-manager-insight";
import type { StoredManagerInsight } from "../../ports/manager-insight-history.port";

const ENTRY: StoredManagerInsight = {
  id: "abc123",
  interpretation: "texto de interpretação",
  suggestedActions: ["ação 1", "ação 2"],
  summary: "resumo dos dados",
  generatedAt: "2026-07-01T00:00:00.000Z",
};

describe("downloadInsightAsPdf", () => {
  beforeEach(() => {
    textMock.mockClear();
    saveMock.mockClear();
    splitTextToSizeMock.mockClear();
  });

  it("writes the interpretation and suggested actions into the PDF and saves it", () => {
    downloadInsightAsPdf(ENTRY);

    expect(splitTextToSizeMock).toHaveBeenCalledWith("texto de interpretação", 180);
    expect(textMock).toHaveBeenCalledWith(["texto de interpretação"], 14, 40);
    expect(textMock).toHaveBeenCalledWith("- ação 1", 14, 78);
    expect(textMock).toHaveBeenCalledWith("- ação 2", 14, 86);
    expect(saveMock).toHaveBeenCalledWith("analise-zelo-abc123.pdf");
  });
});

describe("downloadInsightAsText", () => {
  it("builds a text blob with the interpretation and actions and triggers a download", () => {
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn();
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }
    const createObjectURLMock = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        element.click = clickSpy;
      }
      return element;
    });

    downloadInsightAsText(ENTRY);

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe("text/plain;charset=utf-8");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");

    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/lib/download-manager-insight.test.ts`
Expected: FAIL — `Cannot find module './download-manager-insight'`.

- [ ] **Step 4: Implement the download helper**

Create `apps/web/src/presentation/lib/download-manager-insight.ts`:

```ts
import { jsPDF } from "jspdf";
import type { StoredManagerInsight } from "../../ports/manager-insight-history.port";

function formatDate(generatedAt: string): string {
  return new Date(generatedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadInsightAsText(entry: StoredManagerInsight): void {
  const lines = [
    "Análise com IA — Zelo",
    formatDate(entry.generatedAt),
    "",
    entry.interpretation,
    "",
    "Ações sugeridas:",
    ...entry.suggestedActions.map((action) => `- ${action}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `analise-zelo-${entry.id}.txt`);
}

export function downloadInsightAsPdf(entry: StoredManagerInsight): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Análise com IA — Zelo", 14, 20);
  doc.setFontSize(11);
  doc.text(formatDate(entry.generatedAt), 14, 28);
  doc.text(doc.splitTextToSize(entry.interpretation, 180), 14, 40);
  doc.text("Ações sugeridas:", 14, 70);
  entry.suggestedActions.forEach((action, index) => {
    doc.text(`- ${action}`, 14, 78 + index * 8);
  });
  doc.save(`analise-zelo-${entry.id}.pdf`);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/lib/download-manager-insight.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/presentation/lib/download-manager-insight.ts apps/web/src/presentation/lib/download-manager-insight.test.ts
git commit -m "feat(web): add client-side PDF/text download for manager insights"
```

---

### Task 6: History screen, routing, dashboard link, and technical-debt entry

**Files:**
- Modify: `apps/web/src/app/container.ts`
- Modify: `apps/web/src/presentation/lib/routes.ts`
- Modify: `apps/web/src/presentation/lib/routes.test.ts`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`
- Create: `apps/web/src/presentation/pages/ManagerInsightHistoryPage.tsx`
- Test: `apps/web/src/presentation/pages/ManagerInsightHistoryPage.test.tsx`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`
- Modify: `apps/web/src/presentation/pages/a11y.test.tsx`
- Modify: `docs/superpowers/specs/routing-and-state.md`
- Modify: `docs/superpowers/specs/technical-debt.md`

**Interfaces:**
- Consumes: `useManagerInsightHistory` (Task 4), `downloadInsightAsPdf`/`downloadInsightAsText`
  (Task 5), `StoredManagerInsight` (Task 4).
- Produces: working `/manager/history` screen, reachable from `ManagerDashboardPage`.

- [ ] **Step 1: Wire the container**

Edit `apps/web/src/app/container.ts`, adding these two imports near the existing manager imports:

```ts
import { GetManagerInsightHistoryUseCase } from "../use-cases/get-manager-insight-history.usecase";
import { HttpManagerInsightHistoryAdapter } from "../infrastructure/http/http-manager-insight-history.adapter";
```

And this export at the end of the file:

```ts
export const getManagerInsightHistoryUseCase = new GetManagerInsightHistoryUseCase(new HttpManagerInsightHistoryAdapter());
```

- [ ] **Step 2: Add the route constant**

Edit `apps/web/src/presentation/lib/routes.ts` — add `managerHistory` after `managerLogin`:

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
  managerHistory: "/manager/history",
} as const;
```

- [ ] **Step 3: Update `routes.test.ts`**

In `apps/web/src/presentation/lib/routes.test.ts`, replace the `it("matches the route table in routing-and-state.md", ...)` test's `expect(routes).toEqual({...})` object to add the new key:

```ts
  it("matches the route table in routing-and-state.md", () => {
    expect(routes).toEqual({
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
      managerHistory: "/manager/history",
    });
  });
```

- [ ] **Step 4: Run the routes test to verify it passes**

Steps 2 and 3 are a single atomic change (a constant and the literal-equality test that checks
it) — there's no meaningful RED state for adding one key to a plain object, so both are edited
together rather than test-first.

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/lib/routes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing history page test**

Create `apps/web/src/presentation/pages/ManagerInsightHistoryPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerInsightHistoryPage } from "./ManagerInsightHistoryPage";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import * as container from "../../app/container";
import * as downloadHelper from "../lib/download-manager-insight";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

function renderHistory() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/manager/history"]}>
        <Routes>
          <Route path="/manager/history" element={<ManagerInsightHistoryPage />} />
          <Route path="/manager" element={<div>Manager dashboard screen</div>} />
          <Route path="/manager/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const HISTORY_RESPONSE = [
  {
    id: "1",
    interpretation: "A UTI mostra um padrão de aumento nos sinais.",
    suggestedActions: ["Agendar conversa com a liderança da UTI"],
    summary: "resumo 1",
    generatedAt: "2026-07-06T00:00:00.000Z",
  },
  {
    id: "2",
    interpretation: "Padrão estável na última semana.",
    suggestedActions: ["Acompanhar de perto"],
    summary: "resumo 2",
    generatedAt: "2026-06-29T00:00:00.000Z",
  },
];

describe("ManagerInsightHistoryPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useManagerSessionStore.setState({ token: "abc.def", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    vi.spyOn(container.getManagerInsightHistoryUseCase, "execute").mockResolvedValue(HISTORY_RESPONSE);
  });

  it("renders past analyses newest-first", async () => {
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("A UTI mostra um padrão de aumento nos sinais.")).toBeInTheDocument();
    });
    expect(screen.getByText("Padrão estável na última semana.")).toBeInTheDocument();
    expect(screen.getByText("Agendar conversa com a liderança da UTI")).toBeInTheDocument();
  });

  it("triggers a PDF download when 'Baixar PDF' is clicked for an entry", async () => {
    const pdfSpy = vi.spyOn(downloadHelper, "downloadInsightAsPdf").mockImplementation(() => {});
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("A UTI mostra um padrão de aumento nos sinais.")).toBeInTheDocument();
    });
    const pdfButtons = screen.getAllByRole("button", { name: "Baixar PDF" });
    await user.click(pdfButtons[0]);

    expect(pdfSpy).toHaveBeenCalledWith(HISTORY_RESPONSE[0]);
  });

  it("triggers a plain-text download when 'Baixar texto' is clicked for an entry", async () => {
    const textSpy = vi.spyOn(downloadHelper, "downloadInsightAsText").mockImplementation(() => {});
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("A UTI mostra um padrão de aumento nos sinais.")).toBeInTheDocument();
    });
    const textButtons = screen.getAllByRole("button", { name: "Baixar texto" });
    await user.click(textButtons[0]);

    expect(textSpy).toHaveBeenCalledWith(HISTORY_RESPONSE[0]);
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();
    renderHistory();

    await user.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getByText("Manager dashboard screen")).toBeInTheDocument();
  });

  it("clears the session and redirects to login on a 401", async () => {
    vi.spyOn(container.getManagerInsightHistoryUseCase, "execute").mockRejectedValue(new UnauthorizedManagerError());
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("Login screen")).toBeInTheDocument();
    });
    expect(useManagerSessionStore.getState().token).toBeNull();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerInsightHistoryPage.test.tsx`
Expected: FAIL — `Cannot find module './ManagerInsightHistoryPage'`.

- [ ] **Step 7: Implement `ManagerInsightHistoryPage`**

Create `apps/web/src/presentation/pages/ManagerInsightHistoryPage.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { SectionLabel } from "../ui/SectionLabel";
import { routes } from "../lib/routes";
import { useManagerInsightHistory } from "../hooks/useManagerInsightHistory";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";
import { downloadInsightAsPdf, downloadInsightAsText } from "../lib/download-manager-insight";

function formatDate(generatedAt: string): string {
  return new Date(generatedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
}

export function ManagerInsightHistoryPage() {
  const navigate = useNavigate();
  const clearSession = useManagerSessionStore((state) => state.clearSession);
  const { data, error, isError } = useManagerInsightHistory();

  useEffect(() => {
    if (isError && error instanceof UnauthorizedManagerError) {
      clearSession();
      navigate(routes.managerLogin, { replace: true });
    }
  }, [isError, error, clearSession, navigate]);

  const entries = data ?? [];

  return (
    <PhoneShell bg="canvas-alt">
      <div className="pt-[26px]">
        <BackButton label="Voltar" onClick={() => navigate(routes.manager)} />
        <div className="mt-4">
          <SectionLabel>Painel do gestor</SectionLabel>
        </div>
        <h1 className="mt-2 text-h2 text-ink">Histórico de análises</h1>
        <p className="mt-1 text-caption text-muted">
          Análises geradas anteriormente, da mais recente para a mais antiga.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <p className="font-mono text-[12px] text-muted-2">{formatDate(entry.generatedAt)}</p>
              <p className="mt-2 text-label text-ink-2">{entry.interpretation}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {entry.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-label text-ink-2">
                    <span className="text-brand">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" full={false} onClick={() => downloadInsightAsPdf(entry)}>
                  Baixar PDF
                </Button>
                <Button variant="outline" full={false} onClick={() => downloadInsightAsText(entry)}>
                  Baixar texto
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerInsightHistoryPage.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 9: Add the route**

Edit `apps/web/src/app/router.tsx` — add the import:

```ts
import { ManagerInsightHistoryPage } from "../presentation/pages/ManagerInsightHistoryPage";
```

And add this route object to `routeChildren`, right after the existing `manager` route entry:

```ts
  {
    path: "manager/history",
    Component: ManagerInsightHistoryPage,
    loader: () => (useManagerSessionStore.getState().isValid() ? null : redirect(routes.managerLogin)),
  },
```

- [ ] **Step 10: Add a router test for the new route's guard**

Add this test to `apps/web/src/app/router.test.tsx`, in the same `describe` block, after the
existing `"an authenticated manager session reaches the dashboard directly"` test:

```tsx
  it("an unauthenticated visit to /manager/history redirects to the manager login screen", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });

    buildTestRouter("/manager/history");

    expect(await screen.findByText("Acesso do gestor")).toBeInTheDocument();
  });
```

- [ ] **Step 11: Run the router test**

Run: `pnpm --filter @zelo/web exec vitest run src/app/router.test.tsx`
Expected: PASS (all tests, including the new one).

- [ ] **Step 12: Add the failing test for the dashboard's history link**

Add this test to `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`, in the
`describe("ManagerDashboardPage", ...)` block, after the existing `"navigates to /home on back"`
test:

```tsx
  it("navigates to /manager/history via 'Ver histórico'", async () => {
    const user = userEvent.setup();
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("link", { name: "Ver histórico" }));

    expect(screen.getByText("History screen")).toBeInTheDocument();
  });
```

Also update `renderManager()`'s `<Routes>` block in the same file to add a route for
`/manager/history`:

```tsx
function renderManager() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/manager"]}>
        <Routes>
          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/login" element={<div>Login screen</div>} />
          <Route path="/manager/history" element={<div>History screen</div>} />
          <Route path="/home" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
```

- [ ] **Step 13: Run the test to verify the new one fails**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: FAIL on the new test (no "Ver histórico" link exists yet). The 5 pre-existing tests
still pass.

- [ ] **Step 14: Add the "Ver histórico" link to `ManagerDashboardPage`**

Edit `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`. Add `Link` to the `react-router`
import:

```tsx
import { Link, useNavigate } from "react-router";
```

Then, inside the "Análise com IA" `Card` (the last `<div className="mt-[14px]">...</div>` block),
add a "Ver histórico" link right after the `<p className="text-body font-extrabold text-ink">Análise com IA</p>`
line:

```tsx
        <div className="mt-[14px]">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-body font-extrabold text-ink">Análise com IA</p>
              <Link to={routes.managerHistory} className="text-label font-bold text-brand">
                Ver histórico
              </Link>
            </div>
            {!insight.data && (
```

(This replaces the existing single `<p>` line with a `flex items-center justify-between` wrapper
containing both the `<p>` and the new `<Link>` — everything else in that card block is
unchanged.)

- [ ] **Step 15: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 16: Add the new screen to the a11y pass**

Edit `apps/web/src/presentation/pages/a11y.test.tsx` — add the import:

```ts
import { ManagerInsightHistoryPage } from "./ManagerInsightHistoryPage";
```

And add this entry to the `SCREENS` array, right after the `ManagerDashboard` entry:

```ts
  { name: "ManagerInsightHistory", Component: ManagerInsightHistoryPage, path: "/manager/history" },
```

- [ ] **Step 17: Run the full frontend test suite**

Run: `pnpm --filter @zelo/web test`
Expected: all tests pass.

- [ ] **Step 18: Run the full monorepo build**

Run: `pnpm turbo run build --filter=@zelo/web --filter=@zelo/api`
Expected: both build cleanly, no type errors.

- [ ] **Step 19: Update `routing-and-state.md`**

In `docs/superpowers/specs/routing-and-state.md`, add a new row to the route table, right after
the existing `/manager` row (near line 29):

```
| `/manager/history` | `ManagerInsightHistoryPage` | Past AI-generated analyses, newest first; each downloadable as PDF or plain text (see `2026-07-12-manager-insight-history-design.md`) |
```

And update the `routes.ts` snippet shown later in the doc (near line 116) to include the new
key, appending `, managerHistory: "/manager/history"` after the existing `managerLogin:
"/manager/login"` in that inline code snippet.

- [ ] **Step 20: Add the `TD-002` technical-debt entry**

Add this section to `docs/superpowers/specs/technical-debt.md`, after the existing `TD-001`
entry:

```markdown
## TD-002: Manager insight history is shared across all managers, not per-manager

- **Date:** 2026-07-12
- **Area:** `apps/api/src/modules/manager/application/use-cases/get-manager-insight-history.use-case.ts`,
  `apps/web/src/presentation/pages/ManagerInsightHistoryPage.tsx`
- **Status:** Accepted, deferred

**Decision.** `GET /manager/insights/history` returns every saved `ManagerInsight` row to any
manager who authenticates — there is no per-manager scoping.

**Why this is safe today.** Manager auth is a single shared institutional code, not individual
accounts (see `identity-and-aggregation.md` — a full `User`/`Role.MANAGER` model was explicitly
deferred). Every manager who has the code represents the same institution, and every saved
insight is already anonymous, k-anonymized aggregate data — sharing it isn't a privacy issue, it's
a UX limitation: one institution's history, not one person's.

**Revisit when:** individual manager logins are built (per `identity-and-aggregation.md`'s
deferred `User` model). At that point, `ManagerInsight` should gain a manager/team-scoping field
and `GetManagerInsightHistoryUseCase` should filter by the authenticated manager's team, so each
manager sees only their own team's saved analyses.
```

- [ ] **Step 21: Commit**

```bash
git add apps/web/src/app/container.ts apps/web/src/presentation/lib/routes.ts apps/web/src/presentation/lib/routes.test.ts apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/presentation/pages/ManagerInsightHistoryPage.tsx apps/web/src/presentation/pages/ManagerInsightHistoryPage.test.tsx apps/web/src/presentation/pages/ManagerDashboardPage.tsx apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx apps/web/src/presentation/pages/a11y.test.tsx docs/superpowers/specs/routing-and-state.md docs/superpowers/specs/technical-debt.md
git commit -m "feat(web): add manager insight history screen, routing, and technical-debt entry"
```
