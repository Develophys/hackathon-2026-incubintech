import type { AssessmentScaleType } from "@zelo/domain";
import type { AssessmentRecord } from "../domain/assessment-record";
import type { ScoreAssessmentUseCase } from "./score-assessment.usecase";
import type { EncryptAssessmentUseCase } from "./encrypt-assessment.usecase";
import type { LocalAssessmentStorePort } from "../ports/local-assessment-store.port";
import type { AssessmentSubmissionPort } from "../ports/assessment-submission.port";

export interface SubmitAssessmentParams {
  scaleType: AssessmentScaleType;
  answers: number[];
}

export interface SubmitAssessmentResult {
  totalScore: number;
  riskSignal: boolean;
  submissionSucceeded: boolean;
}

export class SubmitAssessmentUseCase {
  constructor(
    private readonly scoreAssessment: ScoreAssessmentUseCase,
    private readonly encryptAssessment: EncryptAssessmentUseCase,
    private readonly localStore: LocalAssessmentStorePort,
    private readonly submission: AssessmentSubmissionPort,
  ) {}

  async execute(params: SubmitAssessmentParams): Promise<SubmitAssessmentResult> {
    const { totalScore, riskSignal } = this.scoreAssessment.execute(params.scaleType, params.answers);
    const { ciphertext } = await this.encryptAssessment.execute(JSON.stringify(params.answers));

    const record: AssessmentRecord = {
      id: crypto.randomUUID(),
      scaleType: params.scaleType,
      capturedAt: new Date().toISOString(),
      ciphertext,
      riskSignal,
    };

    // Local save always happens first and is never blocked by network state
    // (PRD edge case: "Conexão instável... nenhum dado é perdido").
    await this.localStore.save(record);

    let submissionSucceeded = true;
    try {
      // Only the backend wire shape (id, scaleType, capturedAt, ciphertext) is
      // sent — riskSignal is never constructed as part of this object.
      await this.submission.submit({
        id: record.id,
        scaleType: record.scaleType,
        capturedAt: record.capturedAt,
        ciphertext: record.ciphertext,
      });
    } catch {
      submissionSucceeded = false;
    }

    return { totalScore, riskSignal, submissionSucceeded };
  }
}
