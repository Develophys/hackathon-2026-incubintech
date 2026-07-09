import type { AnonymizedMessage } from "@zelo/domain";
import type { ChatGatewayPort, ChatStreamEvent } from "../ports/chat-gateway.port";
import type { AnonymizeTextUseCase } from "./anonymize-text.usecase";

export interface SendChatMessageParams {
  conversationId: string;
  history: AnonymizedMessage[];
  rawUserText: string;
  hasActiveRiskSignal: boolean;
}

export class SendChatMessageUseCase {
  constructor(
    private readonly chatGateway: ChatGatewayPort,
    private readonly anonymizeText: AnonymizeTextUseCase,
  ) {}

  async *execute(params: SendChatMessageParams): AsyncGenerator<ChatStreamEvent> {
    const anonymizedContent = this.anonymizeText.execute(params.rawUserText);
    const anonymizedMessages: AnonymizedMessage[] = [
      ...params.history,
      { role: "user", content: anonymizedContent },
    ];

    yield* this.chatGateway.streamReply({
      conversationId: params.conversationId,
      anonymizedMessages,
      hasActiveRiskSignal: params.hasActiveRiskSignal,
    });
  }
}
