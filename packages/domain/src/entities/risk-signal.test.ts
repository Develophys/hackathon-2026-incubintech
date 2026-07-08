import { describe, expect, it } from "vitest";
import { RiskSignalSchema } from "./risk-signal";

describe("RiskSignalSchema", () => {
  it("accepts a risk signal without any identifying data", () => {
    const result = RiskSignalSchema.safeParse({
      assessmentId: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      detectedAt: "2026-07-07T12:00:00.000Z",
      reason: "phq9-item-9-positive",
    });

    expect(result.success).toBe(true);
  });
});
