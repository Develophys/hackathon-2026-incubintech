import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { WebCryptoEncryptionAdapter } from "./web-crypto-encryption.adapter";

describe("WebCryptoEncryptionAdapter", () => {
  it("round-trips plaintext through encrypt then decrypt", async () => {
    const adapter = new WebCryptoEncryptionAdapter();

    const ciphertext = await adapter.encrypt("[1,2,3,0,1,2,0,1,3]");
    const plaintext = await adapter.decrypt(ciphertext);

    expect(plaintext).toBe("[1,2,3,0,1,2,0,1,3]");
  });

  it("produces a different ciphertext each time for the same plaintext (random IV per call)", async () => {
    const adapter = new WebCryptoEncryptionAdapter();

    const first = await adapter.encrypt("same input");
    const second = await adapter.encrypt("same input");

    expect(first).not.toBe(second);
  });

  it("reuses the same persisted key across adapter instances", async () => {
    const first = new WebCryptoEncryptionAdapter();
    const ciphertext = await first.encrypt("persisted key test");

    const second = new WebCryptoEncryptionAdapter();
    const plaintext = await second.decrypt(ciphertext);

    expect(plaintext).toBe("persisted key test");
  });
});
