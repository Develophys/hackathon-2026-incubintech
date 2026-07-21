import type { AssessmentRecord } from "@/domain/assessment-record";

export interface LocalAssessmentStorePort {
  save(record: AssessmentRecord): Promise<void>;
  listAll(): Promise<AssessmentRecord[]>;
}
