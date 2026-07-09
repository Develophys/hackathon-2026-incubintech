import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConfigService } from "@nestjs/config";

const generateContentStreamMock = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: { generateContentStream: generateContentStreamMock },
    })),
  };
});

describe("GeminiAdapter", () => {
  beforeEach(() => {
    generateContentStreamMock.mockReset();
  });

  it("maps Gemini stream chunks into ChatToken shape and emits a final done token", async () => {
    async function* fakeGeminiStream() {
      yield { text: "Oi, " };
      yield { text: "tudo bem?" };
    }
    generateContentStreamMock.mockResolvedValue(fakeGeminiStream());

    const { GeminiAdapter } = await import("./gemini.adapter.ts");
    const fakeConfig = {
      getOrThrow: () => "fake-api-key",
      get: () => undefined,
    } as unknown as ConfigService;

    const adapter = new GeminiAdapter(fakeConfig);
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

  it("maps AnonymizedMessage roles to Gemini's user/model convention", async () => {
    async function* emptyStream() {}
    generateContentStreamMock.mockResolvedValue(emptyStream());

    const { GeminiAdapter } = await import("./gemini.adapter.ts");
    const fakeConfig = {
      getOrThrow: () => "fake-api-key",
      get: () => undefined,
    } as unknown as ConfigService;

    const adapter = new GeminiAdapter(fakeConfig);
    const tokens = [];
    for await (const token of adapter.streamReply({
      conversationId: "c1",
      anonymizedMessages: [
        { role: "assistant", content: "Oi, como você está?" },
        { role: "user", content: "cansada" },
      ],
      systemPrompt: "system prompt",
    })) {
      tokens.push(token);
    }

    expect(generateContentStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          { role: "model", parts: [{ text: "Oi, como você está?" }] },
          { role: "user", parts: [{ text: "cansada" }] },
        ],
        config: expect.objectContaining({ systemInstruction: "system prompt" }),
      }),
    );
  });
});
