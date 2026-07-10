# 10 — Crisis: decline (CVV 188)

**Route / File:** `/crisis/line` · `src/presentation/pages/CrisisDeclinePage.tsx`

**Purpose:** Honor "Agora não" without abandonment. No pressure, no penalty — leave the door
open and surface the 24h CVV line prominently.

## Layout
`PhoneShell`, `pt-[30px]`, flex column full height:
1. **Back** — "← Voltar" → `/crisis`.
2. **Title** — `h1` "Tudo bem. A escolha é sua.", `mb-2`.
3. **Body** — `text-body text-muted` "A oferta continua aberta a qualquer momento — sem pressa e
   sem penalidade."
4. **CVV hero** — `Card size="lg" tone="brand"` (solid green): mono eyebrow "linha de crise ·
   24h", `font-serif text-[40px]` "CVV 188", `caption` (white 85%) "Gratuita, sigilosa e
   disponível a qualquer hora. Você pode ligar agora.", white pill button "Ligar para o CVV"
   (`tel:188`).
5. Spacer.
6. **Outline** — "Voltar ao início" → `/home`.

## Copy (PT-BR)
"Tudo bem. A escolha é sua." · "A oferta continua aberta a qualquer momento — sem pressa e sem
penalidade." · "linha de crise · 24h" · "CVV 188" · "Gratuita, sigilosa e disponível a qualquer
hora. Você pode ligar agora." · "Ligar para o CVV" · "Voltar ao início".

## Data / logic
- CVV label/number from `RequestHumanHandoffUseCase.execute()` (one source of truth). No network.
- "Ligar para o CVV" → `href="tel:188"`.

## Interactions
- Call button → dialer. Outline → `/home`. Back → `/crisis`.

## Acceptance criteria
- No penalty/guilt language; autonomy respected.
- CVV number is a real `tel:` link and renders offline.
- Returns user to Home cleanly (no dead-end, no forced loop back to crisis).
