import type { LocalAssessmentStorePort } from "@/ports/local-assessment-store.port";
import type { EncryptionPort } from "@/ports/encryption.port";
import type { ScoreAssessmentUseCase } from "./score-assessment.usecase";

export interface WeeklyHistoryPoint {
  weekStart: string;
  severityFraction: number | null;
}

const WEEKS_TO_SHOW = 6;

/** Monday 00:00 UTC of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday(0) -> 7, so Monday(1) is always the start
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

interface ScoredPoint {
  capturedAt: Date;
  severityFraction: number;
}

export class GetAssessmentHistoryUseCase {
  constructor(
    private readonly localStore: LocalAssessmentStorePort,
    private readonly encryption: EncryptionPort,
    private readonly scoreAssessment: ScoreAssessmentUseCase,
  ) {}

  async execute(): Promise<WeeklyHistoryPoint[]> {
    const records = await this.localStore.listAll();
    const scored: ScoredPoint[] = [];

    for (const record of records) {
      if (record.scaleType === "MBI-HSS") continue;
      try {
        const plaintext = await this.encryption.decrypt(record.ciphertext);
        const answers = JSON.parse(plaintext) as number[];
        const { totalScore } = this.scoreAssessment.execute(record.scaleType, answers);
        // record.scaleType is "PHQ-9" | "GAD-7" here (MBI-HSS already skipped above) —
        // a direct ternary avoids relying on narrowing to index a lookup table.
        const max = record.scaleType === "PHQ-9" ? 27 : 21;
        scored.push({ capturedAt: new Date(record.capturedAt), severityFraction: totalScore / max });
      } catch {
        continue;
      }
    }

    return this.bucketIntoWeeks(scored);
  }

  private bucketIntoWeeks(scored: ScoredPoint[]): WeeklyHistoryPoint[] {
    const currentWeekStart = startOfIsoWeek(new Date());
    const buckets: WeeklyHistoryPoint[] = [];

    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      const inWeek = scored
        .filter((point) => point.capturedAt >= weekStart && point.capturedAt < weekEnd)
        .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

      buckets.push({
        weekStart: weekStart.toISOString(),
        severityFraction: inWeek[0]?.severityFraction ?? null,
      });
    }

    return buckets;
  }
}
