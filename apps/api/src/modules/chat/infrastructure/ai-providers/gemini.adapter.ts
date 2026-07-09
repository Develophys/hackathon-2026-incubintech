import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import type { AiChatPort } from "../../application/ports/ai-chat.port.ts";
import type { AnonymizedMessage, ChatToken } from "@zelo/domain";

/**
 * Free-tier alternative to ClaudeAdapter, added for cost reasons during
 * hackathon development (no changes to SendChatMessageUseCase/ChatController
 * needed — this is exactly the provider-swap story the AI_PROVIDER factory
 * in chat.module.ts was built for). Gemini's roles are "user"/"model", not
 * "user"/"assistant" like AnonymizedMessage/Anthropic, so roles are mapped.
 */
@Injectable()
export class GeminiAdapter implements AiChatPort {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new GoogleGenAI({ apiKey: config.getOrThrow<string>("GEMINI_API_KEY") });
    this.model = config.get<string>("GEMINI_MODEL") ?? "gemini-2.5-flash";
  }

  async *streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    systemPrompt: string;
  }): AsyncGenerator<ChatToken> {
    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: params.anonymizedMessages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: 512,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield { conversationId: params.conversationId, delta: chunk.text, done: false };
      }
    }

    yield { conversationId: params.conversationId, delta: "", done: true };
  }
}
