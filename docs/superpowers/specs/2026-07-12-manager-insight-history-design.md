# Manager Insight History — design spec

**Status:** approved, ready for planning.

## 1. Problem

`GenerateManagerInsightUseCase` (built in the just-shipped Manager AI Insight feature —
`2026-07-11-manager-ai-insight-design.md`) generates a fresh, structured analysis every time a
manager clicks "Gerar análise" on `ManagerDashboardPage`, but nothing persists it. A manager
cannot consult a past recommendation, compare this week's analysis to a previous one, or export
one to share outside the app. This spec adds persistence (automatic, no extra action from the
manager), an in-app history screen to browse past analyses, and client-side download (PDF or
plain text, manager's choice).

## 2. Data & persistence

New Prisma model, alongside the existing `SimulatedSignal`:

```prisma
model ManagerInsight {
  id               String   @id @default(cuid())
  interpretation   String
  suggestedActions String[]
  summary          String
  generatedAt      DateTime @default(now())

  @@map("manager_insights")
}
```

- `interpretation` / `suggestedActions`: the same fields `ManagerInsightResponse` already
  returns from a live generation — stored verbatim.
- `summary`: the exact aggregate-data string sent to the AI at generation time — the same string
  `GenerateManagerInsightUseCase.formatSummary()` already builds today. Storing it gives a
  manager browsing history the underlying numbers behind each past analysis, not just the AI's
  prose — this is what actually lets them see how things evolved, not merely read old opinions.
- `suggestedActions` uses Postgres's native array column type (`text[]`) — no JSON encoding
  needed, Prisma maps `String[]` directly.
- No cap on row count ("keep everything" — confirmed with the user; storage cost for
  paragraph-sized text rows is negligible even under frequent demo use).

**Privacy:** no new boundary crossed. This is byte-for-byte the same already-k≥5-suppressed
aggregate data `GenerateManagerInsightUseCase` already sends to Groq today (see
`2026-07-11-manager-ai-insight-design.md` and its Global Constraints) — persisting and later
downloading that same text introduces no new risk. `ManagerInsight` rows never contain
individual-level or below-threshold data, by construction (they only ever store what
`GetManagerSignalsUseCase`'s already-safe output produced).

## 3. Backend: auto-save + history endpoint

**Auto-save.** `GenerateManagerInsightUseCase.execute()` gains one step: after a successful
`aiInsight.generateInsight(...)` call, it saves the result via a new
`ManagerInsightRepository.save(...)` before returning the result to the caller. Every successful
"Gerar análise" click auto-saves — no extra frontend orchestration, no opt-in action.

If the save itself throws, the use-case does **not** let that failure propagate as a generation
failure — it catches the save error, logs it via NestJS's built-in `Logger` (no new logging
dependency; this module has no existing logger usage, so this establishes the pattern minimally:
`new Logger(GenerateManagerInsightUseCase.name).error(...)`), and still returns the generated
`ManagerInsightResponse` to the caller. This extends the feature's existing "a failure here must
never break or block the rest of ManagerDashboardPage" principle: a persistence hiccup shouldn't
make a manager think the AI itself failed when it didn't, but it also shouldn't vanish without a
trace.

**New port:**
```ts
interface StoredManagerInsight {
  id: string;
  interpretation: string;
  suggestedActions: string[];
  summary: string;
  generatedAt: Date;
}

interface ManagerInsightRepository {
  save(entry: { interpretation: string; suggestedActions: string[]; summary: string }): Promise<void>;
  findAll(): Promise<StoredManagerInsight[]>;
}
```
Backed by `PrismaManagerInsightRepository`, following the same pattern as the existing
`PrismaSimulatedSignalRepository`.

**New endpoint:** `GET /manager/insights/history`, reusing the existing `ManagerAuthGuard` (same
auth as `/manager/signals` and `/manager/insights`). Returns all saved entries, newest first
(`ORDER BY generatedAt DESC`):
```ts
type ManagerInsightHistoryResponse = StoredManagerInsight[];
```
No pagination for now — data volume is small at hackathon scope, and a paginated version is a
cheap future addition if it's ever actually needed (YAGNI).

## 4. Frontend: history screen + downloads

**New screen:** `/manager/history` (`ManagerInsightHistoryPage`), reached via a "Ver histórico"
link on `ManagerDashboardPage`'s "Análise com IA" card. Lists saved entries newest-first — date,
interpretation text, suggested actions — each with two download actions: "Baixar PDF" and
"Baixar texto."

**New frontend files**, following the existing port/adapter/use-case/hook pattern (mirrors
`useManagerSignals`):
- `apps/web/src/ports/manager-insight-history.port.ts`
- `apps/web/src/infrastructure/http/http-manager-insight-history.adapter.ts`
- `apps/web/src/use-cases/get-manager-insight-history.usecase.ts`
- `apps/web/src/presentation/hooks/useManagerInsightHistory.ts` (`useQuery`, same
  `enabled`/token pattern as `useManagerSignals`)
- `apps/web/src/presentation/pages/ManagerInsightHistoryPage.tsx`
- A new `history: "/manager/history"` entry in `routes.ts`, and a loader guard matching the
  existing `/manager` route family (redirects to `/manager/login` if the session is invalid).

**Downloads are pure client-side, no backend involvement:**
- **Plain text**: build a string from the entry's `interpretation` + `suggestedActions` +
  `generatedAt`, wrap it in a `Blob`, trigger a download via a temporary `<a>` element — no
  library needed.
- **PDF**: use `jsPDF` (lightweight, ~30KB, no dependencies of its own — the standard choice for
  client-side PDF generation) to lay the same content into a simple one-page PDF: title, date,
  interpretation paragraph, bulleted actions.

Both live in a new presentation-layer helper module,
`apps/web/src/presentation/lib/download-manager-insight.ts`
(`downloadInsightAsPdf(entry)`, `downloadInsightAsText(entry)`) — not a "use-case," since they
touch browser/DOM APIs (Blob, anchor elements, `jsPDF`) directly. This matches the codebase's
existing boundary rule that `use-cases/` never import React or `infrastructure/`.

## 5. Technical debt: shared history

Since manager auth is a single shared institutional code (no individual manager accounts —
see `identity-and-aggregation.md`), history is inherently shared: any manager who logs in sees
every saved entry, not a personal history scoped to their own team. This is accepted for now,
but must be logged as technical debt, not silently forgotten.

A new entry, `TD-002`, gets added to `docs/superpowers/specs/technical-debt.md` (matching the
existing `TD-001` format), stating: decision (shared history accepted), risk (none today — all
saved data is already anonymous aggregate, so sharing it isn't a privacy issue, just a UX
limitation), and revisit trigger (if/when individual manager logins are ever built, per
`identity-and-aggregation.md`'s deferred `User`/`Role.MANAGER` design, history should be scoped
so each manager sees only their own team's saved analyses).

## 6. Testing approach

**Backend:**
- `PrismaManagerInsightRepository` test — matches the existing `PrismaSimulatedSignalRepository`
  test pattern (real Prisma against a test/dev DB).
- `GenerateManagerInsightUseCase` test additions: confirms `repository.save(...)` is called with
  the correct `{ interpretation, suggestedActions, summary }` after a successful generation, and
  confirms that a `save()` rejection does **not** prevent the use-case from returning the
  generated result (the core "never block the live result" behavior from §3).
- `manager.controller.test.ts` additions: `GET /manager/insights/history` returns 401 with no
  token, returns the saved entries ordered newest-first with a valid token.

**Frontend:**
- Port/adapter/use-case/hook tests, following the exact pattern already established for
  `manager-signals`/`manager-insight`.
- `ManagerInsightHistoryPage.test.tsx`: renders entries from a fake history response, download
  buttons trigger `downloadInsightAsPdf`/`downloadInsightAsText` with the right entry.
- `download-manager-insight.test.ts`: verifies the text/PDF generation functions produce output
  containing the expected content (e.g. `jsPDF`'s output can be inspected via its own test
  utilities, or the test verifies the correct data is passed to `jsPDF`'s API calls).
- `a11y.test.tsx`: add `ManagerInsightHistoryPage` to the existing per-screen axe pass.

## 7. What this spec does NOT do

- Does not add pagination to the history endpoint — full list every time, revisit if volume ever
  becomes real (see §3).
- Does not build individual manager accounts or per-manager history scoping — tracked as
  technical debt (§5), not solved here.
- Does not change anything about live "Gerar análise" generation itself, `GetManagerSignalsUseCase`,
  or the k-anonymity threshold — this spec only adds a persistence + retrieval + export layer
  downstream of the existing, unchanged generation flow.
