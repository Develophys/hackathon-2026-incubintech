import { MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { BottomNav } from "../layout/BottomNav";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { routes } from "../lib/routes";

// TODO(history): placeholder until a history endpoint exists — do not fabricate a use-case.
const HISTORY_BARS = [30, 45, 40, 70, 35, 55] as const;
const PEAK_INDEX = 3;
const LATEST_INDEX = HISTORY_BARS.length - 1;

export function HomePage() {
  const navigate = useNavigate();

  const handleNavigate = (tab: "home" | "checkin" | "chat" | "you") => {
    if (tab === "home") navigate(routes.home);
    if (tab === "checkin") navigate(routes.assessment);
    if (tab === "chat") navigate(routes.chat);
    // "you" tab: no destination yet — TODO(week2): profile/revoke-consent screen.
  };

  return (
    <PhoneShell footer={<BottomNav active="home" onNavigate={handleNavigate} />}>
      <div className="flex flex-col pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-muted-2">Bom te ver por aqui</p>
            <p className="font-serif text-[25px] text-ink">Olá.</p>
          </div>
          <PrivacyBadge />
        </div>

        <div className="mt-5">
          <Card size="lg" tone="brand">
            <p className="font-serif text-[21px]">Como você está hoje?</p>
            <p className="mt-1 text-label opacity-85">Um check-in de 5 minutos, só para você.</p>
            <button
              type="button"
              onClick={() => navigate(routes.assessment)}
              className="mt-4 min-h-[52px] w-full rounded-pill bg-white px-4 font-sans text-[16px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Fazer check-in
            </button>
          </Card>
        </div>

        <div className="mt-[14px]">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-body font-extrabold text-ink">Seu histórico</p>
              <p className="font-mono text-[12px] text-muted-2">últimas 6 semanas</p>
            </div>
            <div className="mt-3 flex h-14 items-end gap-2">
              {HISTORY_BARS.map((height, index) => (
                <div
                  key={index}
                  data-testid="history-bar"
                  className={`w-full rounded-md ${
                    index === LATEST_INDEX ? "bg-brand" : index === PEAK_INDEX ? "bg-warn" : "bg-[#CDDBD4]"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-[14px] flex gap-3">
          <button
            type="button"
            onClick={() => navigate(routes.chat)}
            className="flex-1 rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <IconBadge icon={MessageCircle} />
            <p className="mt-2 text-body font-extrabold text-ink">Conversar agora</p>
          </button>
          <button
            type="button"
            onClick={() => navigate(routes.peers)}
            className="flex-1 rounded-card bg-surface p-[18px] text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <IconBadge icon={Users} />
            <p className="mt-2 text-body font-extrabold text-ink">Falar com um par</p>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate(routes.manager)}
          className="mt-4 text-label font-semibold text-muted underline"
        >
          Ver painel do gestor (demo)
        </button>
      </div>
    </PhoneShell>
  );
}
