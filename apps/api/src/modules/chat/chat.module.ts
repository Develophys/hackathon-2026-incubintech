import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatController } from "./infrastructure/chat.controller.ts";
import { SendChatMessageUseCase } from "./application/use-cases/send-chat-message.use-case.ts";
import { GroqAdapter } from "./infrastructure/ai-providers/groq.adapter.ts";
import { AI_CHAT_PORT } from "./application/ports/ai-chat.port.ts";

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [
    SendChatMessageUseCase,
    GroqAdapter,
    { provide: AI_CHAT_PORT, useExisting: GroqAdapter },
  ],
})
export class ChatModule {}
