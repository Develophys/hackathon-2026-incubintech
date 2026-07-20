import type { ApiHealthPort, ApiHealthResult } from "@/ports/api-health.port";

export class CheckApiHealthUseCase {
  constructor(private readonly apiHealth: ApiHealthPort) {}

  async execute(): Promise<ApiHealthResult> {
    return this.apiHealth.check();
  }
}
