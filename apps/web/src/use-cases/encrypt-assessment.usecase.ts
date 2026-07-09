import type { EncryptionPort } from "../ports/encryption.port";

export interface EncryptedPayload {
  ciphertext: string;
}

export class EncryptAssessmentUseCase {
  constructor(private readonly encryption: EncryptionPort) {}

  async execute(plaintext: string): Promise<EncryptedPayload> {
    const ciphertext = await this.encryption.encrypt(plaintext);
    return { ciphertext };
  }
}
