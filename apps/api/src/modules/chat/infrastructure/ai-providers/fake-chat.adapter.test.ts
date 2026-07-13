import { describe, expect, it } from "vitest";
import { FakeChatAdapter } from "./fake-chat.adapter.ts";

describe("FakeChatAdapter", () => {
  it("streams a canned reply word-by-word and ends with a done token", async () => {
    const adapter = new FakeChatAdapter();

    const tokens = [];
    for await (const token of adapter.streamReply({
      conversationId: "c1",
      anonymizedMessages: [{ role: "user", content: "Oi" }],
      systemPrompt: "system prompt",
    })) {
      tokens.push(token);
    }

    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens.every((token) => token.conversationId === "c1")).toBe(true);
    expect(tokens.slice(0, -1).every((token) => token.done === false)).toBe(true);
    expect(tokens.at(-1)).toEqual({ conversationId: "c1", delta: "", done: true });
    expect(tokens.map((token) => token.delta).join("")).not.toHaveLength(0);
  });

  it("never calls out to a real AI provider (no network/SDK dependency)", async () => {
    const adapter = new FakeChatAdapter();
    const tokens = [];
    for await (const token of adapter.streamReply({
      conversationId: "c2",
      anonymizedMessages: [],
      systemPrompt: "system prompt",
    })) {
      tokens.push(token);
    }
    expect(tokens.at(-1)?.done).toBe(true);
  });
});
