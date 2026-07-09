import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AssessmentController } from "./assessment.controller.ts";
import { StoreEncryptedAssessmentUseCase } from "../application/use-cases/store-encrypted-assessment.use-case.ts";
import { ASSESSMENT_REPOSITORY } from "../application/ports/assessment-repository.port.ts";
import type { AssessmentRepository } from "../application/ports/assessment-repository.port.ts";
import type { Assessment } from "@zelo/domain";

class FakeAssessmentRepository implements AssessmentRepository {
  public saved: Assessment[] = [];

  async save(assessment: Assessment): Promise<void> {
    this.saved.push(assessment);
  }
}

describe("POST /assessments", () => {
  let app: INestApplication;
  let repository: FakeAssessmentRepository;

  beforeAll(async () => {
    repository = new FakeAssessmentRepository();
    const moduleRef = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        StoreEncryptedAssessmentUseCase,
        { provide: ASSESSMENT_REPOSITORY, useValue: repository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("stores a valid ciphertext-only assessment and returns its id", async () => {
    const response = await request(app.getHttpServer()).post("/assessments").send({
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-ciphertext==",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "b3f1c2b0-1234-4a5b-9c6d-000000000001" });
    expect(repository.saved).toHaveLength(1);
  });

  it("rejects a payload carrying a raw answers array (FR-2, FR-13 — architecturally enforced)", async () => {
    const response = await request(app.getHttpServer()).post("/assessments").send({
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000002",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      answers: [1, 2, 3, 0, 1, 2, 0, 1, 3],
    });

    expect(response.status).toBe(400);
  });

  it("silently drops a riskSignal field instead of persisting it — the server never learns the risk signal", async () => {
    const response = await request(app.getHttpServer()).post("/assessments").send({
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000003",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-ciphertext==",
      riskSignal: true,
    });

    expect(response.status).toBe(201);
    const stored = repository.saved.find((a) => a.id === "b3f1c2b0-1234-4a5b-9c6d-000000000003");
    expect(stored).not.toHaveProperty("riskSignal");
  });
});
