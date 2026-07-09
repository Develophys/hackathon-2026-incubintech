import { describe, expect, it } from "vitest";
import { CheckHealthUseCase } from "./check-health.use-case.ts";
import type { DatabaseHealthPort } from "../ports/database-health.port.ts";

class FakeHealthyDatabase implements DatabaseHealthPort {
  async isReachable(): Promise<boolean> {
    return true;
  }
}

class FakeUnreachableDatabase implements DatabaseHealthPort {
  async isReachable(): Promise<boolean> {
    return false;
  }
}

describe("CheckHealthUseCase", () => {
  it("reports 'ok' when the database is reachable", async () => {
    const useCase = new CheckHealthUseCase(new FakeHealthyDatabase());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "ok", database: true });
  });

  it("reports 'degraded' when the database is unreachable", async () => {
    const useCase = new CheckHealthUseCase(new FakeUnreachableDatabase());

    const result = await useCase.execute();

    expect(result).toEqual({ status: "degraded", database: false });
  });
});
