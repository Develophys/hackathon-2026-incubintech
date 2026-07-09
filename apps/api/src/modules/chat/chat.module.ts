import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatController } from "./infrastructure/chat.controller.ts";
import { SendChatMessageUseCase } from "./application/use-cases/send-chat-message.use-case.ts";
import { ClaudeAdapter } from "./infrastructure/ai-providers/claude.adapter.ts";
import { AI_CHAT_PORT } from "./application/ports/ai-chat.port.ts";

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [
    SendChatMessageUseCase,
    ClaudeAdapter,
    {
      provide: AI_CHAT_PORT,
      useFactory: (config: ConfigService, claudeAdapter: ClaudeAdapter) => {
        const provider = config.get<string>("AI_PROVIDER") ?? "claude";
        if (provider === "claude") {
          return claudeAdapter;
        }
        // Adding a new provider later: write `SomeOtherAdapter implements AiChatPort`,
        // add it to `providers` above, and add one branch here. SendChatMessageUseCase
        // and ChatController never change (spec Section D).
        throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
      },
      inject: [ConfigService, ClaudeAdapter],
    },
  ],
})
export class ChatModule {}
