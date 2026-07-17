export interface StoredManagerInsight {
  id: string;
  interpretation: string;
  suggestedActions: string[];
  summary: string;
  generatedAt: Date;
}

export interface ManagerInsightRepository {
  save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void>;
  findAll(): Promise<StoredManagerInsight[]>;
}

export const MANAGER_INSIGHT_REPOSITORY = Symbol("MANAGER_INSIGHT_REPOSITORY");
