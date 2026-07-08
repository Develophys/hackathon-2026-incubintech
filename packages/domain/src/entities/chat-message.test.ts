import { describe, expect, it } from "vitest";
import { AnonymizedMessageSchema, ChatTokenSchema } from "./chat-message";

describe("chat-message schemas", () => {
  it("accepts an anonymized outgoing message", () => {
    const result = AnonymizedMessageSchema.safeParse({
      role: "user",
      content: "I've been feeling exhausted after every shift.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a single streamed chat token", () => {
    const result = ChatTokenSchema.safeParse({
      conversationId: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
      delta: "I hear",
      done: false,
    });

    expect(result.success).toBe(true);
  });
});
