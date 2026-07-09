import type { AnonymizedMessage, ChatToken } from "@zelo/domain";

export interface ChatErrorEvent {
  error: "ai_unavailable" | "crisis_fallback_required";
}

export type ChatStreamEvent = ChatToken | ChatErrorEvent;

export function isChatErrorEvent(event: ChatStreamEvent): event is ChatErrorEvent {
  return "error" in event;
}

export interface ChatGatewayPort {
  streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    hasActiveRiskSignal: boolean;
  }): AsyncGenerator<ChatStreamEvent>;
}
