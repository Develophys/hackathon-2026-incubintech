# 07 — Result

**Route / File:** `/assessment/result` · `src/presentation/pages/AssessmentResultPage.tsx`

**Purpose:** Show the on-device score with a warm, non-alarming frame ("sinal, não
diagnóstico"), and route to the next step. If a risk signal is present, surface a gentle,
prominent path to a human — **without** blocking the rest of the screen.

## Layout
`PhoneShell`, `pt-7`:
1. **On-device stamp** — centered `SectionLabel` "🔒 processado no seu aparelho" (Lock icon).
2. **Score card** — `ScoreDial` inside `Card size="lg" shadow-card-lg`, centered:
   - `caption text-muted-2` "Sua pontuação PHQ-9"
   - `ScoreDial score max band` → 64px serif number, "/27" faint, band pill.
3. **Reframe copy** — `body text-muted`, `my-[18px]`: "Isto é um sinal, não um diagnóstico. Ele
   ajuda a decidir o próximo passo — no seu tempo."
4. **Risk callout (conditional)** — `RiskSignalCallout`, only if `riskSignal === true`:
   `bg-danger-bg border border-danger-border rounded-2xl p-[18px]`, title `text-danger`
   "Notamos um sinal importante.", body `text-danger-ink`, danger button "Falar com alguém
   agora" → `/crisis`.
5. **Primary CTA** — `Button primary` "Conversar com o acolhimento" → `/chat`.
6. **Ghost** — "Voltar ao início" → `/home`.

## `components/ResultBandCard.tsx` & `components/RiskSignalCallout.tsx`
- `ResultBandCard` wraps `ScoreDial` + labels.
- `RiskSignalCallout` props: `{ onConnect: () => void }`.

## Band logic (define here, not in domain)
Use the PHQ-9 band palette from `design-tokens.md`. Function `bandFor(scaleType, score)` returns
`{ label, fg, bg }`. GAD-7 thresholds: 0–4 Mínimo, 5–9 Leve, 10–14 Moderado, 15–21 Grave.

## Copy (PT-BR)
"Sua pontuação PHQ-9" · reframe line above · risk: "Notamos um sinal importante." / "Você não
está sozinho(a). Podemos te conectar com alguém agora." / "Falar com alguém agora" · "Conversar
com o acolhimento" · "Voltar ao início".

## Data / logic
- Read `useLocation().state` → `{ scaleType, totalScore, max, riskSignal }`. If null → redirect
  `/assessment`.
- **Do not recompute** the score or refetch. `riskSignal` is display-only.

## Interactions
- Risk button (if shown) → `/crisis`.
- Primary → `/chat`. Ghost → `/home`.

## Acceptance criteria
- Correct band label + colors for the score (test boundary values 4/5, 9/10, 14/15, 19/20).
- Risk callout appears iff `riskSignal` true; when true it does not hide the other CTAs.
- Refresh/deep-link with no state redirects cleanly.
- "sinal, não diagnóstico" framing present and prominent.
