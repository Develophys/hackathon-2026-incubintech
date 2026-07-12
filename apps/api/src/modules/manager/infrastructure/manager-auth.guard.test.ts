import { describe, expect, it } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";
import { ManagerTokenService } from "../application/services/manager-token.service.ts";

function fakeConfig(secret: string): ConfigService {
  return { getOrThrow: () => secret, get: () => undefined } as unknown as ConfigService;
}

function contextWithHeader(authorization: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
  } as unknown as ExecutionContext;
}

describe("ManagerAuthGuard", () => {
  const tokenService = new ManagerTokenService(fakeConfig("test-secret"));
  const guard = new ManagerAuthGuard(tokenService);

  it("allows a request with a valid Bearer token", () => {
    const { token } = tokenService.issue();
    expect(guard.canActivate(contextWithHeader(`Bearer ${token}`))).toBe(true);
  });

  it("rejects a request with no Authorization header", () => {
    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow(UnauthorizedException);
  });

  it("rejects a request with a malformed or tampered token", () => {
    expect(() => guard.canActivate(contextWithHeader("Bearer not-a-real-token"))).toThrow(UnauthorizedException);
  });
});
