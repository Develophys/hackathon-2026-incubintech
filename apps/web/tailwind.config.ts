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
        muted: { DEFAULT: "#5C6B64", 2: "#7C8A83" },
        faint: "#9AA7A1",
        line: "#DFE4E1",
        warn: { DEFAULT: "#A9711A", bg: "#F6EDDA", ink: "#8A6A1F" },
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
