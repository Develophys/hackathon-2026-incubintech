import { describe, expect, it } from "vitest";
import { RequestHumanHandoffUseCase } from "./request-human-handoff.usecase";

describe("RequestHumanHandoffUseCase", () => {
  it("returns handoff info synchronously, with no I/O", () => {
    const useCase = new RequestHumanHandoffUseCase();

    const result = useCase.execute();

    expect(result.externalCrisisLine).toEqual({ label: "CVV - Centro de Valorização da Vida", phone: "188" });
    expect(result.message.length).toBeGreaterThan(0);
  });
});
