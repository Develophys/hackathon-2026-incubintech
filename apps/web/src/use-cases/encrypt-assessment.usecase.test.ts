import { describe, expect, it } from "vitest";
import { EncryptAssessmentUseCase } from "./encrypt-assessment.usecase";
import type { EncryptionPort } from "../ports/encryption.port";

class FakeEncryptionPort implements EncryptionPort {
  async encrypt(plaintext: string): Promise<string> {
    return `encrypted(${plaintext})`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    return ciphertext.replace(/^encrypted\((.*)\)$/, "$1");
  }
}

describe("EncryptAssessmentUseCase", () => {
  it("returns the port's ciphertext wrapped in the expected shape", async () => {
    const useCase = new EncryptAssessmentUseCase(new FakeEncryptionPort());

    const result = await useCase.execute("[1,2,3]");

    expect(result).toEqual({ ciphertext: "encrypted([1,2,3])" });
  });
});
