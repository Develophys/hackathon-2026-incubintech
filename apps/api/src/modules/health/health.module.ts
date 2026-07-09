import { Module } from "@nestjs/common";
import { HealthController } from "./infrastructure/health.controller.ts";
import { CheckHealthUseCase } from "./application/use-cases/check-health.use-case.ts";
import { PrismaDatabaseHealthAdapter } from "./infrastructure/prisma-database-health.adapter.ts";
import { DATABASE_HEALTH_PORT } from "./application/ports/database-health.port.ts";

@Module({
  controllers: [HealthController],
  providers: [
    CheckHealthUseCase,
    { provide: DATABASE_HEALTH_PORT, useClass: PrismaDatabaseHealthAdapter },
  ],
})
export class HealthModule {}
