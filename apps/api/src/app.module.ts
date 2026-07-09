import { Module } from "@nestjs/common";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";
import { HealthModule } from "./modules/health/health.module.ts";

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
