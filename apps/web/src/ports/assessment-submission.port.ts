import type { Assessment } from "@zelo/domain";

export interface AssessmentSubmissionPort {
  submit(assessment: Assessment): Promise<void>;
}
