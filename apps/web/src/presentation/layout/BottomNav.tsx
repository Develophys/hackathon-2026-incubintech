import type { ComponentType } from "react";
import { Home, ClipboardCheck, MessageCircle, UserRound } from "lucide-react";

type Tab = "home" | "checkin" | "chat" | "you";

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "checkin", label: "Check-in", icon: ClipboardCheck },
  { id: "chat", label: "Conversar", icon: MessageCircle },
  { id: "you", label: "Você", icon: UserRound },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="flex flex-none justify-around border-t border-surface-brand bg-surface px-2 pb-6 pt-3">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(id)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Icon size={22} />
            <span className={`font-sans text-[11px] font-semibold ${
              isActive ? "text-brand" : "text-faint"
            }`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
