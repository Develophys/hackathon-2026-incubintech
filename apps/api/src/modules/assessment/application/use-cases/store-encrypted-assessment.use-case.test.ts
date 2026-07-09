import { describe, expect, it } from "vitest";
import { StoreEncryptedAssessmentUseCase } from "./store-encrypted-assessment.use-case.ts";
import type { AssessmentRepository } from "../ports/assessment-repository.port.ts";
import type { Assessment } from "@zelo/domain";

class FakeAssessmentRepository implements AssessmentRepository {
  public saved: Assessment[] = [];

  async save(assessment: Assessment): Promise<void> {
    this.saved.push(assessment);
  }
}

describe("StoreEncryptedAssessmentUseCase", () => {
  it("passes the assessment through to the repository unchanged", async () => {
    const repository = new FakeAssessmentRepository();
    const useCase = new StoreEncryptedAssessmentUseCase(repository);
    const assessment: Assessment = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-ciphertext==",
    };

    await useCase.execute(assessment);

    expect(repository.saved).toEqual([assessment]);
  });
});
