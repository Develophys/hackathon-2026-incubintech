import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_HEALTH_PORT, type DatabaseHealthPort } from "../ports/database-health.port.ts";

export interface HealthResult {
  status: "ok" | "degraded";
  database: boolean;
}

@Injectable()
export class CheckHealthUseCase {
  constructor(
    @Inject(DATABASE_HEALTH_PORT) private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  async execute(): Promise<HealthResult> {
    const database = await this.databaseHealth.isReachable();
    return { status: database ? "ok" : "degraded", database };
  }
}
