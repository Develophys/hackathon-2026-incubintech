import { describe, expect, it } from "vitest";
import { CrisisSessionSchema } from "./crisis-session";

describe("CrisisSessionSchema", () => {
  it("accepts an ephemeral crisis session with an expiry", () => {
    const result = CrisisSessionSchema.safeParse({
      sessionToken: "eph_1a2b3c4d",
      createdAt: "2026-07-07T12:00:00.000Z",
      expiresAt: "2026-07-07T13:00:00.000Z",
      status: "pending",
    });

    expect(result.success).toBe(true);
  });
});
