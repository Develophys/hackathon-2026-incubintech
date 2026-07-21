import { useCallback, useState } from "react";
import type { AnonymizedMessage } from "@zelo/domain";
import { sendChatMessageUseCase } from "@/app/container";
import { isChatErrorEvent } from "@/ports/chat-gateway.port";

export interface ChatUiMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Uses plain React state instead of TanStack Query: TanStack Query models a
 * single request → response cycle, but this hook consumes an incremental
 * token stream and must re-render on every chunk. The spec's "TanStack Query
 * lives in presentation/hooks" rule is honored in spirit — this is still the
 * hooks layer, just using the primitive that actually fits a streaming case.
 */
export function useChatConversation(conversationId: string) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisisFallback, setCrisisFallback] = useState(false);
  const [providerError, setProviderError] = useState(false);

  const sendMessage = useCallback(
    async (rawUserText: string, hasActiveRiskSignal: boolean) => {
      const history: AnonymizedMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: "user", content: rawUserText }, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      setProviderError(false);
      setCrisisFallback(false);

      let assistantContent = "";

      for await (const event of sendChatMessageUseCase.execute({
        conversationId,
        history,
        rawUserText,
        hasActiveRiskSignal,
      })) {
        if (isChatErrorEvent(event)) {
          if (event.error === "crisis_fallback_required") {
            setCrisisFallback(true);
          } else {
            setProviderError(true);
          }
          continue;
        }
        assistantContent += event.delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantContent };
          return next;
        });
      }

      setIsStreaming(false);
    },
    [conversationId, messages],
  );

  return { messages, isStreaming, crisisFallback, providerError, sendMessage };
}
