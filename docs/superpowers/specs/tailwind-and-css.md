# Tailwind config, global CSS & fonts

Paste-ready. This replaces the empty `tailwind.config.ts` and the bare `src/app/index.css`,
and adds the font links to `index.html`. After this phase, every token in `design-tokens.md`
is available as a Tailwind utility.

---

## 1. `index.html` — add fonts (in `<head>`, before your CSS)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

> Self-hosting via `@fontsource/*` is acceptable and preferred for a PWA (offline). If you
> self-host, keep the same families/weights and set them in `@font-face` in `index.css`.

---

## 2. `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#2F6B5E", hover: "#1F5A4D", ink: "#21302B" },
        surface: { DEFAULT: "#FFFFFF", brand: "#E3ECE7" },
        canvas: { DEFAULT: "#F2F5F3", alt: "#EEF1EF" },
        ink: { DEFAULT: "#21302B", 2: "#4A584F" },
        muted: { DEFAULT: "#5C6B64", 2: "#66726C" },
        faint: "#9AA7A1",
        line: "#DFE4E1",
        warn: { DEFAULT: "#A9711A", bg: "#F6EDDA", ink: "#85671E" },
        danger: { DEFAULT: "#A2453A", bg: "#F7EBE8", border: "#E3C9C3", ink: "#8A5248" },
        "danger-strong": { DEFAULT: "#8F2F26", bg: "#F5E4E1" },
        dark: { DEFAULT: "#0D1512", brand: "#A8D8C9" },
      },
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", "serif"],
        sans: ['"Nunito Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        eyebrow: ["12px", { lineHeight: "1", letterSpacing: "0.1em" }],
        caption: ["13px", { lineHeight: "1.5" }],
        label: ["14px", { lineHeight: "1.45" }],
        body: ["15px", { lineHeight: "1.55" }],
        h2: ["24px", { lineHeight: "1.3" }],
        h1: ["28px", { lineHeight: "1.2" }],
        display: ["40px", { lineHeight: "1.1" }],
        score: ["64px", { lineHeight: "1" }],
      },
      borderRadius: {
        pill: "999px",
        card: "22px",
        "card-lg": "26px",
        icon: "14px",
        input: "16px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(38,70,60,.06)",
        "card-lg": "0 10px 28px rgba(38,70,60,.07)",
        brand: "0 12px 26px -10px rgba(47,107,94,.7)",
        hero: "0 16px 34px -12px rgba(47,107,94,.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 3. `src/app/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { -webkit-tap-highlight-color: transparent; }
  body {
    @apply bg-canvas font-sans text-ink antialiased;
  }
  /* Links inherit brand; declared here so future links never render browser-blue. */
  a { @apply text-brand no-underline; }
  a:hover { @apply text-brand-hover; }

  h1, h2, h3 { @apply font-serif; }
}

@layer utilities {
  /* Hide scrollbars inside the app scroll containers (mobile-first PWA). */
  .no-scrollbar { scrollbar-width: none; }
  .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 4. Common utility recipes (use these, don't reinvent)

| Intent | Classes |
|---|---|
| Screen padding | `px-6 pb-8 pt-6` (px-6 = 24px) |
| Resting card | `rounded-card bg-surface p-[18px] shadow-card` |
| Hero card | `rounded-card-lg bg-brand p-[22px] text-white shadow-hero` |
| Primary button | `w-full rounded-pill bg-brand py-4 font-sans text-[16px] font-bold text-white` |
| Ghost button | `w-full rounded-pill bg-surface py-4 font-bold text-ink border border-line` |
| Danger button | `w-full rounded-pill bg-danger py-[14px] font-bold text-white` |
| Eyebrow label | `font-mono text-eyebrow uppercase text-muted-2` |
| Privacy chip | `rounded-pill bg-surface-brand px-3 py-[7px] font-mono text-[12px] text-brand` |
| Info callout | `rounded-2xl bg-surface-brand p-[14px] font-mono text-[12.5px] leading-relaxed text-brand` |

## Acceptance criteria
- `pnpm --filter web build` succeeds.
- A probe element with `class="bg-brand text-white font-serif text-h1"` renders sage-green bg,
  white serif heading.
- Fonts: headings render Newsreader, body Nunito Sans, an eyebrow renders IBM Plex Mono.
- No component in later phases contains a raw hex value.
