import { Module } from "@nestjs/common";
import { ManagerController } from "./infrastructure/manager.controller.ts";
import { ManagerAuthGuard } from "./infrastructure/manager-auth.guard.ts";
import { PrismaSimulatedSignalRepository } from "./infrastructure/persistence/prisma-simulated-signal.repository.ts";
import { GroqInsightAdapter } from "./infrastructure/ai-providers/groq-insight.adapter.ts";
import { LoginManagerUseCase } from "./application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase } from "./application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "./application/use-cases/generate-manager-insight.use-case.ts";
import { ManagerTokenService } from "./application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "./application/ports/simulated-signal-repository.port.ts";
import { AI_INSIGHT_PORT } from "./application/ports/ai-insight.port.ts";

@Module({
  controllers: [ManagerController],
  providers: [
    LoginManagerUseCase,
    GetManagerSignalsUseCase,
    GenerateManagerInsightUseCase,
    ManagerTokenService,
    ManagerAuthGuard,
    { provide: SIMULATED_SIGNAL_REPOSITORY, useClass: PrismaSimulatedSignalRepository },
    { provide: AI_INSIGHT_PORT, useClass: GroqInsightAdapter },
  ],
})
export class ManagerModule {}
