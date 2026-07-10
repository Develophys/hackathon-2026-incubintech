import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PhoneShell } from "../layout/PhoneShell";
import { Button } from "../ui/Button";
import { SectionLabel } from "../ui/SectionLabel";
import { useConsentStore } from "../../stores/consent.store";
import { routes } from "../lib/routes";

export function SplashPage() {
  const navigate = useNavigate();
  const hasConsented = useConsentStore((state) => state.hasConsented);

  // Backup to the router loader on "/" (see router.tsx) — belt-and-suspenders
  // per routing-and-state.md so a warm start never flashes onboarding.
  useEffect(() => {
    if (hasConsented) {
      navigate(routes.home, { replace: true });
    }
  }, [hasConsented, navigate]);

  return (
    <PhoneShell bleed>
      <div
        className="flex min-h-full flex-col items-center px-[34px] text-center"
        style={{ background: "linear-gradient(180deg,#EEF4F1,#F2F5F3)" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[26px] bg-brand shadow-hero">
            <span className="font-serif text-[46px] text-white">z</span>
          </div>
          <h1 className="mt-[26px] font-serif text-display text-ink">Zelo</h1>
          <p className="mt-3 max-w-[250px] text-body text-ink-2">
            Cuidado confidencial para quem cuida.
          </p>
        </div>
        <div className="w-full pb-10">
          <Button variant="primary" onClick={() => navigate(routes.privacy)}>
            Começar
          </Button>
          <div className="mt-[18px]">
            <SectionLabel>anônimo · criptografado · no seu controle</SectionLabel>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
