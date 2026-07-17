import { z } from "zod";

export const StoredManagerInsightSchema = z.object({
  id: z.string(),
  interpretation: z.string(),
  suggestedActions: z.array(z.string()),
  summary: z.string(),
  generatedAt: z.string(),
});
export type StoredManagerInsight = z.infer<typeof StoredManagerInsightSchema>;

export interface ManagerInsightHistoryPort {
  fetchHistory(token: string): Promise<StoredManagerInsight[]>;
}
