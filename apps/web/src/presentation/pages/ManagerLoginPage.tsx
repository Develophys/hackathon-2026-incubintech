import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BackButton } from "../ui/BackButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { routes } from "../lib/routes";
import { useManagerLogin } from "../hooks/useManagerLogin";
import { InvalidManagerCodeError } from "../../ports/manager-auth.port";

export function ManagerLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const login = useManagerLogin();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate(code, { onSuccess: () => navigate(routes.manager) });
  };

  const errorMessage = login.isError
    ? login.error instanceof InvalidManagerCodeError
      ? "Código incorreto."
      : "Não foi possível entrar agora. Tente novamente."
    : null;

  return (
    <PhoneShell>
      <div className="pt-[30px]">
        <BackButton label="Início" onClick={() => navigate(routes.home)} />
        <h1 className="mb-[6px] mt-4 text-h1 text-ink">Acesso do gestor</h1>
        <p className="text-caption text-muted">Digite o código fornecido pela sua instituição.</p>

        <form onSubmit={handleSubmit}>
          <Card className="mt-5">
            <label htmlFor="manager-code" className="text-label font-semibold text-ink-2">
              Código de acesso
            </label>
            <input
              id="manager-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o código"
              className="mt-2 w-full rounded-pill border border-line bg-surface p-[13px_18px] text-[14.5px] text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
            {errorMessage && (
              <p role="alert" className="mt-2 text-label text-danger">
                {errorMessage}
              </p>
            )}
          </Card>

          <div className="mt-[24px]">
            <Button type="submit" variant="primary" loading={login.isPending} disabled={code.trim().length === 0}>
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </PhoneShell>
  );
}
