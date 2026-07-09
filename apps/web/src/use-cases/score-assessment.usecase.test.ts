import { describe, expect, it } from "vitest";
import { ScoreAssessmentUseCase } from "./score-assessment.usecase";

describe("ScoreAssessmentUseCase", () => {
  const useCase = new ScoreAssessmentUseCase();

  it("sums all 9 PHQ-9 answers into the total score", () => {
    const result = useCase.execute("PHQ-9", [1, 1, 1, 1, 1, 1, 1, 1, 0]);

    expect(result.totalScore).toBe(8);
  });

  it("flags riskSignal when PHQ-9 item 9 (index 8) is greater than 0", () => {
    const result = useCase.execute("PHQ-9", [0, 0, 0, 0, 0, 0, 0, 0, 1]);

    expect(result.riskSignal).toBe(true);
  });

  it("does not flag riskSignal when PHQ-9 item 9 is 0", () => {
    const result = useCase.execute("PHQ-9", [3, 3, 3, 3, 3, 3, 3, 3, 0]);

    expect(result.riskSignal).toBe(false);
  });

  it("sums all 7 GAD-7 answers into the total score", () => {
    const result = useCase.execute("GAD-7", [2, 2, 2, 2, 2, 2, 2]);

    expect(result.totalScore).toBe(14);
  });

  it("never flags riskSignal for GAD-7 — no validated single-item criterion exists yet", () => {
    const result = useCase.execute("GAD-7", [3, 3, 3, 3, 3, 3, 3]);

    expect(result.riskSignal).toBe(false);
  });

  it("throws if the answers array length doesn't match the scale's question count", () => {
    expect(() => useCase.execute("PHQ-9", [1, 1])).toThrow(/Expected 9 answers/);
  });

  it("throws a documented error for MBI-HSS — not implemented, licensing not procured", () => {
    expect(() => useCase.execute("MBI-HSS", [])).toThrow(/MBI-HSS scoring is not implemented/);
  });
});
