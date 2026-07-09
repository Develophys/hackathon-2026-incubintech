import { useState } from "react";
import { HumanHandoffPanel } from "./HumanHandoffPanel";

export function AssessmentResultBanner({
  totalScore,
  riskSignal,
  submissionSucceeded,
}: {
  totalScore: number;
  riskSignal: boolean;
  submissionSucceeded: boolean;
}) {
  const [isHandoffOpen, setIsHandoffOpen] = useState(riskSignal);

  return (
    <div className="p-4">
      <p className="text-lg text-slate-800">
        Sua pontuação: <span className="font-bold">{totalScore}</span>
      </p>
      {!submissionSucceeded && (
        <p className="mt-2 text-sm text-amber-700">
          Seu resultado foi salvo neste dispositivo. Não foi possível sincronizar com o servidor agora —
          tentaremos novamente mais tarde.
        </p>
      )}
      {riskSignal && (
        <p className="mt-4 rounded bg-red-50 p-3 text-red-800">
          Notamos um sinal importante na sua resposta. Você não está sozinho(a).
        </p>
      )}
      {isHandoffOpen && <HumanHandoffPanel onClose={() => setIsHandoffOpen(false)} />}
    </div>
  );
}
