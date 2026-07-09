import type { FormEvent } from "react";
import { useState } from "react";

export function ChatComposer({
  isStreaming,
  onSend,
}: {
  isStreaming: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim().length === 0 || isStreaming) return;
    onSend(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Como você está se sentindo?"
        className="flex-1 rounded border px-3 py-2"
        disabled={isStreaming}
      />
      <button
        type="submit"
        disabled={isStreaming}
        className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
}
