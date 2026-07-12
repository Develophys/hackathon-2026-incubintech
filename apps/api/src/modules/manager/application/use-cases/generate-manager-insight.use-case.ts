import { Inject, Injectable } from "@nestjs/common";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "./get-manager-signals.use-case.ts";
import { AI_INSIGHT_PORT, type AiInsightPort, type ManagerInsightResponse } from "../ports/ai-insight.port.ts";
import { MANAGER_INSIGHT_SYSTEM_PROMPT } from "../prompts/manager-insight-system-prompt.ts";

@Injectable()
export class GenerateManagerInsightUseCase {
  constructor(
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(AI_INSIGHT_PORT) private readonly aiInsight: AiInsightPort,
  ) {}

  async execute(): Promise<ManagerInsightResponse> {
    const signals = await this.getManagerSignals.execute();
    const summary = this.formatSummary(signals);
    return this.aiInsight.generateInsight({ summary, systemPrompt: MANAGER_INSIGHT_SYSTEM_PROMPT });
  }

  private formatSummary(signals: ManagerSignalsResponse): string {
    const trendLine = signals.weeklyTrend.map((point) => `${Math.round(point.concerningRate * 100)}%`).join(", ");
    const segmentLines = signals.segments
      .map((segment) => `  - ${segment.label}: ${segment.value}% (n=${segment.n})`)
      .join("\n");

    return [
      "Dados agregados da equipe (última semana visível, últimas 6 semanas de tendência):",
      `- Taxa geral de sinais preocupantes: ${Math.round(signals.overallConcerningRate * 100)}%`,
      `- Check-ins nas últimas 4 semanas: ${signals.checkInsLast4Weeks}`,
      `- Tendência semanal (taxa de sinais preocupantes por semana, ${signals.weeklyTrend.length} semanas): ${trendLine}`,
      "- Por setor (apenas setores com 5+ respostas, por privacidade):",
      segmentLines,
    ].join("\n");
  }
}
