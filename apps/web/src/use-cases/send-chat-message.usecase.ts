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
      // params.history is typed as already-anonymized, but the caller (useChatConversation)
      // stores raw text for UI display and rebuilds history from that same state — so prior
      // user turns are re-anonymized here too, as the last checkpoint before any network call.
      // Redaction is idempotent (already-redacted "[EMAIL]"-style labels never re-match).
      ...params.history.map((message) => ({
        role: message.role,
        content: this.anonymizeText.execute(message.content),
      })),
      { role: "user", content: anonymizedContent },
    ];

    yield* this.chatGateway.streamReply({
      conversationId: params.conversationId,
      anonymizedMessages,
      hasActiveRiskSignal: params.hasActiveRiskSignal,
    });
  }
}
