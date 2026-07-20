import type { AnonymizedMessage } from "@zelo/domain";
import type { ChatGatewayPort, ChatStreamEvent } from "@/ports/chat-gateway.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpChatGatewayAdapter implements ChatGatewayPort {
  async *streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    hasActiveRiskSignal: boolean;
  }): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.body) {
      yield { error: "ai_unavailable" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.trim().length === 0) continue;
        yield JSON.parse(line) as ChatStreamEvent;
      }
    }
  }
}
