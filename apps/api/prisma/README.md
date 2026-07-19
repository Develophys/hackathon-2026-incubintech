# apps/api/prisma

## Seeding simulated manager-dashboard data

`pnpm --filter @zelo/api prisma:seed` populates the `simulated_signals` table with 6 weeks
of fabricated department check-in data, powering `ManagerDashboardPage`. This is
**demo data, not real assessment data** — see
`docs/superpowers/specs/2026-07-11-manager-login-simulated-dashboard-design.md` for why the
manager dashboard can never read real (encrypted) assessments.

The script is idempotent: it deletes all existing `SimulatedSignal` rows and regenerates
them relative to today's date, so re-running it mid-demo always produces a fresh, current
6-week window with no manual cleanup.

**"Concerning" rule:** a simulated check-in counts as concerning if it would have scored
"Moderado" or worse on the app's existing PHQ-9/GAD-7 severity bands (`apps/web/src/presentation/lib/band-for.ts`).
To change this bar, edit both the design spec (§3) and `seed-data.ts`'s `SCENARIOS` table —
nothing else in the pipeline encodes this rule.

**k-anonymity threshold:** `K_ANONYMITY_THRESHOLD = 5`, defined in
`../src/modules/manager/application/constants.ts`. A department's data is only ever
returned by `GET /api/manager/signals` for weeks where it has at least this many check-ins.

**Seed scenario** (`seed-data.ts`'s `SCENARIOS`):

| Department | checkIns/week | Concerning rate | Purpose |
|---|---|---|---|
| Pronto-socorro | 24 | flat 37.5% | baseline "normal" department |
| Plantão noturno | 18 | flat 50% | baseline "elevated but stable" |
| UTI | 10 | climbing 30% → 60% | demo narrative — visibly worsening trend |
| Ambulatório | 3 | irrelevant | always below k=5, proves suppression works |

## Seeding simulated follow-up KPI data

The same `prisma:seed` run also populates `simulated_follow_ups` with 6 weeks of fabricated
"crisis follow-up" send/response counts — **demo data, not real follow-up records**. It exists
so a follow-up response-rate KPI has believable history to render without needing real crisis
protocol usage yet.

Like `simulated_signals`, the script is idempotent: it deletes all existing
`SimulatedFollowUp` rows and regenerates them relative to today's date via
`buildFollowUpSeedRows` in `seed-data.ts`.

**Seed scenario** (`seed-data.ts`'s `FOLLOW_UP_SCENARIO`): 6 weeks, oldest first, with the
sent/responded counts climbing from 20 sent / 9 responded (45%) to 30 sent / 21 responded
(70%) — a believable, improving-but-imperfect response rate for the demo. Edit only that
table to change the scenario.
