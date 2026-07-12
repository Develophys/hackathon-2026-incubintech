import { describe, expect, it } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { LoginManagerUseCase, InvalidManagerCodeError } from "./login-manager.use-case.ts";
import { ManagerTokenService } from "../services/manager-token.service.ts";

function fakeConfig(values: Record<string, string>): ConfigService {
  return { getOrThrow: (key: string) => values[key], get: () => undefined } as unknown as ConfigService;
}

describe("LoginManagerUseCase", () => {
  it("issues a token when the code matches MANAGER_ACCESS_CODE", () => {
    const config = fakeConfig({ MANAGER_ACCESS_CODE: "secret-code", MANAGER_TOKEN_SECRET: "token-secret" });
    const useCase = new LoginManagerUseCase(config, new ManagerTokenService(config));

    const result = useCase.execute("secret-code");

    expect(result.token).toEqual(expect.any(String));
    expect(result.expiresAt).toEqual(expect.any(String));
  });

  it("throws InvalidManagerCodeError when the code does not match", () => {
    const config = fakeConfig({ MANAGER_ACCESS_CODE: "secret-code", MANAGER_TOKEN_SECRET: "token-secret" });
    const useCase = new LoginManagerUseCase(config, new ManagerTokenService(config));

    expect(() => useCase.execute("wrong-code")).toThrow(InvalidManagerCodeError);
  });
});
