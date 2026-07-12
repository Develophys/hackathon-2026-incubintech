# 13 — Manager dashboard (aggregated, anonymized)

**Route / File:** `/manager` · `src/presentation/pages/ManagerDashboardPage.tsx`

**Purpose:** Give a manager/coordinator a view of team burnout trends **without ever enabling
re-identification**. Only anonymous, aggregated data; any segment with fewer than 5 responses is
suppressed (k-anonymity, k=5).

> **Access (as of `2026-07-11-manager-login-simulated-dashboard-design.md`):** real,
> server-enforced. The Home "demo" link goes to this route, but a router `loader` redirects to
> `screens/14-manager-login.md`'s screen if there's no valid manager session — see
> `routing-and-state.md` §5 for the full authentication model and why it's a real gate even
> though the data behind it is simulated.
> **Backend status:** built. `GET /manager/signals`, gated by `ManagerAuthGuard`, returns real
> (but intentionally fabricated — not derived from real doctor assessments, see the design
> spec §1 for why that's structurally impossible) aggregate data from a seeded `SimulatedSignal`
> table.

## Layout
`PhoneShell bg="canvas-alt"`, `pt-[26px]`:
1. **Back** — "← Sair da demo" → `/home`.
2. **Eyebrow** — `SectionLabel` "Painel do gestor".
3. **Title** — `h1` (24px) "Tendências da equipe".
4. **Privacy note** — `caption text-muted` "Somente dados anônimos e agregados. Segmentos com
   menos de 5 respostas ficam ocultos para evitar re-identificação."
5. **KPI row** — two `Card`s side by side: `font-serif text-[30px]` figure + `caption`, both from
   `useManagerSignals()`'s response, not hardcoded:
   - `Math.round(overallConcerningRate * 100)}%` (`text-warn`) "sinais de burnout na equipe"
   - `checkInsLast4Weeks` (`text-brand`) "check-ins nas últimas 4 semanas"
6. **Trend chart** — `Card` titled "Tendência geral", a 6-bar chart from `weeklyTrend` (one bar
   per seeded week, org-wide — see `routing-and-state.md` §5 and the design spec §4 for why an
   org-wide weekly sum is safe to include even a suppressed department in).
7. **Segment bars** — `Card` titled `body-strong` "Sinais por setor". For each sector a labeled
   horizontal bar: label + `mono-data` "`{value}% · n={n}`"; track `bg-canvas-alt`, fill
   `bg-brand`. `segments` only ever contains sectors with `n >= 5` — **the server already
   removed sub-threshold sectors before this response was built**; the frontend renders the
   array verbatim and does not re-filter (a client-side filter here would be redundant at best
   and a false sense of security at worst — see design spec §1).

## Copy (PT-BR)
"Painel do gestor" · "Tendências da equipe" · privacy note above · "sinais de burnout na
equipe" · "check-ins nas últimas 4 semanas" · "Sinais por setor". Sectors: "Plantão noturno",
"Pronto-socorro", "UTI", "Ambulatório".

## Data / logic
- `useManagerSignals()` (`apps/web/src/presentation/hooks/useManagerSignals.ts`) — a
  `useQuery` reading `apps/web/src/use-cases/get-manager-signals.usecase.ts`, which calls
  `GET /manager/signals` with the manager session's bearer token attached.
- The k=5 suppression is enforced **server-side**, once, in
  `apps/api/src/modules/manager/application/use-cases/get-manager-signals.use-case.ts` — a
  segment under threshold is never constructed into the response, let alone serialized. There
  is no client-side re-filtering to test here; the frontend contract is "render whatever
  `segments` contains."
- The underlying data is fabricated (`apps/api/prisma/seed-data.ts`,
  documented in `apps/api/prisma/README.md`) — real doctor assessments are end-to-end
  encrypted and structurally cannot feed this dashboard (design spec §1). This is a
  demo-data decision, not a missing feature.
- A `401` from `GET /manager/signals` (session expired mid-visit) clears the manager session
  and redirects to `screens/14-manager-login.md`'s screen — handled in
  `ManagerDashboardPage.tsx`'s own effect, independent of the route loader that guards initial
  entry.
- No drill-down to individuals — there is no per-person data here by design, and none could
  exist even if someone tried to add it (the aggregation never receives individual-level rows).

## Interactions
- Back ("Sair da demo") → `/home`.
- "Gerar análise" (AI insight button) — see
  `2026-07-11-manager-ai-insight-design.md`; not covered by this screen doc.

## Acceptance criteria
- A department with `n < 5` in the current week never appears in the API response (verify
  server-side — see `get-manager-signals.use-case.test.ts`'s suppression tests — not by
  inspecting the rendered DOM, since a client-side check would prove nothing about privacy).
- Only aggregate figures shown; no identifiers, no way to reach an individual.
- Privacy/suppression note present.
- Visiting `/manager` with no valid manager session redirects to `/manager/login` before this
  screen ever renders.
