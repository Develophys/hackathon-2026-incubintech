import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConfigService } from "@nestjs/config";

const streamMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { stream: streamMock },
    })),
  };
});

describe("ClaudeAdapter", () => {
  beforeEach(() => {
    streamMock.mockReset();
  });

  it("maps Anthropic text-delta stream events into ChatToken shape and emits a final done token", async () => {
    async function* fakeAnthropicStream() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "Oi, " } };
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "tudo bem?" } };
      yield { type: "message_stop" };
    }
    streamMock.mockReturnValue(fakeAnthropicStream());

    const { ClaudeAdapter } = await import("./claude.adapter.ts");
    const fakeConfig = {
      getOrThrow: () => "fake-api-key",
      get: () => undefined,
    } as unknown as ConfigService;

    const adapter = new ClaudeAdapter(fakeConfig);
    const tokens = [];
    for await (const token of adapter.streamReply({
      conversationId: "c1",
      anonymizedMessages: [{ role: "user", content: "Oi" }],
      systemPrompt: "system prompt",
    })) {
      tokens.push(token);
    }

    expect(tokens).toEqual([
      { conversationId: "c1", delta: "Oi, ", done: false },
      { conversationId: "c1", delta: "tudo bem?", done: false },
      { conversationId: "c1", delta: "", done: true },
    ]);
  });
});
