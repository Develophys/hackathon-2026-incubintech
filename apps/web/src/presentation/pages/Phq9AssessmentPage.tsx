import { PHQ9_QUESTIONS } from "../../domain/assessment-scales/phq9";
import { FREQUENCY_RESPONSE_OPTIONS } from "../../domain/assessment-scales/frequency-scale";
import { AssessmentForm } from "../components/AssessmentForm";
import { AssessmentResultBanner } from "../components/AssessmentResultBanner";
import { useSubmitAssessment } from "../hooks/useSubmitAssessment";

export function Phq9AssessmentPage() {
  const { mutate, data, isPending } = useSubmitAssessment();

  if (data) {
    return (
      <AssessmentResultBanner
        totalScore={data.totalScore}
        riskSignal={data.riskSignal}
        submissionSucceeded={data.submissionSucceeded}
      />
    );
  }

  return (
    <div>
      <h1 className="p-4 text-xl font-semibold text-slate-800">Autoavaliação PHQ-9</h1>
      <AssessmentForm
        questions={PHQ9_QUESTIONS}
        responseOptions={FREQUENCY_RESPONSE_OPTIONS}
        isSubmitting={isPending}
        onSubmit={(answers) => mutate({ scaleType: "PHQ-9", answers })}
      />
    </div>
  );
}
