import { z } from "zod";

/**
 * Text has already been scrubbed of identifiers client-side (PRD FR-5)
 * before it ever reaches this shape.
 */
export const AnonymizedMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});
export type AnonymizedMessage = z.infer<typeof AnonymizedMessageSchema>;

/** One chunk of a streamed AI reply — shape is provider-agnostic (spec Section D). */
export const ChatTokenSchema = z.object({
  conversationId: z.string().uuid(),
  delta: z.string(),
  done: z.boolean(),
});
export type ChatToken = z.infer<typeof ChatTokenSchema>;
