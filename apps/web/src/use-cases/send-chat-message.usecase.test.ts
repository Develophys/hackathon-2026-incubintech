import { describe, expect, it } from "vitest";
import { SendChatMessageUseCase } from "./send-chat-message.usecase";
import { AnonymizeTextUseCase } from "./anonymize-text.usecase";
import type { ChatGatewayPort, ChatStreamEvent } from "../ports/chat-gateway.port";

class FakeChatGateway implements ChatGatewayPort {
  public lastParams: Parameters<ChatGatewayPort["streamReply"]>[0] | undefined;

  async *streamReply(
    params: Parameters<ChatGatewayPort["streamReply"]>[0],
  ): AsyncGenerator<ChatStreamEvent> {
    this.lastParams = params;
    yield { conversationId: params.conversationId, delta: "oi", done: false };
    yield { conversationId: params.conversationId, delta: "", done: true };
  }
}

async function collect<T>(iterable: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

describe("SendChatMessageUseCase (frontend)", () => {
  it("anonymizes the raw user text before passing it to the gateway", async () => {
    const gateway = new FakeChatGateway();
    const useCase = new SendChatMessageUseCase(gateway, new AnonymizeTextUseCase());

    await collect(
      useCase.execute({
        conversationId: "c1",
        history: [],
        rawUserText: "meu email é a@b.com, estou exausta",
        hasActiveRiskSignal: false,
      }),
    );

    expect(gateway.lastParams?.anonymizedMessages).toEqual([
      { role: "user", content: "meu email é [EMAIL], estou exausta" },
    ]);
  });

  it("appends the anonymized message to prior history", async () => {
    const gateway = new FakeChatGateway();
    const useCase = new SendChatMessageUseCase(gateway, new AnonymizeTextUseCase());

    await collect(
      useCase.execute({
        conversationId: "c1",
        history: [{ role: "assistant", content: "Oi, como você está?" }],
        rawUserText: "cansada",
        hasActiveRiskSignal: false,
      }),
    );

    expect(gateway.lastParams?.anonymizedMessages).toEqual([
      { role: "assistant", content: "Oi, como você está?" },
      { role: "user", content: "cansada" },
    ]);
  });

  it("streams the gateway's events through unchanged", async () => {
    const useCase = new SendChatMessageUseCase(new FakeChatGateway(), new AnonymizeTextUseCase());

    const events = await collect(
      useCase.execute({ conversationId: "c1", history: [], rawUserText: "oi", hasActiveRiskSignal: false }),
    );

    expect(events).toEqual([
      { conversationId: "c1", delta: "oi", done: false },
      { conversationId: "c1", delta: "", done: true },
    ]);
  });
});
