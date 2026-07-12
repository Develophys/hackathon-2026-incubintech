import { Module } from "@nestjs/common";
import { ManagerController } from "./infrastructure/manager.controller.ts";
import { ManagerAuthGuard } from "./infrastructure/manager-auth.guard.ts";
import { PrismaSimulatedSignalRepository } from "./infrastructure/persistence/prisma-simulated-signal.repository.ts";
import { LoginManagerUseCase } from "./application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase } from "./application/use-cases/get-manager-signals.use-case.ts";
import { ManagerTokenService } from "./application/services/manager-token.service.ts";
import { SIMULATED_SIGNAL_REPOSITORY } from "./application/ports/simulated-signal-repository.port.ts";

@Module({
  controllers: [ManagerController],
  providers: [
    LoginManagerUseCase,
    GetManagerSignalsUseCase,
    ManagerTokenService,
    ManagerAuthGuard,
    { provide: SIMULATED_SIGNAL_REPOSITORY, useClass: PrismaSimulatedSignalRepository },
  ],
})
export class ManagerModule {}
