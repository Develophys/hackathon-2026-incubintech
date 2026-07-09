import { describe, expect, it } from "vitest";
import { CheckApiHealthUseCase } from "./check-api-health.usecase";
import type { ApiHealthPort, ApiHealthResult } from "../ports/api-health.port";

class FakeHealthyApi implements ApiHealthPort {
  async check(): Promise<ApiHealthResult> {
    return { status: "ok", database: true };
  }
}

describe("CheckApiHealthUseCase", () => {
  it("returns the port's health result unchanged", async () => {
    const useCase = new CheckApiHealthUseCase(new FakeHealthyApi());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "ok", database: true });
  });
});
