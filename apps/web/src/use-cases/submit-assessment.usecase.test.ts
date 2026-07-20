import { describe, expect, it } from "vitest";
import { SubmitAssessmentUseCase } from "./submit-assessment.usecase";
import { ScoreAssessmentUseCase } from "./score-assessment.usecase";
import { EncryptAssessmentUseCase } from "./encrypt-assessment.usecase";
import type { EncryptionPort } from "@/ports/encryption.port";
import type { LocalAssessmentStorePort } from "@/ports/local-assessment-store.port";
import type { AssessmentSubmissionPort } from "@/ports/assessment-submission.port";
import type { AssessmentRecord } from "@/domain/assessment-record";
import type { Assessment } from "@zelo/domain";

class FakeEncryptionPort implements EncryptionPort {
  async encrypt(plaintext: string): Promise<string> {
    return `encrypted(${plaintext})`;
  }
  async decrypt(ciphertext: string): Promise<string> {
    return ciphertext;
  }
}

class FakeLocalStore implements LocalAssessmentStorePort {
  public saved: AssessmentRecord[] = [];
  async save(record: AssessmentRecord): Promise<void> {
    this.saved.push(record);
  }
  async listAll(): Promise<AssessmentRecord[]> {
    return this.saved;
  }
}

class FakeWorkingSubmission implements AssessmentSubmissionPort {
  public submitted: Assessment[] = [];
  async submit(assessment: Assessment): Promise<void> {
    this.submitted.push(assessment);
  }
}

class FakeFailingSubmission implements AssessmentSubmissionPort {
  async submit(): Promise<void> {
    throw new Error("network error");
  }
}

function buildUseCase(submission: AssessmentSubmissionPort, localStore: LocalAssessmentStorePort) {
  return new SubmitAssessmentUseCase(
    new ScoreAssessmentUseCase(),
    new EncryptAssessmentUseCase(new FakeEncryptionPort()),
    localStore,
    submission,
  );
}

describe("SubmitAssessmentUseCase", () => {
  it("computes the score, saves an encrypted record locally with riskSignal, and submits ciphertext-only to the backend", async () => {
    const localStore = new FakeLocalStore();
    const submission = new FakeWorkingSubmission();
    const useCase = buildUseCase(submission, localStore);

    const result = await useCase.execute({
      scaleType: "PHQ-9",
      answers: [0, 0, 0, 0, 0, 0, 0, 0, 1],
    });

    expect(result.totalScore).toBe(1);
    expect(result.riskSignal).toBe(true);
    expect(result.submissionSucceeded).toBe(true);

    expect(localStore.saved).toHaveLength(1);
    expect(localStore.saved[0]?.riskSignal).toBe(true);
    expect(localStore.saved[0]?.ciphertext).toBe("encrypted([0,0,0,0,0,0,0,0,1])");

    expect(submission.submitted).toHaveLength(1);
    expect(submission.submitted[0]).not.toHaveProperty("riskSignal");
  });

  it("still returns the score and keeps the local save when backend submission fails", async () => {
    const localStore = new FakeLocalStore();
    const useCase = buildUseCase(new FakeFailingSubmission(), localStore);

    const result = await useCase.execute({
      scaleType: "GAD-7",
      answers: [1, 1, 1, 1, 1, 1, 1],
    });

    expect(result.totalScore).toBe(7);
    expect(result.submissionSucceeded).toBe(false);
    expect(localStore.saved).toHaveLength(1);
  });
});
