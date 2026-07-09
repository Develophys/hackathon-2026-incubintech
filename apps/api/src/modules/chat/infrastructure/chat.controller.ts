import { BadRequestException, Body, Controller, Inject, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AnonymizedMessageSchema } from "@zelo/domain";
import { SendChatMessageUseCase, CrisisFallbackRequiredError } from "../application/use-cases/send-chat-message.use-case.ts";

const SendChatMessageRequestSchema = z.object({
  conversationId: z.string().min(1),
  anonymizedMessages: z.array(AnonymizedMessageSchema),
  hasActiveRiskSignal: z.boolean(),
});

@Controller("chat")
export class ChatController {
  constructor(@Inject(SendChatMessageUseCase) private readonly sendChatMessage: SendChatMessageUseCase) {}

  @Post("stream")
  async stream(@Body() body: unknown, @Res() res: Response): Promise<void> {
    const parsed = SendChatMessageRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const params = parsed.data;

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");

    try {
      for await (const token of this.sendChatMessage.execute(params)) {
        res.write(`${JSON.stringify(token)}\n`);
      }
    } catch (error) {
      const code = error instanceof CrisisFallbackRequiredError ? "crisis_fallback_required" : "ai_unavailable";
      res.write(`${JSON.stringify({ error: code })}\n`);
    } finally {
      res.end();
    }
  }
}
