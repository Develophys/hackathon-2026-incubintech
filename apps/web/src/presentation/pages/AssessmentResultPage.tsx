import { useEffect } from "react";
import { Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { ResultBandCard } from "../components/ResultBandCard";
import { RiskSignalCallout } from "../components/RiskSignalCallout";
import { bandFor } from "../lib/band-for";
import { routes } from "../lib/routes";

interface ResultLocationState {
  scaleType: "PHQ-9" | "GAD-7";
  totalScore: number;
  max: number;
  riskSignal: boolean;
}

function isResultState(value: unknown): value is ResultLocationState {
  return (
    !!value &&
    typeof value === "object" &&
    "scaleType" in value &&
    "totalScore" in value &&
    "max" in value &&
    "riskSignal" in value
  );
}

export function AssessmentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = isResultState(location.state) ? location.state : null;

  useEffect(() => {
    if (!state) {
      navigate(routes.assessment, { replace: true });
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const { scaleType, totalScore, max, riskSignal } = state;
  const band = bandFor(scaleType, totalScore);

  return (
    <PhoneShell>
      <div className="pt-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Lock size={12} className="text-muted-2" />
            <span className="font-mono text-eyebrow uppercase text-muted-2">processado no seu aparelho</span>
          </div>
          <PrivacyBadge />
        </div>

        <div className="mt-4">
          <ResultBandCard scaleType={scaleType} score={totalScore} max={max} band={band} />
        </div>

        <p className="my-[18px] text-body text-muted">
          Isto é um sinal, não um diagnóstico. Ele ajuda a decidir o próximo passo — no seu tempo.
        </p>

        {riskSignal && (
          <div className="mb-[18px]">
            <RiskSignalCallout onConnect={() => navigate(routes.crisis)} />
          </div>
        )}

        <Button variant="primary" onClick={() => navigate(routes.chat)}>
          Conversar com o acolhimento
        </Button>
        <div className="mt-3">
          <Button variant="ghost" onClick={() => navigate(routes.home)}>
            Voltar ao início
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
