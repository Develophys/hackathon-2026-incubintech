import type { ReactNode } from "react";

interface PhoneShellProps {
  children: ReactNode;
  bleed?: boolean;
  footer?: ReactNode;
  bg?: "canvas" | "canvas-alt" | "surface";
}

const BG_CLASS: Record<NonNullable<PhoneShellProps["bg"]>, string> = {
  canvas: "bg-canvas",
  "canvas-alt": "bg-canvas-alt",
  surface: "bg-surface",
};

export function PhoneShell({ children, bleed = false, footer, bg = "canvas" }: PhoneShellProps) {
  return (
    <div data-testid="phone-shell-root" className={`flex h-full min-h-screen flex-col ${BG_CLASS[bg]}`}>
      <div
        data-testid="phone-shell-body"
        className={`no-scrollbar flex-1 overflow-y-auto ${bleed ? "" : "px-6"}`}
      >
        {children}
      </div>
      {footer && <div className="flex-none">{footer}</div>}
    </div>
  );
}
