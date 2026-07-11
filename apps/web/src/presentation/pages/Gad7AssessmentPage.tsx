import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { ProgressBar } from "../ui/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { GAD7_QUESTIONS } from "../../domain/assessment-scales/gad7";
import { FREQUENCY_RESPONSE_OPTIONS } from "../../domain/assessment-scales/frequency-scale";
import { useSubmitAssessment } from "../hooks/useSubmitAssessment";
import { routes } from "../lib/routes";

export function Gad7AssessmentPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useSubmitAssessment();
  const [answers, setAnswers] = useState<(number | undefined)[]>(() =>
    new Array(GAD7_QUESTIONS.length).fill(undefined),
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const total = GAD7_QUESTIONS.length;
  const isLast = questionIndex === total - 1;

  const handleBack = () => {
    if (questionIndex === 0) {
      navigate(routes.assessment);
      return;
    }
    setQuestionIndex((index) => index - 1);
  };

  const handleSelect = async (value: number) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = value;
    setAnswers(nextAnswers);

    if (!isLast) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    const result = await mutateAsync({ scaleType: "GAD-7", answers: nextAnswers as number[] });
    navigate(routes.result, {
      state: { scaleType: "GAD-7", totalScore: result.totalScore, max: 21, riskSignal: result.riskSignal },
    });
  };

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-6">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Voltar" onClick={handleBack} className="text-ink">
            ←
          </button>
          <div className="flex-1">
            <ProgressBar value={((questionIndex + 1) / total) * 100} />
          </div>
          <span className="font-mono text-[12px] text-muted-2">
            {questionIndex + 1}/{total}
          </span>
        </div>

        <p className="mt-[26px] text-caption text-muted-2">
          Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:
        </p>

        <QuestionCard
          question={GAD7_QUESTIONS[questionIndex]!}
          options={FREQUENCY_RESPONSE_OPTIONS}
          selected={answers[questionIndex]}
          onSelect={handleSelect}
        />
      </div>
    </PhoneShell>
  );
}
