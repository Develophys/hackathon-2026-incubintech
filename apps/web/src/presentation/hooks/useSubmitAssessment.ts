import { useMutation } from "@tanstack/react-query";
import { submitAssessmentUseCase } from "@/app/container";
import type { SubmitAssessmentParams } from "@/use-cases/submit-assessment.usecase";

export function useSubmitAssessment() {
  return useMutation({
    mutationFn: (params: SubmitAssessmentParams) => submitAssessmentUseCase.execute(params),
  });
}
