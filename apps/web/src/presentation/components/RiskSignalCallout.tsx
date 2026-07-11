interface RiskSignalCalloutProps {
  onConnect: () => void;
}

export function RiskSignalCallout({ onConnect }: RiskSignalCalloutProps) {
  return (
    <div className="rounded-2xl border border-danger-border bg-danger-bg p-[18px]">
      <p className="text-body font-extrabold text-danger">Notamos um sinal importante.</p>
      <p className="mt-1 text-caption text-danger-ink">
        Você não está sozinho(a). Podemos te conectar com alguém agora.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 min-h-[52px] w-full rounded-pill bg-danger py-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
      >
        Falar com alguém agora
      </button>
    </div>
  );
}
