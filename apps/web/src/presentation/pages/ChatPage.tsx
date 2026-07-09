import { useState } from "react";
import { useChatConversation } from "../hooks/useChatConversation";
import { ChatMessageList } from "../components/ChatMessageList";
import { ChatComposer } from "../components/ChatComposer";
import { HumanHandoffPanel } from "../components/HumanHandoffPanel";

const CONVERSATION_ID = "00000000-0000-4000-8000-000000000001";

export function ChatPage() {
  const { messages, isStreaming, crisisFallback, providerError, sendMessage } =
    useChatConversation(CONVERSATION_ID);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-slate-50 p-3 text-center text-sm text-slate-600">
        Este chat é acolhimento por IA e não substitui atendimento profissional.
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatMessageList messages={messages} crisisFallback={crisisFallback} providerError={providerError} />
      </div>

      <div className="border-t p-3 text-center">
        <button
          onClick={() => setIsHandoffOpen(true)}
          className="text-sm font-semibold text-slate-700 underline"
        >
          Falar com uma pessoa real
        </button>
      </div>

      <ChatComposer isStreaming={isStreaming} onSend={(text) => sendMessage(text, crisisFallback)} />

      {isHandoffOpen && <HumanHandoffPanel onClose={() => setIsHandoffOpen(false)} />}
    </div>
  );
}
