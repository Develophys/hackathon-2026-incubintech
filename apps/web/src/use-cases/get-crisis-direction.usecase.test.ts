import { describe, expect, it } from "vitest";
import { GetCrisisDirectionUseCase } from "./get-crisis-direction.usecase";

describe("GetCrisisDirectionUseCase", () => {
  it("returns SUS-specific direction copy for bond 'sus'", () => {
    const useCase = new GetCrisisDirectionUseCase();

    const result = useCase.execute("sus");

    expect(result.bond).toBe("sus");
    expect(result.title).toBe("Rede SUS");
    expect(result.message).toMatch(/CAPS/);
  });

  it("returns private-network-specific direction copy for bond 'private'", () => {
    const useCase = new GetCrisisDirectionUseCase();

    const result = useCase.execute("private");

    expect(result.bond).toBe("private");
    expect(result.title).toBe("Plano de saúde / rede privada");
    expect(result.message).toMatch(/plano de saúde/);
  });
});
