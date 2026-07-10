# 05 — Assessment select

**Route / File:** `/assessment` · `src/presentation/pages/AssessmentSelectPage.tsx`

**Purpose:** Choose a validated scale. PHQ-9 & GAD-7 are active; MBI-HSS is shown but disabled
("em breve") because its items are licensed and scoring throws.

## Layout
`PhoneShell`, `pt-[26px]`:
1. **Back** — "← Início" → `/home`.
2. **Title** — `h1` "Autoavaliação", **Sub** `caption text-muted` "Escolha uma escala validada.
   Leva cerca de 5 minutos."
3. **Scale rows** (`gap-[12px]`):
   - **PHQ-9** — `Card`-button, `justify-between`: left title `body-strong` "PHQ-9" + `caption`
     "Humor e sinais de depressão"; right `→` in `text-brand`. → `/assessment/phq9`.
   - **GAD-7** — same pattern, "Ansiedade". → `/assessment/gad7`.
   - **MBI-HSS** — disabled row: `bg-canvas-alt`, `opacity-70`, title `text-muted`, right side a
     mono pill "em breve" (`bg-line text-muted-2`). Not tappable.
4. **Trust footer** — `SectionLabel` centered "🔒 tudo processado no seu aparelho" (Lock icon).

## Copy (PT-BR)
"Autoavaliação" · "Escolha uma escala validada. Leva cerca de 5 minutos." · PHQ-9 "Humor e
sinais de depressão" · GAD-7 "Ansiedade" · MBI-HSS "Burnout ocupacional" + "em breve" ·
"tudo processado no seu aparelho".

## Data / logic
- MBI-HSS **must not** be selectable — `ScoreAssessmentUseCase.execute("MBI-HSS", …)` throws by
  design. Render it disabled; do not route to it.
- No data fetch here; scale metadata is static (`domain/assessment-scales`).

## Interactions
- PHQ-9 → `/assessment/phq9`; GAD-7 → `/assessment/gad7`; MBI-HSS → inert.

## Acceptance criteria
- MBI-HSS visibly disabled and non-interactive (no pointer cursor, no route).
- Two active rows navigate correctly.
- On-device trust line present.
