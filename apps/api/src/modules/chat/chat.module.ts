import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatController } from "./infrastructure/chat.controller.ts";
import { SendChatMessageUseCase } from "./application/use-cases/send-chat-message.use-case.ts";
import { ClaudeAdapter } from "./infrastructure/ai-providers/claude.adapter.ts";
import { GeminiAdapter } from "./infrastructure/ai-providers/gemini.adapter.ts";
import { GroqAdapter } from "./infrastructure/ai-providers/groq.adapter.ts";
import { AI_CHAT_PORT } from "./application/ports/ai-chat.port.ts";

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [
    SendChatMessageUseCase,
    ClaudeAdapter,
    GeminiAdapter,
    GroqAdapter,
    {
      provide: AI_CHAT_PORT,
      useFactory: (
        config: ConfigService,
        claudeAdapter: ClaudeAdapter,
        geminiAdapter: GeminiAdapter,
        groqAdapter: GroqAdapter,
      ) => {
        const provider = config.get<string>("AI_PROVIDER") ?? "claude";
        if (provider === "claude") {
          return claudeAdapter;
        }
        if (provider === "gemini") {
          return geminiAdapter;
        }
        if (provider === "groq") {
          return groqAdapter;
        }
        // Adding a new provider later: write `SomeOtherAdapter implements AiChatPort`,
        // add it to `providers` above, and add one branch here. SendChatMessageUseCase
        // and ChatController never change (spec Section D).
        throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
      },
      inject: [ConfigService, ClaudeAdapter, GeminiAdapter, GroqAdapter],
    },
  ],
})
export class ChatModule {}
