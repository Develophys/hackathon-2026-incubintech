import type { Assessment } from "@zelo/domain";

export interface AssessmentRepository {
  save(assessment: Assessment): Promise<void>;
}

export const ASSESSMENT_REPOSITORY = Symbol("ASSESSMENT_REPOSITORY");
