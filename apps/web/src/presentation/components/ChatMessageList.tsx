import type { ChatUiMessage } from "../hooks/useChatConversation";

export function ChatMessageList({
  messages,
  crisisFallback,
  providerError,
}: {
  messages: ChatUiMessage[];
  crisisFallback: boolean;
  providerError: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={
            message.role === "user"
              ? "self-end rounded-lg bg-slate-800 px-3 py-2 text-white"
              : "self-start rounded-lg bg-slate-100 px-3 py-2 text-slate-800"
          }
        >
          {message.content}
        </div>
      ))}
      {providerError && (
        <div className="rounded-lg bg-amber-100 p-3 text-amber-800">
          O acolhimento por IA está indisponível no momento. Tente novamente em instantes, ou use o
          atalho "Falar com uma pessoa real" abaixo.
        </div>
      )}
      {crisisFallback && (
        <div className="rounded-lg bg-red-100 p-3 text-red-800">
          Não conseguimos conectar você à IA agora. Se você está em risco, ligue para o CVV: 188.
        </div>
      )}
    </div>
  );
}
