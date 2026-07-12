import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { ManagerTokenService } from "./manager-token.service.ts";

function fakeConfig(secret: string): ConfigService {
  return { getOrThrow: () => secret, get: () => undefined } as unknown as ConfigService;
}

describe("ManagerTokenService", () => {
  it("issues a token that verify() accepts", () => {
    const service = new ManagerTokenService(fakeConfig("test-secret"));
    const { token, expiresAt } = service.issue();

    expect(service.verify(token)).toBe(true);
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a token signed with a different secret", () => {
    const issuer = new ManagerTokenService(fakeConfig("secret-a"));
    const verifier = new ManagerTokenService(fakeConfig("secret-b"));
    const { token } = issuer.issue();

    expect(verifier.verify(token)).toBe(false);
  });

  it("rejects a malformed token", () => {
    const service = new ManagerTokenService(fakeConfig("test-secret"));

    expect(service.verify("not-a-valid-token")).toBe(false);
    expect(service.verify("")).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const service = new ManagerTokenService(fakeConfig("test-secret"));
    const { token } = service.issue();

    vi.advanceTimersByTime(9 * 60 * 60 * 1000); // 9h, past the 8h expiry
    expect(service.verify(token)).toBe(false);

    vi.useRealTimers();
  });
});
