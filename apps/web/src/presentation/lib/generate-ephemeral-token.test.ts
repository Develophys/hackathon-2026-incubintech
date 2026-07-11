import { describe, expect, it } from "vitest";
import { generateEphemeralToken } from "./generate-ephemeral-token";

describe("generateEphemeralToken", () => {
  it("returns a token matching the zl-xxxx-xxxx shape", () => {
    expect(generateEphemeralToken()).toMatch(/^zl-[a-z2-7]{4}-[a-z2-7]{4}$/);
  });

  it("returns a different token on each call", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateEphemeralToken()));
    expect(tokens.size).toBeGreaterThan(1);
  });
});
