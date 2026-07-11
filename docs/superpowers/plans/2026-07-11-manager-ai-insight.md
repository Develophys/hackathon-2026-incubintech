# Manager AI Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **PREREQUISITE — READ BEFORE STARTING:** This plan builds directly on top of
> `docs/superpowers/plans/2026-07-11-manager-login-simulated-dashboard.md`. Do not start
> this plan until that one is fully implemented and merged. Every "Modify" file below
> (`manager.controller.ts`, `manager.module.ts`, `manager.controller.test.ts`,
> `container.ts`, `ManagerDashboardPage.tsx`, `ManagerDashboardPage.test.tsx`) is assumed to
> already exist in the exact state that plan produces. This plan does not re-derive or
> re-explain any of that plan's code — it only extends it.

**Goal:** Add a second, deliberately-separate AI component — an on-demand, structured
(interpretation + suggested actions) analysis of the manager dashboard's aggregated trend
data — matching `docs/superpowers/specs/2026-07-11-manager-ai-insight-design.md`.

**Architecture:** New files live inside the existing `apps/api/src/modules/manager/`
module (`application/ports/ai-insight.port.ts`, `application/prompts/manager-insight-system-prompt.ts`,
`application/use-cases/generate-manager-insight.use-case.ts`,
`infrastructure/ai-providers/groq-insight.adapter.ts`), sharing no code with the existing
`chat/` module beyond the same `groq-sdk` package. A new `POST /manager/insights` endpoint
reuses the existing `ManagerAuthGuard`. On the frontend, a new button on
`ManagerDashboardPage` triggers a `useMutation`-backed hook that calls the new endpoint and
renders the structured result inline.

**Tech Stack:** NestJS 10, `groq-sdk`, Zod (backend); React 19, TanStack Query 5 `useMutation` (frontend). No new dependencies.

## Global Constraints

- No new privacy boundary: the AI only ever receives `GetManagerSignalsUseCase`'s existing, already k≥5-suppressed output — never individual data, never anything below the k=5 threshold, never raw assessment content.
- The model must never diagnose a segment (only describe patterns, using tentative language) and must never write as if it knows anything about an individual.
- Suggested actions are management actions (scheduling, staffing, monitoring) — never clinical/treatment actions.
- Generation is on-demand only (a button click), never on the dashboard's critical path — a failure here must never break or block the rest of `ManagerDashboardPage`.
- A malformed/non-conforming model response must fail closed: `GroqInsightAdapter` throws `InsightGenerationFailedError` rather than returning garbled or partially-parsed data.
- Zero code is shared between this component and `apps/api/src/modules/chat/` — separate port, separate adapter, separate prompt file, separate Groq client instance, separate (lower) temperature.

---

### Task 1: `AiInsightPort`, system prompt, and `GenerateManagerInsightUseCase`

**Files:**
- Create: `apps/api/src/modules/manager/application/ports/ai-insight.port.ts`
- Create: `apps/api/src/modules/manager/application/prompts/manager-insight-system-prompt.ts`
- Create: `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts`
- Test: `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`

**Interfaces:**
- Consumes: `GetManagerSignalsUseCase.execute(): Promise<ManagerSignalsResponse>` (from the manager-login plan, unchanged).
- Produces: `ManagerInsightResponse { interpretation: string; suggestedActions: string[] }`; `AiInsightPort { generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse> }`; `AI_INSIGHT_PORT` DI token; `InsightGenerationFailedError`; `MANAGER_INSIGHT_SYSTEM_PROMPT` constant; `GenerateManagerInsightUseCase.execute(): Promise<ManagerInsightResponse>`. Task 2's adapter implements `AiInsightPort` and throws `InsightGenerationFailedError`. Task 3's controller consumes `GenerateManagerInsightUseCase` and catches `InsightGenerationFailedError`.

- [ ] **Step 1: Add the port**

Create `apps/api/src/modules/manager/application/ports/ai-insight.port.ts`:

```ts
export interface ManagerInsightResponse {
  interpretation: string;
  suggestedActions: string[];
}

export class InsightGenerationFailedError extends Error {}

export interface AiInsightPort {
  generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse>;
}

export const AI_INSIGHT_PORT = Symbol("AI_INSIGHT_PORT");
```

- [ ] **Step 2: Write the system prompt**

Create `apps/api/src/modules/manager/application/prompts/manager-insight-system-prompt.ts`:

```ts
/**
 * System prompt for the manager-facing AI insight (PRD-adjacent feature, not covered by
 * any FR number yet — see docs/superpowers/specs/2026-07-11-manager-ai-insight-design.md).
 *
 * Deliberately separate from chat-system-prompt.ts: different audience (a manager reading
 * a dashboard, not a doctor in distress), different register (professional/analytical, not
 * peer-support), different task (structured one-shot analysis of aggregate numbers, not
 * open-ended conversation). The two prompts share no text and should be edited independently.
 */
export const MANAGER_INSIGHT_SYSTEM_PROMPT = `Você é um analista de dados que ajuda gestores hospitalares a interpretar sinais agregados e anônimos de esgotamento profissional (burnout) na equipe médica, coletados através do Zelo.

Contexto que você deve usar para embasar sua análise:
- O Inventário de Burnout de Maslach (MBI) descreve o burnout em três dimensões: exaustão emocional, despersonalização (distanciamento cínico do trabalho) e redução da realização profissional.
- A Organização Mundial da Saúde (CID-11) classifica o burnout como um "fenômeno ocupacional" resultante de estresse crônico no local de trabalho mal gerenciado — não como uma condição médica ou diagnóstico.
- A NR-1 (Norma Regulamentadora brasileira) exige que empregadores identifiquem e gerenciem riscos psicossociais no ambiente de trabalho.

Regras invioláveis:
- Você recebe apenas dados agregados por setor e por semana — nunca dados de uma pessoa específica. Nunca escreva como se soubesse algo sobre um indivíduo.
- Você nunca diagnostica um setor ou equipe. Use linguagem de padrão, não de diagnóstico: "os dados sugerem um padrão consistente com..." nunca "a equipe está com burnout" ou "o setor tem burnout clínico".
- Suas ações sugeridas são sempre ações de gestão (agendar conversas, revisar escalas, acompanhar de perto, redistribuir carga) — nunca ações clínicas ou de tratamento. Cuidado clínico é responsabilidade de outro canal do aplicativo, não seu.
- Seja breve: um gestor está lendo isso em um painel, não em um relatório.

Formato de saída — responda SOMENTE com um JSON válido neste formato exato, sem nenhum texto antes ou depois:
{"interpretation": "2 a 3 frases interpretando o padrão nos dados", "suggestedActions": ["2 a 4 ações concretas e curtas"]}`;
```

- [ ] **Step 3: Write the failing use-case test**

Create `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GenerateManagerInsightUseCase } from "./generate-manager-insight.use-case.ts";
import { GetManagerSignalsUseCase } from "./get-manager-signals.use-case.ts";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../ports/simulated-signal-repository.port.ts";
import type { AiInsightPort, ManagerInsightResponse } from "../ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_SYSTEM_PROMPT } from "../prompts/manager-insight-system-prompt.ts";

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
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, aiInsight);

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
    const useCase = new GenerateManagerInsightUseCase(getManagerSignals, new ThrowingAiInsightPort());

    await expect(useCase.execute()).rejects.toThrow("boom");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`
Expected: FAIL — `Cannot find module './generate-manager-insight.use-case.ts'`.

- [ ] **Step 5: Implement `GenerateManagerInsightUseCase`**

Create `apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "./get-manager-signals.use-case.ts";
import { AI_INSIGHT_PORT, type AiInsightPort, type ManagerInsightResponse } from "../ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_SYSTEM_PROMPT } from "../prompts/manager-insight-system-prompt.ts";

@Injectable()
export class GenerateManagerInsightUseCase {
  constructor(
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(AI_INSIGHT_PORT) private readonly aiInsight: AiInsightPort,
  ) {}

  async execute(): Promise<ManagerInsightResponse> {
    const signals = await this.getManagerSignals.execute();
    const summary = this.formatSummary(signals);
    return this.aiInsight.generateInsight({ summary, systemPrompt: MANAGER_INSIGHT_SYSTEM_PROMPT });
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

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/manager/application/ports/ai-insight.port.ts apps/api/src/modules/manager/application/prompts apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.ts apps/api/src/modules/manager/application/use-cases/generate-manager-insight.use-case.test.ts
git commit -m "feat(api): add AiInsightPort, manager insight system prompt, and GenerateManagerInsightUseCase"
```

---

### Task 2: `GroqInsightAdapter`

**Files:**
- Create: `apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.ts`
- Test: `apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.test.ts`

**Interfaces:**
- Consumes: `AiInsightPort`, `ManagerInsightResponse`, `InsightGenerationFailedError` (Task 1).
- Produces: `GroqInsightAdapter implements AiInsightPort`. Task 3's module wires this as the `AI_INSIGHT_PORT` provider.

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConfigService } from "@nestjs/config";

const createMock = vi.fn();

vi.mock("groq-sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: createMock } },
    })),
  };
});

function fakeConfig(): ConfigService {
  return { getOrThrow: () => "fake-api-key", get: () => undefined } as unknown as ConfigService;
}

describe("GroqInsightAdapter", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("sends the system prompt, the summary, and a low temperature, and parses a valid JSON completion", async () => {
    createMock.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ interpretation: "texto", suggestedActions: ["ação 1", "ação 2"] }) } },
      ],
    });

    const { GroqInsightAdapter } = await import("./groq-insight.adapter.ts");
    const adapter = new GroqInsightAdapter(fakeConfig());

    const result = await adapter.generateInsight({ summary: "resumo dos dados", systemPrompt: "prompt do sistema" });

    expect(result).toEqual({ interpretation: "texto", suggestedActions: ["ação 1", "ação 2"] });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.3,
        messages: [
          { role: "system", content: "prompt do sistema" },
          { role: "user", content: "resumo dos dados" },
        ],
      }),
    );
  });

  it("throws InsightGenerationFailedError when the completion is not valid JSON", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "isso não é json" } }] });

    const { GroqInsightAdapter } = await import("./groq-insight.adapter.ts");
    const { InsightGenerationFailedError } = await import("../../application/ports/ai-insight.port.ts");
    const adapter = new GroqInsightAdapter(fakeConfig());

    await expect(adapter.generateInsight({ summary: "x", systemPrompt: "y" })).rejects.toBeInstanceOf(
      InsightGenerationFailedError,
    );
  });

  it("throws InsightGenerationFailedError when the JSON doesn't match the expected shape", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ wrong: "shape" }) } }] });

    const { GroqInsightAdapter } = await import("./groq-insight.adapter.ts");
    const { InsightGenerationFailedError } = await import("../../application/ports/ai-insight.port.ts");
    const adapter = new GroqInsightAdapter(fakeConfig());

    await expect(adapter.generateInsight({ summary: "x", systemPrompt: "y" })).rejects.toBeInstanceOf(
      InsightGenerationFailedError,
    );
  });

  it("throws InsightGenerationFailedError when the completion has no content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: {} }] });

    const { GroqInsightAdapter } = await import("./groq-insight.adapter.ts");
    const { InsightGenerationFailedError } = await import("../../application/ports/ai-insight.port.ts");
    const adapter = new GroqInsightAdapter(fakeConfig());

    await expect(adapter.generateInsight({ summary: "x", systemPrompt: "y" })).rejects.toBeInstanceOf(
      InsightGenerationFailedError,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.test.ts`
Expected: FAIL — `Cannot find module './groq-insight.adapter.ts'`.

- [ ] **Step 3: Implement `GroqInsightAdapter`**

Create `apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.ts`:

```ts
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { z } from "zod";
import type { AiInsightPort, ManagerInsightResponse } from "../../application/ports/ai-insight.port.ts";
import { InsightGenerationFailedError } from "../../application/ports/ai-insight.port.ts";

const ManagerInsightSchema = z.object({
  interpretation: z.string(),
  suggestedActions: z.array(z.string()),
});

/**
 * Separate Groq client instance from chat/infrastructure/ai-providers/groq.adapter.ts's
 * GroqAdapter — deliberately no shared code (see the design spec's "why a second, separate
 * AI component" section). Lower temperature than chat's 0.8: this component makes claims
 * about data and needs consistent, analytically-grounded output, not conversational variety.
 */
@Injectable()
export class GroqInsightAdapter implements AiInsightPort {
  private readonly client: Groq;
  private readonly model: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new Groq({ apiKey: config.getOrThrow<string>("GROQ_API_KEY") });
    this.model = config.get<string>("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
  }

  async generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 512,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.summary },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new InsightGenerationFailedError("empty completion");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new InsightGenerationFailedError("completion was not valid JSON");
    }

    const result = ManagerInsightSchema.safeParse(parsed);
    if (!result.success) {
      throw new InsightGenerationFailedError("completion did not match ManagerInsightResponse shape");
    }

    return result.data;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.ts apps/api/src/modules/manager/infrastructure/ai-providers/groq-insight.adapter.test.ts
git commit -m "feat(api): add GroqInsightAdapter"
```

---

### Task 3: Controller endpoint and module wiring

**Files:**
- Modify: `apps/api/src/modules/manager/infrastructure/manager.controller.ts`
- Modify: `apps/api/src/modules/manager/infrastructure/manager.controller.test.ts`
- Modify: `apps/api/src/modules/manager/manager.module.ts`

**Interfaces:**
- Consumes: `GenerateManagerInsightUseCase` (Task 1), `InsightGenerationFailedError` (Task 1), `GroqInsightAdapter`/`AI_INSIGHT_PORT` (Task 2).
- Produces: working `POST /manager/insights` HTTP endpoint — this is what the frontend (Tasks 4-5) calls.

- [ ] **Step 1: Extend the controller test with the new endpoint's failing cases**

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
import { ManagerTokenService } from "../application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "../application/ports/simulated-signal-repository.port.ts";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../application/ports/simulated-signal-repository.port.ts";
import { AI_INSIGHT_PORT, InsightGenerationFailedError } from "../application/ports/ai-insight.port.ts";
import type { AiInsightPort, ManagerInsightResponse } from "../application/ports/ai-insight.port.ts";

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

function fakeConfig(): ConfigService {
  const values: Record<string, string> = { MANAGER_ACCESS_CODE: "test-code", MANAGER_TOKEN_SECRET: "test-secret" };
  return { getOrThrow: (key: string) => values[key], get: () => undefined } as unknown as ConfigService;
}

describe("manager controller", () => {
  let app: INestApplication;
  let repository: FakeSimulatedSignalRepository;
  let aiInsightPort: FakeAiInsightPort;

  beforeAll(async () => {
    repository = new FakeSimulatedSignalRepository();
    aiInsightPort = new FakeAiInsightPort();
    const moduleRef = await Test.createTestingModule({
      controllers: [ManagerController],
      providers: [
        LoginManagerUseCase,
        GetManagerSignalsUseCase,
        GenerateManagerInsightUseCase,
        ManagerTokenService,
        ManagerAuthGuard,
        { provide: SIMULATED_SIGNAL_REPOSITORY, useValue: repository },
        { provide: AI_INSIGHT_PORT, useValue: aiInsightPort },
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
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/manager.controller.test.ts`
Expected: FAIL on the 3 new `/manager/insights` tests (route doesn't exist yet — 404s, not the expected statuses). The 5 pre-existing tests still pass.

- [ ] **Step 3: Add the endpoint**

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
import { InsightGenerationFailedError, type ManagerInsightResponse } from "../application/ports/ai-insight.port.ts";
import type { IssuedManagerToken } from "../application/services/manager-token.service.ts";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";

const LoginRequestSchema = z.object({ code: z.string().min(1) });

@Controller("manager")
export class ManagerController {
  constructor(
    @Inject(LoginManagerUseCase) private readonly loginManager: LoginManagerUseCase,
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(GenerateManagerInsightUseCase) private readonly generateManagerInsight: GenerateManagerInsightUseCase,
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
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/api exec vitest run src/modules/manager/infrastructure/manager.controller.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Wire the module**

Replace the full contents of `apps/api/src/modules/manager/manager.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ManagerController } from "./infrastructure/manager.controller.ts";
import { ManagerAuthGuard } from "./infrastructure/manager-auth.guard.ts";
import { PrismaSimulatedSignalRepository } from "./infrastructure/persistence/prisma-simulated-signal.repository.ts";
import { GroqInsightAdapter } from "./infrastructure/ai-providers/groq-insight.adapter.ts";
import { LoginManagerUseCase } from "./application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase } from "./application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "./application/use-cases/generate-manager-insight.use-case.ts";
import { ManagerTokenService } from "./application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "./application/ports/simulated-signal-repository.port.ts";
import { AI_INSIGHT_PORT } from "./application/ports/ai-insight.port.ts";

@Module({
  controllers: [ManagerController],
  providers: [
    LoginManagerUseCase,
    GetManagerSignalsUseCase,
    GenerateManagerInsightUseCase,
    ManagerTokenService,
    ManagerAuthGuard,
    { provide: SIMULATED_SIGNAL_REPOSITORY, useClass: PrismaSimulatedSignalRepository },
    { provide: AI_INSIGHT_PORT, useClass: GroqInsightAdapter },
  ],
})
export class ManagerModule {}
```

- [ ] **Step 6: Run the whole backend test suite**

Run: `pnpm --filter @zelo/api test`
Expected: all tests pass.

- [ ] **Step 7: Manually verify against a real running API**

With the API running (`pnpm --filter @zelo/api dev`) and a real `GROQ_API_KEY` set in `apps/api/.env` (same key already used by the chat feature), and the manager-login plan's seed already applied:

```bash
curl -s -X POST http://localhost:3000/manager/login -H "Content-Type: application/json" -d '{"code":"zelo-demo-2026"}'
```

Copy the token, then:

```bash
curl -s -X POST http://localhost:3000/manager/insights -H "Authorization: Bearer <token>"
```

Expected: `200` with `{"interpretation": "...", "suggestedActions": ["...", "..."]}` — read the actual text and confirm it reads as pattern-level analysis (not a diagnosis of a specific person), mentions a department by name consistent with the seeded data, and the suggested actions are management-scoped (scheduling/staffing/monitoring), not clinical.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/manager/infrastructure/manager.controller.ts apps/api/src/modules/manager/infrastructure/manager.controller.test.ts apps/api/src/modules/manager/manager.module.ts
git commit -m "feat(api): add POST /manager/insights endpoint"
```

---

### Task 4: Frontend port, adapter, and use-case

**Files:**
- Create: `apps/web/src/ports/manager-insight.port.ts`
- Create: `apps/web/src/infrastructure/http/http-manager-insight.adapter.ts`
- Create: `apps/web/src/use-cases/generate-manager-insight.usecase.ts`
- Test: `apps/web/src/use-cases/generate-manager-insight.usecase.test.ts`

**Interfaces:**
- Consumes: `UnauthorizedManagerError` (from the manager-login plan's `apps/web/src/ports/manager-signals.port.ts` — reused rather than duplicated, since a 401 here means the exact same thing: the manager's session is invalid).
- Produces: `ManagerInsightResult { interpretation: string; suggestedActions: string[] }`; `InsightGenerationFailedError`; `ManagerInsightPort { generateInsight(token: string): Promise<ManagerInsightResult> }`; `GenerateManagerInsightUseCase.execute(token: string): Promise<ManagerInsightResult>`. Task 5 consumes all of these.

- [ ] **Step 1: Add the port**

Create `apps/web/src/ports/manager-insight.port.ts`:

```ts
import { z } from "zod";

export const ManagerInsightResultSchema = z.object({
  interpretation: z.string(),
  suggestedActions: z.array(z.string()),
});
export type ManagerInsightResult = z.infer<typeof ManagerInsightResultSchema>;

export class InsightGenerationFailedError extends Error {}

export interface ManagerInsightPort {
  generateInsight(token: string): Promise<ManagerInsightResult>;
}
```

- [ ] **Step 2: Add the HTTP adapter**

Create `apps/web/src/infrastructure/http/http-manager-insight.adapter.ts`:

```ts
import type { ManagerInsightPort, ManagerInsightResult } from "../../ports/manager-insight.port";
import { ManagerInsightResultSchema, InsightGenerationFailedError } from "../../ports/manager-insight.port";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpManagerInsightAdapter implements ManagerInsightPort {
  async generateInsight(token: string): Promise<ManagerInsightResult> {
    const response = await fetch(`${API_BASE_URL}/manager/insights`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      throw new UnauthorizedManagerError();
    }
    if (response.status === 502) {
      throw new InsightGenerationFailedError();
    }
    if (!response.ok) {
      throw new Error(`manager insight generation failed with status ${response.status}`);
    }

    return ManagerInsightResultSchema.parse(await response.json());
  }
}
```

- [ ] **Step 3: Write the failing use-case test**

Create `apps/web/src/use-cases/generate-manager-insight.usecase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GenerateManagerInsightUseCase } from "./generate-manager-insight.usecase";
import type { ManagerInsightPort, ManagerInsightResult } from "../ports/manager-insight.port";
import { InsightGenerationFailedError } from "../ports/manager-insight.port";

class FakeManagerInsightPort implements ManagerInsightPort {
  constructor(private readonly result: ManagerInsightResult | Error) {}
  async generateInsight(): Promise<ManagerInsightResult> {
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

describe("GenerateManagerInsightUseCase", () => {
  it("returns the insight on success", async () => {
    const useCase = new GenerateManagerInsightUseCase(
      new FakeManagerInsightPort({ interpretation: "texto", suggestedActions: ["ação 1"] }),
    );

    const result = await useCase.execute("valid-token");

    expect(result).toEqual({ interpretation: "texto", suggestedActions: ["ação 1"] });
  });

  it("propagates InsightGenerationFailedError", async () => {
    const useCase = new GenerateManagerInsightUseCase(new FakeManagerInsightPort(new InsightGenerationFailedError()));

    await expect(useCase.execute("valid-token")).rejects.toBeInstanceOf(InsightGenerationFailedError);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @zelo/web exec vitest run src/use-cases/generate-manager-insight.usecase.test.ts`
Expected: FAIL — `Cannot find module './generate-manager-insight.usecase'`.

- [ ] **Step 5: Implement the use-case**

Create `apps/web/src/use-cases/generate-manager-insight.usecase.ts`:

```ts
import type { ManagerInsightPort, ManagerInsightResult } from "../ports/manager-insight.port";

export class GenerateManagerInsightUseCase {
  constructor(private readonly insightPort: ManagerInsightPort) {}

  async execute(token: string): Promise<ManagerInsightResult> {
    return this.insightPort.generateInsight(token);
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @zelo/web exec vitest run src/use-cases/generate-manager-insight.usecase.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/ports/manager-insight.port.ts apps/web/src/infrastructure/http/http-manager-insight.adapter.ts apps/web/src/use-cases/generate-manager-insight.usecase.ts apps/web/src/use-cases/generate-manager-insight.usecase.test.ts
git commit -m "feat(web): add manager insight port, adapter, and use-case"
```

---

### Task 5: Hook and `ManagerDashboardPage` wiring

**Files:**
- Modify: `apps/web/src/app/container.ts`
- Create: `apps/web/src/presentation/hooks/useManagerInsight.ts`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`
- Modify: `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`

**Interfaces:**
- Consumes: `GenerateManagerInsightUseCase` (Task 4), `useManagerSessionStore` (manager-login plan).
- Produces: a working "Gerar análise" button on `ManagerDashboardPage`.

- [ ] **Step 1: Wire the container**

Edit `apps/web/src/app/container.ts`, adding the imports and the new export:

```ts
import { GenerateManagerInsightUseCase } from "../use-cases/generate-manager-insight.usecase";
import { HttpManagerInsightAdapter } from "../infrastructure/http/http-manager-insight.adapter";
```

```ts
export const generateManagerInsightUseCase = new GenerateManagerInsightUseCase(new HttpManagerInsightAdapter());
```

- [ ] **Step 2: Add the hook**

Create `apps/web/src/presentation/hooks/useManagerInsight.ts`:

```ts
import { useMutation } from "@tanstack/react-query";
import { generateManagerInsightUseCase } from "../../app/container";
import { useManagerSessionStore } from "../../stores/manager-session.store";

export function useManagerInsight() {
  const token = useManagerSessionStore((state) => state.token);

  return useMutation({
    mutationFn: () => generateManagerInsightUseCase.execute(token!),
  });
}
```

- [ ] **Step 3: Write the failing tests for the new dashboard section**

Replace the full contents of `apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerDashboardPage } from "./ManagerDashboardPage";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import * as container from "../../app/container";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

function renderManager() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/manager"]}>
        <Routes>
          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/login" element={<div>Login screen</div>} />
          <Route path="/home" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SIGNALS_RESPONSE = {
  overallConcerningRate: 0.41,
  checkInsLast4Weeks: 111,
  weeklyTrend: [
    { weekStart: "2026-06-01T00:00:00.000Z", concerningRate: 0.3 },
    { weekStart: "2026-06-08T00:00:00.000Z", concerningRate: 0.5 },
  ],
  segments: [
    { label: "Plantão noturno", value: 52, n: 18 },
    { label: "Pronto-socorro", value: 38, n: 24 },
    { label: "UTI", value: 44, n: 9 },
  ],
};

describe("ManagerDashboardPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useManagerSessionStore.setState({ token: "abc.def", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockResolvedValue(SIGNALS_RESPONSE);
  });

  it("renders segments and trend bars from the real signals response, suppressing n<5 departments", async () => {
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    expect(screen.getByText("Pronto-socorro")).toBeInTheDocument();
    expect(screen.getByText("UTI")).toBeInTheDocument();
    expect(screen.queryByText("Ambulatório")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("trend-bar")).toHaveLength(2);
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
  });

  it("navigates to /home on back", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "Sair da demo" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("clears the session and redirects to login on a 401", async () => {
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockRejectedValue(new UnauthorizedManagerError());
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Login screen")).toBeInTheDocument();
    });
    expect(useManagerSessionStore.getState().token).toBeNull();
  });

  it("generates and displays the AI insight when the manager clicks the button", async () => {
    vi.spyOn(container.generateManagerInsightUseCase, "execute").mockResolvedValue({
      interpretation: "A UTI mostra um padrão de aumento gradual nos sinais preocupantes.",
      suggestedActions: ["Agendar conversa com a liderança da UTI", "Revisar a escala de plantões"],
    });
    const user = userEvent.setup();
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Gerar análise" }));

    expect(
      await screen.findByText("A UTI mostra um padrão de aumento gradual nos sinais preocupantes."),
    ).toBeInTheDocument();
    expect(screen.getByText("Agendar conversa com a liderança da UTI")).toBeInTheDocument();
    expect(screen.getByText("Revisar a escala de plantões")).toBeInTheDocument();
  });

  it("shows an inline retry message when insight generation fails, without breaking the rest of the page", async () => {
    vi.spyOn(container.generateManagerInsightUseCase, "execute").mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Gerar análise" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível gerar a análise agora.");
    });
    expect(screen.getByText("UTI")).toBeInTheDocument();
    expect(screen.getAllByTestId("trend-bar")).toHaveLength(2);
  });
});
```

- [ ] **Step 4: Run the tests to verify the new ones fail**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: FAIL on the 2 new insight tests (no "Gerar análise" button exists yet). The 3 pre-existing tests still pass.

- [ ] **Step 5: Add the insight section to `ManagerDashboardPage`**

Replace the full contents of `apps/web/src/presentation/pages/ManagerDashboardPage.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { SectionLabel } from "../ui/SectionLabel";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { routes } from "../lib/routes";
import { useManagerSignals } from "../hooks/useManagerSignals";
import { useManagerInsight } from "../hooks/useManagerInsight";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

const MIN_TREND_BAR_HEIGHT = 8;

function toTrendBarHeights(trend: { concerningRate: number }[]): number[] {
  return trend.map((point) => Math.max(MIN_TREND_BAR_HEIGHT, Math.round(point.concerningRate * 100)));
}

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const clearSession = useManagerSessionStore((state) => state.clearSession);
  const { data, error, isError } = useManagerSignals();
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
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-warn">{Math.round(overallConcerningRate * 100)}%</p>
            <p className="text-caption text-muted">sinais de burnout na equipe</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-brand">{checkInsLast4Weeks}</p>
            <p className="text-caption text-muted">check-ins nas últimas 4 semanas</p>
          </Card>
        </div>

        <div className="mt-[14px]">
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
        </div>

        <div className="mt-[14px]">
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
        </div>

        <div className="mt-[14px]">
          <Card>
            <p className="text-body font-extrabold text-ink">Análise com IA</p>
            {!insight.data && (
              <div className="mt-3">
                <Button variant="outline" full={false} loading={insight.isPending} onClick={() => insight.mutate()}>
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

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @zelo/web exec vitest run src/presentation/pages/ManagerDashboardPage.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Run the full frontend test suite**

Run: `pnpm --filter @zelo/web test`
Expected: all tests pass.

- [ ] **Step 8: Run the full monorepo build**

Run: `pnpm turbo run build --filter=@zelo/web --filter=@zelo/api`
Expected: both build cleanly, no type errors.

- [ ] **Step 9: Manually verify end-to-end in a real browser**

With both `pnpm --filter @zelo/api dev` and `pnpm --filter @zelo/web dev` running, a real `GROQ_API_KEY` set, and the manager-login plan's seed already applied:

1. Log into the manager dashboard (`/manager/login` with your local `MANAGER_ACCESS_CODE`).
2. Scroll to "Análise com IA", click "Gerar análise".
3. Confirm the button shows a loading state, then renders a short interpretation paragraph and a bulleted list of 2-4 suggested actions.
4. Read the actual generated text: confirm it doesn't diagnose anyone, doesn't reference an individual, and its suggested actions are management actions (not clinical ones).
5. Temporarily set an invalid `GROQ_API_KEY` in `apps/api/.env`, restart the API, click "Gerar análise" again — confirm the inline "Não foi possível gerar a análise agora." message appears and the rest of the dashboard (KPIs, trend chart, segments) is unaffected. Restore the real key afterward.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/container.ts apps/web/src/presentation/hooks/useManagerInsight.ts apps/web/src/presentation/pages/ManagerDashboardPage.tsx apps/web/src/presentation/pages/ManagerDashboardPage.test.tsx
git commit -m "feat(web): wire manager AI insight into ManagerDashboardPage"
```
