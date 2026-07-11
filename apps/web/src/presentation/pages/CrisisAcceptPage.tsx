import { useState } from "react";
import { UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { generateEphemeralToken } from "../lib/generate-ephemeral-token";
import { routes } from "../lib/routes";

// TODO(week2): real provider matching + secure channel. Until then this screen is a
// designed placeholder — the token is illustrative and is never persisted or sent anywhere.
export function CrisisAcceptPage() {
  const navigate = useNavigate();
  const [token] = useState(generateEphemeralToken);

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col pt-[30px]">
        <BackButton label="Voltar" onClick={() => navigate(routes.crisis)} />
        <h1 className="mb-2 mt-4 text-h1 text-ink">Conectando com segurança</h1>
        <p className="text-caption text-muted">
          Um token temporário foi criado só para esta conversa. Sua identidade não é armazenada.
        </p>

        <div className="mt-5 rounded-2xl bg-dark p-[18px]">
          <p className="font-mono text-dark-brand">token: {token}</p>
          <p className="mt-1 font-mono text-[12px] text-[#6F8F84]">
            expira ao fim da sessão · sem vínculo com CRM
          </p>
        </div>

        <div className="mt-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-surface-brand text-brand">
                <UserRound size={22} />
              </div>
              <div>
                <p className="text-body font-extrabold text-ink">Psicólogo(a) parceiro(a)</p>
                <p className="text-caption text-brand">● disponível agora</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-1" />

        <Button variant="primary" onClick={() => navigate(routes.chat)}>
          Iniciar conversa segura
        </Button>
      </div>
    </PhoneShell>
  );
}
