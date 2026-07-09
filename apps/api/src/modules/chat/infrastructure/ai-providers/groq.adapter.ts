import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import type { AiChatPort } from "../../application/ports/ai-chat.port.ts";
import type { AnonymizedMessage, ChatToken } from "@zelo/domain";

/**
 * Second free-tier alternative to ClaudeAdapter/GeminiAdapter, added for cost
 * reasons during hackathon development — same provider-swap story (spec
 * Section D), no changes to SendChatMessageUseCase/ChatController. Groq's
 * chat-completions API is OpenAI-compatible, so AnonymizedMessage's
 * "user"/"assistant" roles map through unchanged (unlike Gemini's "model").
 */
@Injectable()
export class GroqAdapter implements AiChatPort {
  private readonly client: Groq;
  private readonly model: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new Groq({ apiKey: config.getOrThrow<string>("GROQ_API_KEY") });
    this.model = config.get<string>("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
  }

  async *streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    systemPrompt: string;
  }): AsyncGenerator<ChatToken> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 512,
      stream: true,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...params.anonymizedMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (delta) {
        yield { conversationId: params.conversationId, delta, done: false };
      }
    }

    yield { conversationId: params.conversationId, delta: "", done: true };
  }
}
