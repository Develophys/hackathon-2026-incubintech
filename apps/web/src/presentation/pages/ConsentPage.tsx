import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";

const ROWS: ReactNode[] = [
  <>Entendo que o Zelo <strong>não emite diagnóstico</strong> e não substitui atendimento profissional.</>,
  <>Autorizo o uso <strong>anônimo e agregado</strong> dos meus sinais para melhorar o cuidado da equipe.</>,
  <>Minha identidade só é revelada se <strong>eu escolher</strong> falar com uma pessoa.</>,
];

export function ConsentPage() {
  const navigate = useNavigate();
  const grant = useConsentStore((state) => state.grant);

  const handleAccept = () => {
    grant();
    navigate(routes.home, { replace: true });
  };

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <button
          type="button"
          onClick={() => navigate(routes.privacy)}
          className="flex items-center gap-1 text-label font-semibold text-muted"
        >
          ← Voltar
        </button>
        <h1 className="mb-[6px] mt-4 text-h1 text-ink">Seu consentimento</h1>
        <p className="text-caption text-muted">
          Confirme antes de entrar. Você pode revogar quando quiser.
        </p>
        <div className="mt-5 flex flex-col gap-[12px]">
          {ROWS.map((row, index) => (
            <Card key={index}>
              <div className="flex items-start gap-3">
                <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-brand text-white">
                  <Check size={14} />
                </div>
                <p className="text-label text-ink-2">{row}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-[14px] flex items-center gap-2 rounded-2xl bg-surface-brand p-[13px] font-mono text-[12.5px] leading-relaxed text-brand">
          <Lock size={16} />
          Criptografia AES-256 no seu aparelho antes de qualquer envio.
        </div>
        <div className="mt-[24px]">
          <Button variant="primary" onClick={handleAccept}>
            Aceitar e entrar
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
