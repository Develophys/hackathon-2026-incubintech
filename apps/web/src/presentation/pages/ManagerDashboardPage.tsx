import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { SectionLabel } from "../ui/SectionLabel";
import { Card } from "../ui/Card";
import { routes } from "../lib/routes";

// TODO(auth): gate behind manager role before production.
// TODO(week2): aggregation API — placeholder data below.
const SEGMENTS = [
  { label: "Plantão noturno", value: 52, n: 18 },
  { label: "Pronto-socorro", value: 38, n: 24 },
  { label: "UTI", value: 44, n: 9 },
  { label: "Ambulatório", value: 21, n: 3 },
] as const;

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  // Privacy rule enforced here even on placeholder data, so behavior is already
  // correct when the real aggregation API lands (k-anonymity, k=5).
  const visibleSegments = SEGMENTS.filter((segment) => segment.n >= 5);

  return (
    <PhoneShell bg="canvas-alt">
      <div className="pt-[26px]">
        <BackButton label="Sair da demo" onClick={() => navigate(routes.home)} />
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
            <p className="font-serif text-[30px] text-warn">41%</p>
            <p className="text-caption text-muted">sinais de burnout na equipe</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="font-serif text-[30px] text-brand">111</p>
            <p className="text-caption text-muted">check-ins nas últimas 4 semanas</p>
          </Card>
        </div>

        <div className="mt-[14px]">
          <Card>
            <p className="text-body font-extrabold text-ink">Sinais por setor</p>
            <div className="mt-3 flex flex-col gap-3">
              {visibleSegments.map((segment) => (
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
