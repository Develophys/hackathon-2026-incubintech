import { describe, expect, it } from "vitest";
import { AssessmentSchema } from "./assessment";

describe("AssessmentSchema", () => {
  it("accepts a valid encrypted assessment payload", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
    };

    const result = AssessmentSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it("rejects a payload missing the required ciphertext field", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      answers: [1, 2, 3],
    };

    const result = AssessmentSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it("strips a raw answers array if present, even alongside valid ciphertext", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
      answers: [1, 2, 3],
    };

    const result = AssessmentSchema.parse(input);

    expect(result).not.toHaveProperty("answers");
  });

  it("strips a riskSignal field if a buggy client includes one, rather than storing it", () => {
    const input = {
      id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      scaleType: "PHQ-9",
      capturedAt: "2026-07-07T12:00:00.000Z",
      ciphertext: "base64-encoded-ciphertext==",
      riskSignal: true,
    };

    const result = AssessmentSchema.parse(input);

    expect(result).not.toHaveProperty("riskSignal");
  });
});
