import { describe, expect, it } from "vitest";
import { CHAT_SYSTEM_PROMPT } from "./chat-system-prompt";

describe("CHAT_SYSTEM_PROMPT", () => {
  it("caps the assistant to one question per reply", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/no máximo uma pergunta por resposta/i);
  });

  it("permits the assistant to suggest a quick check-in when it detects distress", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/avaliação rápida/i);
  });
});
