import type { ManagerInsightPort, ManagerInsightResult } from "@/ports/manager-insight.port";
import { ManagerInsightResultSchema, InsightGenerationFailedError } from "@/ports/manager-insight.port";
import { UnauthorizedManagerError } from "@/ports/manager-signals.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpManagerInsightAdapter implements ManagerInsightPort {
  async generateInsight(token: string): Promise<ManagerInsightResult> {
    const response = await fetch(`${API_BASE_URL}/manager/insights`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      throw new UnauthorizedManagerError();
    }
    if (response.status === 502) {
      throw new InsightGenerationFailedError();
    }
    if (!response.ok) {
      throw new Error(`manager insight generation failed with status ${response.status}`);
    }

    return ManagerInsightResultSchema.parse(await response.json());
  }
}
