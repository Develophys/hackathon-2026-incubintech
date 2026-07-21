import type { Assessment } from "@zelo/domain";
import type { AssessmentSubmissionPort } from "@/ports/assessment-submission.port";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class HttpAssessmentSubmissionAdapter implements AssessmentSubmissionPort {
  async submit(assessment: Assessment): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assessment),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit assessment: ${response.status}`);
    }
  }
}
