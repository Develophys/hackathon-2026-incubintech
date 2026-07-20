import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbAssessmentStoreAdapter } from "./indexeddb-assessment-store.adapter";
import type { AssessmentRecord } from "@/domain/assessment-record";

const SAMPLE_RECORD: AssessmentRecord = {
  id: "b3f1c2b0-1234-4a5b-9c6d-000000000001",
  scaleType: "PHQ-9",
  capturedAt: "2026-07-07T12:00:00.000Z",
  ciphertext: "base64-ciphertext==",
  riskSignal: true,
};

describe("IndexedDbAssessmentStoreAdapter", () => {
  it("saves a record and returns it in listAll, including riskSignal", async () => {
    const adapter = new IndexedDbAssessmentStoreAdapter();

    await adapter.save(SAMPLE_RECORD);
    const all = await adapter.listAll();

    expect(all).toEqual([SAMPLE_RECORD]);
  });
});
