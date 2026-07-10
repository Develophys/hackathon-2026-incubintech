# 13 — Manager dashboard (aggregated, anonymized)

**Route / File:** `/manager` · `src/presentation/pages/ManagerDashboardPage.tsx`

**Purpose:** Give a manager/coordinator a view of team burnout trends **without ever enabling
re-identification**. Only anonymous, aggregated data; any segment with fewer than 5 responses is
suppressed (k-anonymity, k=5).

> **Access:** in this build it's reachable via the Home "demo" link. Before production, gate it
> behind a manager role — leave a `// TODO(auth): gate behind manager role` at the top.
> **Backend status:** aggregation endpoint is not yet built — placeholder data, marked
> `// TODO(week2): aggregation API`.

## Layout
`PhoneShell bg="canvas-alt"`, `pt-[26px]`:
1. **Back** — "← Sair da demo" → `/home`.
2. **Eyebrow** — `SectionLabel` "Painel do gestor".
3. **Title** — `h1` (24px) "Tendências da equipe".
4. **Privacy note** — `caption text-muted` "Somente dados anônimos e agregados. Segmentos com
   menos de 5 respostas ficam ocultos para evitar re-identificação."
5. **KPI row** — two `Card`s side by side: `font-serif text-[30px]` figure + `caption`:
   - "41%" (`text-warn`) "sinais de burnout na equipe"
   - "111" (`text-brand`) "check-ins nas últimas 4 semanas"
6. **Segment bars** — `Card` titled `body-strong` "Sinais por setor". For each sector a labeled
   horizontal bar: label + `mono-data` "`{value}% · n={n}`"; track `bg-canvas-alt`, fill
   `bg-brand`. Only render sectors with `n >= 5`.

## Copy (PT-BR)
"Painel do gestor" · "Tendências da equipe" · privacy note above · "sinais de burnout na
equipe" · "check-ins nas últimas 4 semanas" · "Sinais por setor". Sectors: "Plantão noturno",
"Pronto-socorro", "UTI", "Ambulatório".

## Data / logic
- Placeholder aggregate array `{ label, value, n }`. **Filter out any entry with `n < 5`
  before render** — this is the privacy rule, enforce it in code even on placeholder data so the
  behavior is correct when the real API lands.
- No drill-down to individuals — there is no per-person data here by design.

## Interactions
- Back → `/home`.

## Acceptance criteria
- Any segment with `n < 5` is not rendered (test by adding a `{label:'X', value:60, n:3}` entry —
  it must disappear).
- Only aggregate figures shown; no identifiers, no way to reach an individual.
- Privacy/suppression note present.
- Placeholder + role-gate + aggregation-API TODOs present in code.
