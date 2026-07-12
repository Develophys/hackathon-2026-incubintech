import { describe, expect, it } from "vitest";
import { LoginManagerUseCase } from "./login-manager.usecase";
import type { ManagerAuthPort, ManagerLoginResult } from "../ports/manager-auth.port";
import { InvalidManagerCodeError } from "../ports/manager-auth.port";

class FakeManagerAuthPort implements ManagerAuthPort {
  constructor(private readonly result: ManagerLoginResult | Error) {}
  async login(): Promise<ManagerLoginResult> {
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

describe("LoginManagerUseCase", () => {
  it("returns the token and expiry on success", async () => {
    const useCase = new LoginManagerUseCase(
      new FakeManagerAuthPort({ token: "abc.def", expiresAt: "2026-07-11T20:00:00.000Z" }),
    );

    const result = await useCase.execute("1234");

    expect(result).toEqual({ token: "abc.def", expiresAt: "2026-07-11T20:00:00.000Z" });
  });

  it("propagates InvalidManagerCodeError on a wrong code", async () => {
    const useCase = new LoginManagerUseCase(new FakeManagerAuthPort(new InvalidManagerCodeError()));

    await expect(useCase.execute("wrong")).rejects.toBeInstanceOf(InvalidManagerCodeError);
  });
});
