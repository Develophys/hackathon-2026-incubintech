import type { AssessmentScaleType } from "@zelo/domain";
import { PHQ9_QUESTIONS, PHQ9_RISK_ITEM_INDEX } from "@/domain/assessment-scales/phq9";
import { GAD7_QUESTIONS } from "@/domain/assessment-scales/gad7";

export interface ScoreResult {
  totalScore: number;
  riskSignal: boolean;
}

export class ScoreAssessmentUseCase {
  execute(scaleType: AssessmentScaleType, answers: number[]): ScoreResult {
    if (scaleType === "MBI-HSS") {
      throw new Error(
        "MBI-HSS scoring is not implemented — item text is licensed (Mind Garden) and has not been " +
          "procured for this PoC. See docs/superpowers/plans/2026-07-07-06-assessment-vertical.md, Global Constraints.",
      );
    }

    const expectedLength = scaleType === "PHQ-9" ? PHQ9_QUESTIONS.length : GAD7_QUESTIONS.length;
    if (answers.length !== expectedLength) {
      throw new Error(`Expected ${expectedLength} answers for ${scaleType}, got ${answers.length}`);
    }

    const totalScore = answers.reduce((sum, value) => sum + value, 0);
    const riskSignal = scaleType === "PHQ-9" ? (answers[PHQ9_RISK_ITEM_INDEX] ?? 0) > 0 : false;

    return { totalScore, riskSignal };
  }
}
