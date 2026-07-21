import { ApiHealthResultSchema, type ApiHealthPort, type ApiHealthResult } from "@/ports/api-health.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpApiHealthAdapter implements ApiHealthPort {
  async check(): Promise<ApiHealthResult> {
    const response = await fetch(`${API_BASE_URL}/health`);
    const json = await response.json();
    return ApiHealthResultSchema.parse(json);
  }
}
