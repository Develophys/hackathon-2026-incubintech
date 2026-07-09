import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ChatController } from "./chat.controller.ts";
import { SendChatMessageUseCase } from "../application/use-cases/send-chat-message.use-case.ts";
import { AI_CHAT_PORT } from "../application/ports/ai-chat.port.ts";
import type { AiChatPort } from "../application/ports/ai-chat.port.ts";
import type { ChatToken } from "@zelo/domain";

class FakeAiChatPort implements AiChatPort {
  async *streamReply(): AsyncGenerator<ChatToken> {
    yield { conversationId: "c1", delta: "oi", done: false };
    yield { conversationId: "c1", delta: "", done: true };
  }
}

describe("POST /chat/stream", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        SendChatMessageUseCase,
        { provide: AI_CHAT_PORT, useClass: FakeAiChatPort },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("streams ndjson ChatToken lines for a valid request", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/stream")
      .send({ conversationId: "c1", anonymizedMessages: [], hasActiveRiskSignal: false });

    expect(response.status).toBe(200);
    const lines = response.text.trim().split("\n").map((line) => JSON.parse(line));
    expect(lines).toEqual([
      { conversationId: "c1", delta: "oi", done: false },
      { conversationId: "c1", delta: "", done: true },
    ]);
  });

  it("rejects a request with a malformed body", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/stream")
      .send({ conversationId: "not-a-uuid" });

    expect(response.status).toBe(400);
  });
});
