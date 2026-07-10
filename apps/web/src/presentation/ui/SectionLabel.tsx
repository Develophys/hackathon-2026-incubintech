import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  tone?: "muted" | "brand";
}

export function SectionLabel({ children, tone = "muted" }: SectionLabelProps) {
  return (
    <span className={`font-mono text-eyebrow uppercase ${tone === "brand" ? "text-brand" : "text-muted-2"}`}>
      {children}
    </span>
  );
}
