export interface ManagerInsightResponse {
  interpretation: string;
  suggestedActions: string[];
}

export class InsightGenerationFailedError extends Error {}

export interface AiInsightPort {
  generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse>;
}

export const AI_INSIGHT_PORT = Symbol("AI_INSIGHT_PORT");
