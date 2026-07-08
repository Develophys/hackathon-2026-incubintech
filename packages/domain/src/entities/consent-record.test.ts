import { describe, expect, it } from "vitest";
import { ConsentRecordSchema } from "./consent-record";

describe("ConsentRecordSchema", () => {
  it("ties consent to an ephemeral session token, never a permanent identity", () => {
    const result = ConsentRecordSchema.safeParse({
      sessionToken: "eph_1a2b3c4d",
      grantedAt: "2026-07-07T12:00:00.000Z",
      scope: "crisis-human-connection",
    });

    expect(result.success).toBe(true);
  });
});
