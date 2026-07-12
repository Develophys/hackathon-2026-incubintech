import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";
import { HealthModule } from "./modules/health/health.module.ts";
import { ChatModule } from "./modules/chat/chat.module.ts";
import { AssessmentModule } from "./modules/assessment/assessment.module.ts";
import { ManagerModule } from "./modules/manager/manager.module.ts";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ChatModule,
    AssessmentModule,
    ManagerModule,
  ],
})
export class AppModule {}
