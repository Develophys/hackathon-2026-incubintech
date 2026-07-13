import { describe, expect, it } from "vitest";
import { FakeInsightAdapter } from "./fake-insight.adapter.ts";

describe("FakeInsightAdapter", () => {
  it("returns a canned ManagerInsightResponse without calling a real AI provider", async () => {
    const adapter = new FakeInsightAdapter();

    const result = await adapter.generateInsight();

    expect(result.interpretation.length).toBeGreaterThan(0);
    expect(result.suggestedActions.length).toBeGreaterThan(0);
  });
});
