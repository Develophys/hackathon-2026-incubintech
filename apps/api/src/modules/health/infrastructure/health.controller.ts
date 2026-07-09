import { Controller, Get, Inject } from "@nestjs/common";
import { CheckHealthUseCase } from "../application/use-cases/check-health.use-case.ts";

@Controller("health")
export class HealthController {
  constructor(@Inject(CheckHealthUseCase) private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  async get() {
    return this.checkHealth.execute();
  }
}
