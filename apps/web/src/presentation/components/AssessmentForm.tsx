import { useState } from "react";
import type { FormEvent } from "react";

interface AssessmentFormProps {
  questions: readonly string[];
  responseOptions: readonly { value: number; label: string }[];
  isSubmitting: boolean;
  onSubmit: (answers: number[]) => void;
}

export function AssessmentForm({ questions, responseOptions, isSubmitting, onSubmit }: AssessmentFormProps) {
  const [answers, setAnswers] = useState<Array<number | undefined>>(() =>
    new Array(questions.length).fill(undefined),
  );

  const isComplete = answers.every((value) => value !== undefined);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isComplete) return;
    onSubmit(answers as number[]);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
      {questions.map((question, questionIndex) => (
        <fieldset key={questionIndex} className="border-b pb-4">
          <legend className="mb-2 font-medium text-slate-800">{question}</legend>
          <div className="flex flex-col gap-1">
            {responseOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={option.value}
                  checked={answers[questionIndex] === option.value}
                  onChange={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[questionIndex] = option.value;
                      return next;
                    })
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        type="submit"
        disabled={!isComplete || isSubmitting}
        className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Calculando..." : "Ver resultado"}
      </button>
    </form>
  );
}
