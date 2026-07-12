import type { ManagerSignalsPort, ManagerSignalsResponse } from "../../ports/manager-signals.port";
import { ManagerSignalsResponseSchema, UnauthorizedManagerError } from "../../ports/manager-signals.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpManagerSignalsAdapter implements ManagerSignalsPort {
  async fetchSignals(token: string): Promise<ManagerSignalsResponse> {
    const response = await fetch(`${API_BASE_URL}/manager/signals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      throw new UnauthorizedManagerError();
    }
    if (!response.ok) {
      throw new Error(`manager signals failed with status ${response.status}`);
    }

    return ManagerSignalsResponseSchema.parse(await response.json());
  }
}
