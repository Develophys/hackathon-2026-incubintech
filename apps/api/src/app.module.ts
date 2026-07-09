import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";
import { HealthModule } from "./modules/health/health.module.ts";
import { ChatModule } from "./modules/chat/chat.module.ts";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ChatModule,
  ],
})
export class AppModule {}
