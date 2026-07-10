# 01 — Splash

**Route / File:** `/` · `src/presentation/pages/SplashPage.tsx`

**Purpose:** Warm first impression + entry point. Sets the confidential, calm tone in one screen.

## Layout (top → bottom, full-bleed, centered)
`PhoneShell bleed` with a soft vertical gradient background: `linear-gradient(180deg,#EEF4F1,#F2F5F3)`
(add as an inline style or a `bg-gradient` utility; this is a one-off, acceptable).
Vertically centered column, `text-center`, `px-[34px]`:
1. **Logo mark** — 88×88, `rounded-[26px] bg-brand shadow-hero`, centered `z` wordmark in
   `font-serif text-[46px] text-white`.
2. **Wordmark** — "Zelo" `font-serif text-display text-ink`, `mt-[26px]`.
3. **Tagline** — `text-body text-ink-2`, max-width ~250px.
4. Spacer (`flex-1`) pushes CTA down.
5. **Primary CTA** — full-width `Button primary` "Começar".
6. **Trust line** — `SectionLabel` centered, `mt-[18px]`.

## Copy (PT-BR)
- Tagline: **"Cuidado confidencial para quem cuida."**
- CTA: **"Começar"**
- Trust line: **"anônimo · criptografado · no seu controle"**

## Data / logic
- On mount, if `useConsentStore().hasConsented` → `navigate(routes.home, { replace: true })`
  (handled by the `/` loader per routing spec; keep a component-level guard as backup).

## Interactions
- "Começar" → `routes.privacy`.

## Acceptance criteria
- Centered layout holds on small (360×640) and large (430×932) viewports.
- Warm start (consented) never shows Splash — redirects to Home.
- CTA hit target ≥ 52px; trust line legible (`text-muted-2`, ≥ 12px).
- No emoji; logo is typographic.
