import { describe, expect, it } from "vitest";
import { GetAssessmentHistoryUseCase, startOfIsoWeek } from "./get-assessment-history.usecase";
import { ScoreAssessmentUseCase } from "./score-assessment.usecase";
import type { EncryptionPort } from "../ports/encryption.port";
import type { LocalAssessmentStorePort } from "../ports/local-assessment-store.port";
import type { AssessmentRecord } from "../domain/assessment-record";

class FakeEncryptionPort implements EncryptionPort {
  async encrypt(plaintext: string): Promise<string> {
    return plaintext;
  }
  async decrypt(ciphertext: string): Promise<string> {
    if (ciphertext === "corrupt") throw new Error("bad ciphertext");
    return ciphertext;
  }
}

class FakeLocalStore implements LocalAssessmentStorePort {
  constructor(private records: AssessmentRecord[]) {}
  async save(): Promise<void> {}
  async listAll(): Promise<AssessmentRecord[]> {
    return this.records;
  }
}

/** Thursday of the week N weeks before the current one — safely mid-week so the fixture
 * never lands on an ISO week boundary regardless of what day the test suite runs on. */
function midWeek(weeksAgo: number): string {
  const start = startOfIsoWeek(new Date());
  start.setUTCDate(start.getUTCDate() - weeksAgo * 7 + 3);
  return start.toISOString();
}

function record(overrides: Partial<AssessmentRecord>): AssessmentRecord {
  return {
    id: "r1",
    scaleType: "PHQ-9",
    capturedAt: midWeek(0),
    ciphertext: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    riskSignal: false,
    ...overrides,
  };
}

function buildUseCase(records: AssessmentRecord[]) {
  return new GetAssessmentHistoryUseCase(
    new FakeLocalStore(records),
    new FakeEncryptionPort(),
    new ScoreAssessmentUseCase(),
  );
}

describe("GetAssessmentHistoryUseCase", () => {
  it("returns 6 weekly buckets with null severity when there is no history", async () => {
    const result = await buildUseCase([]).execute();
    expect(result).toHaveLength(6);
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("decrypts and re-scores this week's record into the last bucket", async () => {
    const useCase = buildUseCase([
      record({ ciphertext: JSON.stringify([1, 1, 1, 0, 0, 0, 0, 0, 0]) }), // PHQ-9 sum=3
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(3 / 27);
    expect(result.slice(0, 5).every((point) => point.severityFraction === null)).toBe(true);
  });

  it("uses GAD-7's own max (21) to compute the severity fraction", async () => {
    const useCase = buildUseCase([
      record({ scaleType: "GAD-7", ciphertext: JSON.stringify([1, 1, 1, 1, 1, 1, 1]) }), // sum=7
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(7 / 21);
  });

  it("keeps only the most recent record when two fall in the same week", async () => {
    const earlier = midWeek(0);
    // One day after `earlier`, still inside the same week bucket — a real time difference,
    // not two records racing on the same millisecond (which a stable sort wouldn't resolve
    // the way this test expects).
    const later = new Date(new Date(earlier).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const useCase = buildUseCase([
      record({ capturedAt: earlier, ciphertext: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0]) }), // score 0
      record({ id: "r2", capturedAt: later, ciphertext: JSON.stringify([3, 3, 3, 3, 3, 3, 3, 3, 3]) }), // score 27
    ]);
    const result = await useCase.execute();
    expect(result[5]?.severityFraction).toBeCloseTo(27 / 27);
  });

  it("skips a record that fails to decrypt instead of throwing", async () => {
    const result = await buildUseCase([record({ ciphertext: "corrupt" })]).execute();
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("skips MBI-HSS records defensively, since ScoreAssessmentUseCase throws for that scale", async () => {
    const result = await buildUseCase([record({ scaleType: "MBI-HSS" })]).execute();
    expect(result.every((point) => point.severityFraction === null)).toBe(true);
  });

  it("places a record from 3 weeks ago in the correct bucket", async () => {
    const useCase = buildUseCase([
      record({ capturedAt: midWeek(3), ciphertext: JSON.stringify([2, 2, 2, 0, 0, 0, 0, 0, 0]) }), // score 6
    ]);
    const result = await useCase.execute();
    expect(result[2]?.severityFraction).toBeCloseTo(6 / 27);
    expect(result.filter((_, idx) => idx !== 2).every((point) => point.severityFraction === null)).toBe(true);
  });
});
