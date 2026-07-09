import type { AnonymizedMessage, ChatToken } from "@zelo/domain";

export interface AiChatPort {
  streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    systemPrompt: string;
  }): AsyncGenerator<ChatToken>;
}

export const AI_CHAT_PORT = Symbol("AI_CHAT_PORT");
