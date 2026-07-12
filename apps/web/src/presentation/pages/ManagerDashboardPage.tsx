import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { SectionLabel } from "../ui/SectionLabel";
import { Card } from "../ui/Card";
import { routes } from "../lib/routes";
import { useManagerSignals } from "../hooks/useManagerSignals";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

const MIN_TREND_BAR_HEIGHT = 8;

function toTrendBarHeights(trend: { concerningRate: number }[]): number[] {
  return trend.map((point) => Math.max(MIN_TREND_BAR_HEIGHT, Math.round(point.concerningRate * 100)));
}

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const clearSession = useManagerSessionStore((state) => state.clearSession);
  const { data, error, isError } = useManagerSignals();

  useEffect(() => {
    if (isError && error instanceof UnauthorizedManagerError) {
      clearSession();
      navigate(routes.managerLogin, { replace: true });
    }
  }, [isError, error, clearSession, navigate]);

  const trend = data?.weeklyTrend ?? [];
  const bars = toTrendBarHeights(trend);
  const segments = data?.segments ?? [];
  const overallConcerningRate = data?.overallConcerningRate ?? 0;
  const checkInsLast4Weeks = data?.checkInsLast4Weeks ?? 0;

  return (
    <PhoneShell bg="canvas-alt">
      <div className="pt-[26px]">
        <div className="flex items-center justify-between">
          <BackButton label="Sair da demo" onClick={() => navigate(routes.home)} />
          <PrivacyBadge />
        </div>
        <div className="mt-4">
          <SectionLabel>Painel do gestor</SectionLabel>
        </div>
        <h1 className="mt-2 text-h2 text-ink">Tendências da equipe</h1>
        <p className="mt-1 text-caption text-muted">
          Somente dados anônimos e agregados. Segmentos com menos de 5 respostas ficam ocultos
          para evitar re-identificação.
        </p>

        <div className="mt-5 flex gap-3">
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-warn">{Math.round(overallConcerningRate * 100)}%</p>
            <p className="text-caption text-muted">sinais de burnout na equipe</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-brand">{checkInsLast4Weeks}</p>
            <p className="text-caption text-muted">check-ins nas últimas 4 semanas</p>
          </Card>
        </div>

        <div className="mt-[14px]">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-body font-extrabold text-ink">Tendência geral</p>
              <p className="font-mono text-[12px] text-muted-2">últimas 6 semanas</p>
            </div>
            <div className="mt-3 flex h-14 items-end gap-2">
              {bars.map((height, index) => (
                <div key={index} data-testid="trend-bar" className="w-full rounded-md bg-brand" style={{ height: `${height}%` }} />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-[14px]">
          <Card>
            <p className="text-body font-extrabold text-ink">Sinais por setor</p>
            <div className="mt-3 flex flex-col gap-3">
              {segments.map((segment) => (
                <div key={segment.label}>
                  <div className="flex items-center justify-between text-label text-ink-2">
                    <span>{segment.label}</span>
                    <span className="font-mono text-[12px] text-muted-2">
                      {segment.value}% · n={segment.n}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-pill bg-canvas-alt">
                    <div className="h-full rounded-pill bg-brand" style={{ width: `${segment.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}
