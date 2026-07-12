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
