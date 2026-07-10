# UI Primitives

Build these **before** any screen (Phase 2). Screens are ~80% composed of these. All live under
`src/presentation/`. Props are given as TypeScript signatures — implement them exactly so screen
specs can reference them without ambiguity. Styling uses the Tailwind tokens from
`tailwind-and-css.md`.

> Icons: `lucide-react`. Import per-icon (`import { Lock } from "lucide-react"`).

---

## `layout/PhoneShell.tsx`
Scroll container + safe-area padding for a mobile-first screen. In-app (production) it's just a
full-height flex column; the phone bezel is a prototype artifact and is **not** shipped.

```ts
interface PhoneShellProps {
  children: React.ReactNode;
  /** When true, removes horizontal padding (for full-bleed hero screens like Splash). */
  bleed?: boolean;
  /** Optional sticky bottom nav. */
  footer?: React.ReactNode;
  /** Background token; defaults to "canvas". */
  bg?: "canvas" | "canvas-alt" | "surface";
}
```
- Root: `flex h-full min-h-screen flex-col bg-{bg}`.
- Body: `flex-1 overflow-y-auto no-scrollbar` + `px-6` unless `bleed`.
- Footer, if present, is `flex-none`.

---

## `ui/Button.tsx`
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  full?: boolean;      // width 100%, default true
  loading?: boolean;   // shows spinner + disables
}
```
| variant | classes |
|---|---|
| `primary` | `bg-brand text-white hover:bg-brand-hover` |
| `ghost` | `bg-transparent text-muted` (text link style) |
| `outline` | `bg-surface text-ink border border-line` |
| `danger` | `bg-danger text-white` |
Base: `rounded-pill py-4 font-sans text-[16px] font-bold transition disabled:opacity-50`.
Min height 52px (hit target). `loading` swaps label for a small spinner.

---

## `ui/Card.tsx`
```ts
interface CardProps {
  children: React.ReactNode;
  size?: "md" | "lg";        // md → rounded-card, lg → rounded-card-lg
  tone?: "surface" | "brand" | "brand-tint"; // brand = solid green hero, brand-tint = surface-brand
  className?: string;
}
```
- `surface`: `bg-surface shadow-card`. `brand`: `bg-brand text-white shadow-hero`.
  `brand-tint`: `bg-surface-brand`.
- Default padding `p-[18px]`; `lg` → `p-[22px]`.

---

## `ui/IconBadge.tsx`
```ts
interface IconBadgeProps {
  icon: React.ComponentType<{ size?: number; className?: string }>; // a lucide icon
  size?: number;    // box size, default 38
  tone?: "brand" | "danger" | "neutral";
}
```
- `brand`: `bg-surface-brand text-brand`. Rounded `radius-icon`, centered, icon at ~55% of box.

---

## `ui/PrivacyBadge.tsx`
The always-visible anonymity marker.
```ts
interface PrivacyBadgeProps {
  label?: string;   // default "anônimo"
  variant?: "chip" | "inline"; // chip = pill in header, inline = mono caption
}
```
- `chip`: `rounded-pill bg-surface-brand px-3 py-[7px] font-mono text-[12px] text-brand` with a
  `Lock` icon (14px) before the label.

---

## `ui/ProgressBar.tsx`
```ts
interface ProgressBarProps {
  value: number;   // 0..100
  label?: string;  // e.g. "3/9" (rendered by caller usually)
}
```
- Track: `h-[7px] rounded-pill bg-line overflow-hidden`.
- Fill: `h-full bg-brand rounded-pill` with `style={{ width: value + "%" }}` and
  `transition-[width] duration-300`.

---

## `ui/SectionLabel.tsx`
Uppercase mono eyebrow.
```ts
interface SectionLabelProps { children: React.ReactNode; tone?: "muted" | "brand"; }
```
- `font-mono text-eyebrow uppercase` + `text-muted-2` (muted) or `text-brand`.

---

## `ui/ScoreDial.tsx`
The big result number + band pill (used by result screen).
```ts
interface ScoreDialProps {
  score: number;
  max: number;                 // 27 for PHQ-9, 21 for GAD-7
  band: { label: string; fg: string; bg: string }; // from band palette
}
```
- Number: `font-serif text-score text-ink`; `/max` in `text-[24px] text-faint`.
- Band pill: `inline-block rounded-pill px-4 py-[7px] font-sans text-label font-extrabold`,
  colored via inline style from `band.fg`/`band.bg` (this is the ONE place inline color is
  allowed, because bands are data-driven).

---

## `layout/BottomNav.tsx`
```ts
type Tab = "home" | "checkin" | "chat" | "you";
interface BottomNavProps { active: Tab; onNavigate: (tab: Tab) => void; }
```
- Container: `flex-none flex justify-around border-t border-surface-brand bg-surface px-2 pb-6 pt-3`.
- Each tab: icon + `font-sans text-[11px] font-semibold`. Active → `text-brand`; else `text-faint`.
- Labels (PT-BR): Início, Check-in, Conversar, Você. Hit target ≥ 44px.

---

## Acceptance criteria
- Every primitive matches its prop signature above.
- A throwaway `/kitchen-sink` route renders all variants; delete before merge.
- No primitive imports another screen; primitives are leaf/composable only.
- All interactive primitives are keyboard-focusable with a visible focus ring
  (`focus-visible:ring-2 focus-visible:ring-brand`).
