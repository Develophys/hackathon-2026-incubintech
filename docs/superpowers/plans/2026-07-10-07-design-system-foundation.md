# Design System & Primitives Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the "Sereno" design system (Tailwind tokens, fonts, global CSS) and the shared UI primitives that every one of the 13 Zelo screens is composed from, so later screen plans can consume them without redefining styling.

**Architecture:** Pure presentation-layer addition to `apps/web`. Adopts Tailwind v4's CSS-first configuration: deletes the empty `tailwind.config.ts` and `postcss.config.js`, wires `@tailwindcss/vite` into `vite.config.ts`, and replaces `src/app/index.css` with an `@theme` block carrying every token from the spec. Adds Google Fonts links and `lucide-react` for icons, and creates 8 leaf components under `src/presentation/{layout,ui}/`. No routing, store, or domain/use-case changes in this plan.

**Tech Stack:** React 19, Tailwind CSS v4 (CSS-first `@theme` config via `@tailwindcss/vite`, no `tailwind.config.ts`/PostCSS), `lucide-react` (new dependency), Vitest + Testing Library (existing).

## Global Constraints

- Design tokens only — no raw hex values in any component (`design-tokens.md` is the source of truth). The one exception is `ScoreDial`'s band pill, which takes `fg`/`bg` as data-driven inline style (spec allows this explicitly).
- PT-BR copy is normative where any copy appears in these primitives (there is none in this plan — primitives are copy-free except default prop values).
- Icons: `lucide-react`, imported per-icon (`import { Lock } from "lucide-react"`). No emoji in production UI.
- Every interactive primitive is keyboard-focusable with a visible focus ring: `focus-visible:ring-2 focus-visible:ring-brand`.
- Hit targets ≥ 44×44px on all interactive primitives (`Button` min-height 52px per spec).
- Reference spec files (read-only, do not edit): `docs/superpowers/specs/design-tokens.md`, `docs/superpowers/specs/tailwind-and-css.md`, `docs/superpowers/specs/ui-primitives.md`.

---

## File Structure

```
apps/web/
  index.html                                   (edit: add font <link> tags)
  package.json                                 (edit: add lucide-react + @tailwindcss/vite, bump tailwindcss to v4, drop autoprefixer/postcss)
  vite.config.ts                               (edit: register @tailwindcss/vite plugin)
  tailwind.config.ts                           (delete — v4 CSS-first config replaces it)
  postcss.config.js                            (delete — @tailwindcss/vite replaces the PostCSS pipeline)
  src/app/index.css                            (replace: @import "tailwindcss" + @theme block)
  src/presentation/
    layout/
      PhoneShell.tsx                           (new)
      PhoneShell.test.tsx                      (new)
      BottomNav.tsx                            (new)
      BottomNav.test.tsx                       (new)
    ui/
      Button.tsx                               (new)
      Button.test.tsx                          (new)
      Card.tsx                                 (new)
      IconBadge.tsx                            (new)
      Card.test.tsx                            (new)
      PrivacyBadge.tsx                         (new)
      SectionLabel.tsx                         (new)
      PrivacyBadge.test.tsx                    (new)
      ProgressBar.tsx                          (new)
      ProgressBar.test.tsx                     (new)
      ScoreDial.tsx                            (new)
      ScoreDial.test.tsx                       (new)
```

Each primitive is a standalone leaf component — no primitive imports another screen or another primitive (per the spec's acceptance criteria), except `layout/` components which may compose `ui/` components later (not in this plan).

---

## Task 1: Tailwind v4 tokens (CSS-first), global CSS, fonts, icon dependency

**Files:**
- Modify: `apps/web/index.html`
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Delete: `apps/web/tailwind.config.ts`
- Delete: `apps/web/postcss.config.js`
- Replace: `apps/web/src/app/index.css`

**Interfaces:**
- Produces: Tailwind utility classes for every token in `design-tokens.md` (`bg-brand`, `text-ink`, `font-serif`, `text-h1`, `rounded-pill`, `shadow-card`, etc.) — every later task and every later plan consumes these class names. Tailwind v4's CSS-first `@theme` block is the mechanism; the resulting class names are identical to what a v3 JS config would have produced, so nothing downstream of this task needs to know which config style was used.

- [ ] **Step 1: Update `apps/web/package.json`**

Add `lucide-react` to `"dependencies"`:

```json
"dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "@zelo/domain": "workspace:*",
    "lucide-react": "^0.460.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^8.2.0",
    "zod": "^3.23.0",
    "zustand": "^5.0.0"
  },
```

In `"devDependencies"`, bump `tailwindcss` to v4, add `@tailwindcss/vite`, and remove `autoprefixer` and `postcss` (Tailwind v4's Vite plugin runs its own CSS pipeline via Lightning CSS — no separate PostCSS config or `autoprefixer` needed):

```json
"devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@zelo/config": "workspace:*",
    "dependency-cruiser": "^16.4.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.1.0"
  }
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates; `lucide-react` and `@tailwindcss/vite` resolve under `node_modules/.pnpm`; `autoprefixer` and the standalone `postcss` package are removed.

- [ ] **Step 3: Add font links to `apps/web/index.html`**

Insert inside `<head>`, after the `viewport` meta tag and before `<title>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 4: Register the Tailwind v4 Vite plugin in `apps/web/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Zelo",
        short_name: "Zelo",
        description: "Triagem e suporte confidencial à saúde mental do médico",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
```

(only the `tailwindcss` import and its entry in `plugins` are new — the `VitePWA` config is copied verbatim from the existing file, unchanged.)

- [ ] **Step 5: Delete the now-obsolete config files**

```bash
git rm apps/web/tailwind.config.ts apps/web/postcss.config.js
```

v4's `@tailwindcss/vite` plugin auto-detects content (no `content: [...]` array needed) and runs its own CSS transform pipeline, so neither file has a job anymore.

- [ ] **Step 6: Replace `apps/web/src/app/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-brand: #2F6B5E;
  --color-brand-hover: #1F5A4D;
  --color-brand-ink: #21302B;
  --color-surface: #FFFFFF;
  --color-surface-brand: #E3ECE7;
  --color-canvas: #F2F5F3;
  --color-canvas-alt: #EEF1EF;
  --color-ink: #21302B;
  --color-ink-2: #4A584F;
  --color-muted: #5C6B64;
  --color-muted-2: #7C8A83;
  --color-faint: #9AA7A1;
  --color-line: #DFE4E1;
  --color-warn: #A9711A;
  --color-warn-bg: #F6EDDA;
  --color-warn-ink: #8A6A1F;
  --color-danger: #A2453A;
  --color-danger-bg: #F7EBE8;
  --color-danger-border: #E3C9C3;
  --color-danger-ink: #8A5248;
  --color-danger-strong: #8F2F26;
  --color-danger-strong-bg: #F5E4E1;
  --color-dark: #0D1512;
  --color-dark-brand: #A8D8C9;

  --font-serif: "Newsreader", Georgia, serif;
  --font-sans: "Nunito Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --text-eyebrow: 12px;
  --text-eyebrow--line-height: 1;
  --text-eyebrow--letter-spacing: 0.1em;
  --text-caption: 13px;
  --text-caption--line-height: 1.5;
  --text-label: 14px;
  --text-label--line-height: 1.45;
  --text-body: 15px;
  --text-body--line-height: 1.55;
  --text-h2: 24px;
  --text-h2--line-height: 1.3;
  --text-h1: 28px;
  --text-h1--line-height: 1.2;
  --text-display: 40px;
  --text-display--line-height: 1.1;
  --text-score: 64px;
  --text-score--line-height: 1;
  --text-body-strong: 15px;
  --text-body-strong--line-height: 1.5;
  /* design-tokens.md specifies mono-data as a 12-13px range; 12px is the
     concrete value every mono-data usage in the screen specs actually needs. */
  --text-mono-data: 12px;
  --text-mono-data--line-height: 1.5;

  --radius-pill: 999px;
  --radius-card: 22px;
  --radius-card-lg: 26px;
  --radius-icon: 14px;
  --radius-input: 16px;

  --shadow-card: 0 8px 24px rgba(38,70,60,.06);
  --shadow-card-lg: 0 10px 28px rgba(38,70,60,.07);
  --shadow-brand: 0 12px 26px -10px rgba(47,107,94,.7);
  --shadow-hero: 0 16px 34px -12px rgba(47,107,94,.6);
}

@layer base {
  html { -webkit-tap-highlight-color: transparent; }
  body {
    @apply bg-canvas font-sans text-ink antialiased;
  }
  a { @apply text-brand no-underline; }
  a:hover { @apply text-brand-hover; }

  h1, h2, h3 { @apply font-serif; }
}

@layer utilities {
  .no-scrollbar { scrollbar-width: none; }
  .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

> Each `--color-x-y` variable generates the same `bg-x-y`/`text-x-y`/`border-x-y` utilities a v3 `colors: { x: { y: "..." } }` nested config would have. `--text-{name}` plus its `--text-{name}--line-height` (and `--letter-spacing` for `eyebrow`) companion variables reproduce v3's `fontSize: { name: [size, { lineHeight, letterSpacing }] }` tuples exactly. `--radius-*` and `--shadow-*` map to `rounded-*`/`shadow-*` the same way. No component code written in any later task or plan changes because of this — same class names in, same class names out.

- [ ] **Step 7: Verify the build picks up the new tokens**

Run: `pnpm --filter web build`
Expected: build succeeds with no Tailwind errors (unknown utility class or unresolved `@theme` reference errors would fail here first).

- [ ] **Step 8: Commit**

```bash
git add apps/web/index.html apps/web/package.json apps/web/vite.config.ts apps/web/src/app/index.css pnpm-lock.yaml
git commit -m "feat(web): migrate to Tailwind v4 (CSS-first @theme), add Sereno design tokens, fonts, and lucide-react"
```

---

## Task 2: `PhoneShell` layout primitive

**Files:**
- Create: `apps/web/src/presentation/layout/PhoneShell.tsx`
- Test: `apps/web/src/presentation/layout/PhoneShell.test.tsx`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces: `PhoneShell` component, used by every screen page in Plans B–E as the root wrapper.

```ts
interface PhoneShellProps {
  children: React.ReactNode;
  bleed?: boolean;
  footer?: React.ReactNode;
  bg?: "canvas" | "canvas-alt" | "surface";
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhoneShell } from "./PhoneShell";

describe("PhoneShell", () => {
  it("renders children in a scrollable body with horizontal padding by default", () => {
    render(<PhoneShell>content</PhoneShell>);
    const body = screen.getByTestId("phone-shell-body");
    expect(body).toHaveClass("px-6");
    expect(body).toHaveTextContent("content");
  });

  it("removes horizontal padding when bleed is set", () => {
    render(<PhoneShell bleed>content</PhoneShell>);
    expect(screen.getByTestId("phone-shell-body")).not.toHaveClass("px-6");
  });

  it("renders the footer in a flex-none slot when provided", () => {
    render(<PhoneShell footer={<div data-testid="my-footer">nav</div>}>content</PhoneShell>);
    expect(screen.getByTestId("my-footer")).toBeInTheDocument();
  });

  it("defaults to the canvas background", () => {
    render(<PhoneShell>content</PhoneShell>);
    expect(screen.getByTestId("phone-shell-root")).toHaveClass("bg-canvas");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test PhoneShell -- --run`
Expected: FAIL — `Cannot find module './PhoneShell'`.

- [ ] **Step 3: Write the implementation**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test PhoneShell -- --run`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/layout/PhoneShell.tsx apps/web/src/presentation/layout/PhoneShell.test.tsx
git commit -m "feat(web): add PhoneShell layout primitive"
```

---

## Task 3: `Button` primitive

**Files:**
- Create: `apps/web/src/presentation/ui/Button.tsx`
- Test: `apps/web/src/presentation/ui/Button.test.tsx`

**Interfaces:**
- Produces: `Button` component with `variant`, `full`, `loading` props — consumed by every screen with a CTA (all 13 screens).

```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  full?: boolean;
  loading?: boolean;
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the primary variant by default with brand background", () => {
    render(<Button>Começar</Button>);
    expect(screen.getByRole("button", { name: "Começar" })).toHaveClass("bg-brand");
  });

  it.each([
    ["ghost", "bg-transparent"],
    ["outline", "border-line"],
    ["danger", "bg-danger"],
  ] as const)("applies %s variant classes", (variant, expectedClass) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole("button", { name: "Label" })).toHaveClass(expectedClass);
  });

  it("calls onClick when clicked and not loading", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Tap" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the button and shows a spinner when loading", () => {
    render(<Button loading>Enviar</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByTestId("button-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Enviar")).not.toBeInTheDocument();
  });

  it("is full width by default", () => {
    render(<Button>Label</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ui/Button -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  full?: boolean;
  loading?: boolean;
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  ghost: "bg-transparent text-muted",
  outline: "bg-surface text-ink border border-line",
  danger: "bg-danger text-white",
};

export function Button({
  variant = "primary",
  full = true,
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "rounded-pill py-4 font-sans text-[16px] font-bold transition disabled:opacity-50",
        "min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        VARIANT_CLASS[variant],
        full ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          data-testid="button-spinner"
          className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        children
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ui/Button -- --run`
Expected: PASS (7 tests, including the `it.each` cases).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/Button.tsx apps/web/src/presentation/ui/Button.test.tsx
git commit -m "feat(web): add Button primitive"
```

---

## Task 4: `Card` and `IconBadge` primitives

**Files:**
- Create: `apps/web/src/presentation/ui/Card.tsx`
- Create: `apps/web/src/presentation/ui/IconBadge.tsx`
- Test: `apps/web/src/presentation/ui/Card.test.tsx`

**Interfaces:**
- Produces: `Card` (`size`, `tone`, `className` props), `IconBadge` (`icon`, `size`, `tone` props).

```ts
interface CardProps {
  children: React.ReactNode;
  size?: "md" | "lg";
  tone?: "surface" | "brand" | "brand-tint";
  className?: string;
}
interface IconBadgeProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  size?: number;
  tone?: "brand" | "danger" | "neutral";
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Lock } from "lucide-react";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";

describe("Card", () => {
  it("defaults to a surface card with card radius and md padding", () => {
    render(<Card>hi</Card>);
    const card = screen.getByText("hi");
    expect(card).toHaveClass("bg-surface", "rounded-card", "shadow-card", "p-[18px]");
  });

  it("renders the brand tone as a solid hero card with lg padding", () => {
    render(<Card size="lg" tone="brand">hero</Card>);
    const card = screen.getByText("hero");
    expect(card).toHaveClass("bg-brand", "text-white", "shadow-hero", "rounded-card-lg", "p-[22px]");
  });

  it("renders the brand-tint tone", () => {
    render(<Card tone="brand-tint">tint</Card>);
    expect(screen.getByText("tint")).toHaveClass("bg-surface-brand");
  });

  it("upgrades a surface card's shadow to shadow-card-lg at lg size (result card)", () => {
    render(<Card size="lg">result</Card>);
    expect(screen.getByText("result")).toHaveClass("shadow-card-lg");
  });
});

describe("IconBadge", () => {
  it("renders the given icon inside a brand-toned rounded box by default", () => {
    render(<IconBadge icon={Lock} />);
    const badge = screen.getByTestId("icon-badge");
    expect(badge).toHaveClass("bg-surface-brand", "text-brand", "rounded-icon");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ui/Card -- --run`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementation**

`apps/web/src/presentation/ui/Card.tsx`:

```tsx
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  size?: "md" | "lg";
  tone?: "surface" | "brand" | "brand-tint";
  className?: string;
}

export function Card({ children, size = "md", tone = "surface", className = "" }: CardProps) {
  const radius = size === "lg" ? "rounded-card-lg" : "rounded-card";
  const padding = size === "lg" ? "p-[22px]" : "p-[18px]";
  // Surface cards use the heavier shadow at lg size (design-tokens.md: shadow-card-lg
  // is reserved for "Result card" — the only lg+surface composition in the specs).
  const toneClass =
    tone === "brand"
      ? "bg-brand text-white shadow-hero"
      : tone === "brand-tint"
        ? "bg-surface-brand"
        : `bg-surface ${size === "lg" ? "shadow-card-lg" : "shadow-card"}`;
  return <div className={[radius, padding, toneClass, className].join(" ")}>{children}</div>;
}
```

`apps/web/src/presentation/ui/IconBadge.tsx`:

```tsx
import type { ComponentType } from "react";

interface IconBadgeProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  size?: number;
  tone?: "brand" | "danger" | "neutral";
}

const TONE_CLASS: Record<NonNullable<IconBadgeProps["tone"]>, string> = {
  brand: "bg-surface-brand text-brand",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-canvas-alt text-muted",
};

export function IconBadge({ icon: Icon, size = 38, tone = "brand" }: IconBadgeProps) {
  return (
    <div
      data-testid="icon-badge"
      className={`flex items-center justify-center rounded-icon ${TONE_CLASS[tone]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.55)} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ui/Card -- --run`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/Card.tsx apps/web/src/presentation/ui/IconBadge.tsx apps/web/src/presentation/ui/Card.test.tsx
git commit -m "feat(web): add Card and IconBadge primitives"
```

---

## Task 5: `PrivacyBadge` and `SectionLabel` primitives

**Files:**
- Create: `apps/web/src/presentation/ui/PrivacyBadge.tsx`
- Create: `apps/web/src/presentation/ui/SectionLabel.tsx`
- Test: `apps/web/src/presentation/ui/PrivacyBadge.test.tsx`

**Interfaces:**
- Produces: `PrivacyBadge` (`label`, `variant`), `SectionLabel` (`children`, `tone`) — the anonymity marker used on every authenticated screen (04–13) and eyebrow labels used throughout.

```ts
interface PrivacyBadgeProps { label?: string; variant?: "chip" | "inline"; }
interface SectionLabelProps { children: React.ReactNode; tone?: "muted" | "brand"; }
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivacyBadge } from "./PrivacyBadge";
import { SectionLabel } from "./SectionLabel";

describe("PrivacyBadge", () => {
  it("defaults to the 'anônimo' label in chip variant", () => {
    render(<PrivacyBadge />);
    const badge = screen.getByText("anônimo");
    expect(badge.closest("[data-testid='privacy-badge']")).toHaveClass(
      "rounded-pill",
      "bg-surface-brand",
      "font-mono",
    );
  });

  it("accepts a custom label", () => {
    render(<PrivacyBadge label="criptografado" />);
    expect(screen.getByText("criptografado")).toBeInTheDocument();
  });

  it("renders the inline variant without the chip background", () => {
    render(<PrivacyBadge variant="inline" />);
    expect(screen.getByTestId("privacy-badge")).not.toHaveClass("bg-surface-brand");
  });
});

describe("SectionLabel", () => {
  it("renders uppercase mono eyebrow text, muted by default", () => {
    render(<SectionLabel>Privacidade primeiro</SectionLabel>);
    const label = screen.getByText("Privacidade primeiro");
    expect(label).toHaveClass("font-mono", "uppercase", "text-muted-2");
  });

  it("renders the brand tone", () => {
    render(<SectionLabel tone="brand">Painel do gestor</SectionLabel>);
    expect(screen.getByText("Painel do gestor")).toHaveClass("text-brand");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ui/PrivacyBadge -- --run`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementation**

`apps/web/src/presentation/ui/PrivacyBadge.tsx`:

```tsx
import { Lock } from "lucide-react";

interface PrivacyBadgeProps {
  label?: string;
  variant?: "chip" | "inline";
}

export function PrivacyBadge({ label = "anônimo", variant = "chip" }: PrivacyBadgeProps) {
  if (variant === "inline") {
    return (
      <span data-testid="privacy-badge" className="inline-flex items-center gap-1 font-mono text-caption text-muted-2">
        <Lock size={14} />
        {label}
      </span>
    );
  }
  return (
    <span
      data-testid="privacy-badge"
      className="inline-flex items-center gap-1 rounded-pill bg-surface-brand px-3 py-[7px] font-mono text-[12px] text-brand"
    >
      <Lock size={14} />
      {label}
    </span>
  );
}
```

`apps/web/src/presentation/ui/SectionLabel.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ui/PrivacyBadge -- --run`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/PrivacyBadge.tsx apps/web/src/presentation/ui/SectionLabel.tsx apps/web/src/presentation/ui/PrivacyBadge.test.tsx
git commit -m "feat(web): add PrivacyBadge and SectionLabel primitives"
```

---

## Task 6: `ProgressBar` primitive

**Files:**
- Create: `apps/web/src/presentation/ui/ProgressBar.tsx`
- Test: `apps/web/src/presentation/ui/ProgressBar.test.tsx`

**Interfaces:**
- Produces: `ProgressBar` — consumed by the assessment question screen (Plan C).

```ts
interface ProgressBarProps { value: number; label?: string; }
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("sets the fill width from the value prop", () => {
    render(<ProgressBar value={33} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "33%" });
  });

  it("exposes progressbar role with correct aria attributes", () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ProgressBar -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-[7px] overflow-hidden rounded-pill bg-line"
    >
      <div
        data-testid="progress-fill"
        className="h-full rounded-pill bg-brand transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ProgressBar -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/ProgressBar.tsx apps/web/src/presentation/ui/ProgressBar.test.tsx
git commit -m "feat(web): add ProgressBar primitive"
```

---

## Task 7: `ScoreDial` primitive

**Files:**
- Create: `apps/web/src/presentation/ui/ScoreDial.tsx`
- Test: `apps/web/src/presentation/ui/ScoreDial.test.tsx`

**Interfaces:**
- Produces: `ScoreDial` — consumed by the assessment result screen (Plan C, `ResultBandCard`). This is the **one** place a data-driven inline color is allowed (band colors come from `bandFor()`, defined in Plan C, not here).

```ts
interface ScoreDialProps {
  score: number;
  max: number;
  band: { label: string; fg: string; bg: string };
}
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreDial } from "./ScoreDial";

describe("ScoreDial", () => {
  it("renders the score, max, and band label", () => {
    render(<ScoreDial score={12} max={27} band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("/27")).toBeInTheDocument();
    expect(screen.getByText("Moderado")).toBeInTheDocument();
  });

  it("applies the band colors as inline style on the band pill", () => {
    render(<ScoreDial score={12} max={27} band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }} />);
    const pill = screen.getByText("Moderado");
    expect(pill).toHaveStyle({ color: "rgb(169, 113, 26)", backgroundColor: "rgb(246, 237, 218)" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ScoreDial -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
interface ScoreDialProps {
  score: number;
  max: number;
  band: { label: string; fg: string; bg: string };
}

export function ScoreDial({ score, max, band }: ScoreDialProps) {
  return (
    <div className="text-center">
      <span className="font-serif text-score text-ink">{score}</span>
      <span className="text-[24px] text-faint">/{max}</span>
      <div className="mt-3">
        <span
          className="inline-block rounded-pill px-4 py-[7px] font-sans text-label font-extrabold"
          style={{ color: band.fg, backgroundColor: band.bg }}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ScoreDial -- --run`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/ui/ScoreDial.tsx apps/web/src/presentation/ui/ScoreDial.test.tsx
git commit -m "feat(web): add ScoreDial primitive"
```

---

## Task 8: `BottomNav` layout primitive

**Files:**
- Create: `apps/web/src/presentation/layout/BottomNav.tsx`
- Test: `apps/web/src/presentation/layout/BottomNav.test.tsx`

**Interfaces:**
- Produces: `BottomNav` — consumed by `HomePage` (Plan C) via `PhoneShell`'s `footer` slot.

```ts
type Tab = "home" | "checkin" | "chat" | "you";
interface BottomNavProps { active: Tab; onNavigate: (tab: Tab) => void; }
```

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
  it("renders the four PT-BR tab labels", () => {
    render(<BottomNav active="home" onNavigate={vi.fn()} />);
    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Conversar")).toBeInTheDocument();
    expect(screen.getByText("Você")).toBeInTheDocument();
  });

  it("styles the active tab with brand color", () => {
    render(<BottomNav active="chat" onNavigate={vi.fn()} />);
    expect(screen.getByText("Conversar")).toHaveClass("text-brand");
    expect(screen.getByText("Início")).toHaveClass("text-faint");
  });

  it("calls onNavigate with the tapped tab", async () => {
    const onNavigate = vi.fn();
    render(<BottomNav active="home" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: /check-in/i }));
    expect(onNavigate).toHaveBeenCalledWith("checkin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test BottomNav -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
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
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              isActive ? "text-brand" : "text-faint"
            }`}
          >
            <Icon size={22} />
            <span className="font-sans text-[11px] font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test BottomNav -- --run`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/presentation/layout/BottomNav.tsx apps/web/src/presentation/layout/BottomNav.test.tsx
git commit -m "feat(web): add BottomNav primitive"
```

---

## Task 9: Manual kitchen-sink verification

**Files:**
- Create (temporary): `apps/web/src/presentation/pages/KitchenSinkPage.tsx`
- Modify (temporary): `apps/web/src/app/router.tsx` (add `/kitchen-sink` route)

**Interfaces:**
- Consumes: every primitive built in Tasks 2–8.
- Produces: nothing — this route is deleted at the end of the task, it exists only to eyeball real rendering (fonts, colors, spacing) that unit tests can't catch.

- [ ] **Step 1: Create the throwaway page**

```tsx
import { Lock, MessageCircle } from "lucide-react";
import { PhoneShell } from "../layout/PhoneShell";
import { BottomNav } from "../layout/BottomNav";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { IconBadge } from "../ui/IconBadge";
import { PrivacyBadge } from "../ui/PrivacyBadge";
import { SectionLabel } from "../ui/SectionLabel";
import { ProgressBar } from "../ui/ProgressBar";
import { ScoreDial } from "../ui/ScoreDial";

export function KitchenSinkPage() {
  return (
    <PhoneShell footer={<BottomNav active="home" onNavigate={() => {}} />}>
      <div className="flex flex-col gap-4 py-6">
        <SectionLabel>eyebrow label</SectionLabel>
        <h1 className="text-h1 text-ink">Heading Newsreader</h1>
        <PrivacyBadge />
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
        <Card>
          <IconBadge icon={MessageCircle} />
          surface card
        </Card>
        <Card tone="brand">brand card</Card>
        <Card tone="brand-tint"><Lock size={16} /> tint card</Card>
        <ProgressBar value={60} />
        <ScoreDial score={12} max={27} band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }} />
      </div>
    </PhoneShell>
  );
}
```

- [ ] **Step 2: Add a temporary route in `router.tsx`**

Add under `children`:

```tsx
      {
        path: "kitchen-sink",
        Component: KitchenSinkPage,
      },
```

(and the corresponding import at the top of the file.)

- [ ] **Step 3: Run the dev server and eyeball it**

Run: `pnpm --filter web dev`
Visit `http://localhost:5173/kitchen-sink`. Verify manually:
- Headings render in Newsreader (serif), body/buttons in Nunito Sans, eyebrow in IBM Plex Mono.
- Sage-green (`#2F6B5E`) primary button, white text.
- No FOUT to a fallback serif/sans after fonts load.
- No console errors about missing Tailwind classes.

- [ ] **Step 4: Delete the throwaway page and route**

```bash
git rm apps/web/src/presentation/pages/KitchenSinkPage.tsx
```

Revert the `router.tsx` edit (remove the import and the `kitchen-sink` route entry) so the file matches Task 9 Step 2's *pre*-state.

- [ ] **Step 5: Run the full test suite and build**

Run: `pnpm --filter web test -- --run && pnpm --filter web build`
Expected: all tests pass, build succeeds — confirms nothing else references the deleted throwaway page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(web): verify design system primitives manually (kitchen-sink, reverted)"
```

> If this commit has an empty diff (kitchen-sink was never committed), skip it — there's nothing to commit.

---

## Acceptance criteria (whole plan)

- `pnpm --filter web build` succeeds; Tailwind emits `brand`, `ink`, `surface`, `danger`, `warn` colors.
- The three font families load with no FOUT to the wrong family (verified manually in Task 9).
- All 8 primitives (`PhoneShell`, `Button`, `Card`, `IconBadge`, `PrivacyBadge`, `SectionLabel`, `ProgressBar`, `ScoreDial`, `BottomNav` — 9 total) exist under `src/presentation/{layout,ui}/` with the exact prop signatures from `ui-primitives.md`.
- No primitive contains a raw hex value except `ScoreDial`'s data-driven band pill.
- Every interactive primitive (`Button`, `BottomNav` tabs) has a visible focus ring and meets the 44×44px hit-target minimum.
- `pnpm --filter web test -- --run` passes with all primitive tests green.

---

## Self-review notes

- **Spec coverage:** Phase 1 (tokens/CSS/fonts) → Task 1. Phase 2 (all 7 primitives + BottomNav) → Tasks 2–8. Phase 2's "kitchen-sink manual check" acceptance criterion → Task 9. All primitive prop signatures in `ui-primitives.md` are reproduced verbatim in each task's Interfaces block.
- **Placeholder scan:** none found — every step has real, complete code.
- **Type consistency:** `PhoneShellProps.bg`, `CardProps.tone`, `IconBadgeProps.tone`, `ButtonProps.variant`, `BottomNavProps.active` (`Tab`) are used identically across every task; no drift between the Interfaces blocks and the implementation code.
