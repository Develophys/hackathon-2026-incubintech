import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatController } from "./infrastructure/chat.controller.ts";
import { SendChatMessageUseCase } from "./application/use-cases/send-chat-message.use-case.ts";
import { GroqAdapter } from "./infrastructure/ai-providers/groq.adapter.ts";
import { FakeChatAdapter } from "./infrastructure/ai-providers/fake-chat.adapter.ts";
import { AI_CHAT_PORT } from "./application/ports/ai-chat.port.ts";

// Read directly from process.env (not ConfigService) so that only the
// selected adapter is ever instantiated — AI_PROVIDER=mock must not require
// a GROQ_API_KEY, but GroqAdapter's constructor calls config.getOrThrow for it.
const aiChatPortProvider =
  process.env.AI_PROVIDER === "mock"
    ? { provide: AI_CHAT_PORT, useClass: FakeChatAdapter }
    : { provide: AI_CHAT_PORT, useClass: GroqAdapter };

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [SendChatMessageUseCase, aiChatPortProvider],
})
export class ChatModule {}
