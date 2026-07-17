import type { ManagerInsightHistoryPort, StoredManagerInsight } from "../ports/manager-insight-history.port";

export class GetManagerInsightHistoryUseCase {
  constructor(private readonly historyPort: ManagerInsightHistoryPort) {}

  async execute(token: string): Promise<StoredManagerInsight[]> {
    return this.historyPort.fetchHistory(token);
  }
}
