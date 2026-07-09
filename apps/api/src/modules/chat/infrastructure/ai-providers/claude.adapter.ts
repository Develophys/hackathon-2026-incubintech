import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import type { AiChatPort } from "../../application/ports/ai-chat.port.ts";
import type { AnonymizedMessage, ChatToken } from "@zelo/domain";

@Injectable()
export class ClaudeAdapter implements AiChatPort {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow<string>("ANTHROPIC_API_KEY") });
    this.model = config.get<string>("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
  }

  async *streamReply(params: {
    conversationId: string;
    anonymizedMessages: AnonymizedMessage[];
    systemPrompt: string;
  }): AsyncGenerator<ChatToken> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 512,
      system: params.systemPrompt,
      messages: params.anonymizedMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { conversationId: params.conversationId, delta: event.delta.text, done: false };
      }
    }

    yield { conversationId: params.conversationId, delta: "", done: true };
  }
}
