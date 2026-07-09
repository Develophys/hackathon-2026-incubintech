import { Inject, Injectable } from "@nestjs/common";
import type { AnonymizedMessage, ChatToken } from "@zelo/domain";
import { AI_CHAT_PORT, type AiChatPort } from "../ports/ai-chat.port.ts";
import { CHAT_SYSTEM_PROMPT } from "../prompts/chat-system-prompt.ts";

export class AiProviderUnavailableError extends Error {
  constructor() {
    super("AI chat provider is currently unavailable");
    this.name = "AiProviderUnavailableError";
  }
}

/**
 * Thrown instead of AiProviderUnavailableError when a risk signal is already
 * active for this session — the caller (controller/frontend) must route to
 * the crisis fallback path (external line) rather than a generic error,
 * per the PRD's documented edge case for LLM outages during an active risk.
 */
export class CrisisFallbackRequiredError extends Error {
  constructor() {
    super("AI provider unavailable during an active risk signal — crisis fallback required");
    this.name = "CrisisFallbackRequiredError";
  }
}

export interface SendChatMessageParams {
  conversationId: string;
  anonymizedMessages: AnonymizedMessage[];
  hasActiveRiskSignal: boolean;
}

@Injectable()
export class SendChatMessageUseCase {
  constructor(@Inject(AI_CHAT_PORT) private readonly aiChat: AiChatPort) {}

  async *execute(params: SendChatMessageParams): AsyncGenerator<ChatToken> {
    try {
      yield* this.aiChat.streamReply({
        conversationId: params.conversationId,
        anonymizedMessages: params.anonymizedMessages,
        systemPrompt: CHAT_SYSTEM_PROMPT,
      });
    } catch {
      if (params.hasActiveRiskSignal) {
        throw new CrisisFallbackRequiredError();
      }
      throw new AiProviderUnavailableError();
    }
  }
}
