# Manager AI Insight — design spec

**Status:** approved design, not yet implemented. This is the spec an implementation plan
will be written against next.

**Relationship to prior specs:** `2026-07-11-manager-login-simulated-dashboard-design.md`
§7 explicitly deferred "AI-assisted interpretation of the manager dashboard's trends" to a
separate brainstorm — this is that spec. It depends on that plan's `GetManagerSignalsUseCase`
and `ManagerAuthGuard` existing (implement that plan first).

**Why a second, separate AI component:** the app already has one AI integration — the
doctor-facing conversational support chat (`apps/api/src/modules/chat/`). This is
deliberately **not** that component, reused or extended. It's a different capability
(structured one-shot analysis of aggregate numbers, not open-ended peer conversation), for
a different audience (a manager reading a dashboard, not a doctor in distress), with
different tone requirements (professional/analytical, not the chat's carefully-tuned
peer-support register) and different generation parameters (low temperature for consistent,
grounded output, not chat's higher temperature for natural variation). It happens to use
the same underlying provider (Groq) — nothing else is shared: no shared port, no shared
prompt, no shared adapter, no shared conversation state.

---

## 1. Non-negotiables

- **No new privacy boundary is crossed.** The AI only ever receives the same k-anonymized,
  already-aggregated data (`ManagerSignalsResponse`) the manager already sees as numbers on
  the dashboard — the exact same data, reused via `GetManagerSignalsUseCase`, not a second
  data path. It never receives anything below the k=5 threshold (already absent from that
  use-case's output), never receives individual doctor data, never receives raw assessment
  answers or `riskSignal`.
- **Patterns, not diagnoses.** The model must never claim a department "has burnout" or
  frame a segment's numbers as a clinical finding — only as a pattern consistent with
  established burnout research, using tentative, non-diagnostic language.
- **Segments, not individuals.** The model must never write as if it knows anything about a
  specific person — the input structurally cannot contain individual-level data, and the
  prompt reinforces this so the model doesn't fabricate individual framing anyway.
- **Management actions, not clinical ones.** Suggested actions are staffing/process/checking-in
  actions a manager can actually take (schedule a conversation, review shift rotation,
  monitor closely) — never treatment or clinical recommendations. That stays the doctor-facing
  chat/crisis flow's job, untouched by this spec.
- **On-demand only, never on the dashboard's critical path.** The dashboard's real numbers
  render immediately regardless of AI provider availability; the insight is generated only
  when the manager explicitly requests it via a button, and a failure here never breaks or
  blocks the rest of the dashboard.
- **Fail closed on a malformed model response.** If the model doesn't return valid,
  schema-conforming JSON, the manager sees an explicit "couldn't generate analysis" retry
  state — never garbled text, never a crash.

## 2. Architecture

Lives inside the existing `apps/api/src/modules/manager/` module (not a new top-level
NestJS module) — it's fully manager-dashboard-scoped and reuses that module's
`GetManagerSignalsUseCase` (input data) and `ManagerAuthGuard` (access control) directly.
What stays fully separate from `chat/` is every AI-specific file:

```text
apps/api/src/modules/manager/
  application/
    ports/
      ai-insight.port.ts                 (NEW)
    prompts/
      manager-insight-system-prompt.ts   (NEW)
    use-cases/
      generate-manager-insight.use-case.ts (NEW)
  infrastructure/
    ai-providers/
      groq-insight.adapter.ts            (NEW, separate Groq client instance from chat's)
    manager.controller.ts                (MODIFIED — one new endpoint)
  manager.module.ts                       (MODIFIED — new providers)
```

`GroqInsightAdapter` uses `temperature: 0.3` (vs. chat's `0.8`) — this component is making
claims about data and needs consistent, analytically-grounded output, not conversational
variety.

## 3. Data flow & input shaping

`GenerateManagerInsightUseCase(getManagerSignals: GetManagerSignalsUseCase, aiInsight: AiInsightPort)`.
On execution: calls `getManagerSignals.execute()` (the exact same call `GET
/manager/signals` makes — guarantees the insight always describes the same numbers
currently on screen, never a stale or different snapshot), then formats the result into
readable PT-BR text as the prompt's data context:

```text
Dados agregados da equipe (última semana visível, últimas 6 semanas de tendência):
- Taxa geral de sinais preocupantes: 41%
- Check-ins nas últimas 4 semanas: 111
- Tendência semanal (taxa de sinais preocupantes por semana, 6 semanas): 30%, 33%, 38%, 45%, 50%, 55%
- Por setor (apenas setores com 5+ respostas, por privacidade):
  - Plantão noturno: 52% (n=18)
  - Pronto-socorro: 38% (n=24)
  - UTI: 44% (n=9)
```

(Percentages and weekly trend values are formatted from `ManagerSignalsResponse`'s
`overallConcerningRate`, `checkInsLast4Weeks`, `weeklyTrend`, and `segments` fields — see
`2026-07-11-manager-login-simulated-dashboard-design.md` §4 for that response shape.)

## 4. System prompt — domain grounding & guardrails

`manager-insight-system-prompt.ts` (PT-BR constant, same "hand-crafted with an explanatory
comment header" convention as `chat-system-prompt.ts`) instructs the model to:

- Reason using established burnout frameworks already in its training knowledge: the
  Maslach Burnout Inventory's three dimensions (exaustão emocional, despersonalização,
  redução da realização profissional), WHO's ICD-11 classification of burnout as an
  "occupational phenomenon" (explicitly not a medical diagnosis), and Brazil's NR-1
  psychosocial risk management framing. This model-knowledge *is* the grounding — no
  retrieval pipeline, no document store (see §7, out of scope).
- Never speak about individuals — reinforces the structural guarantee in §1 that the input
  contains no individual-level data.
- Interpret patterns, not diagnose — explicit instruction to use tentative,
  pattern-consistent language ("os dados sugerem um padrão consistente com...") never
  diagnostic language ("a equipe está com burnout").
- Output valid JSON matching exactly:

  ```json
  { "interpretation": "2-3 sentences", "suggestedActions": ["2-4 short strings"] }
  ```

- Keep the interpretation to 2-3 sentences and actions concrete/management-scoped
  (scheduling, staffing, monitoring cadence — never clinical/treatment actions).
- Stay brief — a manager reading this is scanning a dashboard, not reading a report.

## 5. API endpoint

**`POST /manager/insights`** — new endpoint on the existing `ManagerController`, gated by
the same `ManagerAuthGuard` as `/manager/signals`. No request body (the bearer token is the
only input; the use-case fetches its own data via `GetManagerSignalsUseCase`).

```ts
interface ManagerInsightResponse {
  interpretation: string;
  suggestedActions: string[];
}
```

Parsing/validating the model's raw completion is the **adapter's** responsibility, not the
use-case's — matching this codebase's existing convention of validating external responses
at the infrastructure boundary (e.g. `HttpManagerSignalsAdapter`'s Zod parsing). If the
completion doesn't parse as valid JSON matching `ManagerInsightResponse`,
`GroqInsightAdapter` itself throws `InsightGenerationFailedError`; the use-case does not
catch it, and the controller maps it to `502`. `AiInsightPort`:

```ts
export interface AiInsightPort {
  generateInsight(params: { summary: string; systemPrompt: string }): Promise<ManagerInsightResponse>;
}
```

## 6. Frontend integration

- `apps/web/src/ports/manager-insight.port.ts` — `ManagerInsightPort { generateInsight(token: string): Promise<ManagerInsightResult> }`, Zod schema matching the backend response, `InsightGenerationFailedError` mapped from a `502`.
- `apps/web/src/infrastructure/http/http-manager-insight.adapter.ts` — same bearer-token fetch pattern as `http-manager-signals.adapter.ts`.
- `apps/web/src/use-cases/generate-manager-insight.usecase.ts` (+ test) — thin delegation wrapper, matching every other use-case this session.
- `apps/web/src/presentation/hooks/useManagerInsight.ts` — `useMutation` (not `useQuery` — on-demand action, not cached data), attaches the token from `useManagerSessionStore`.
- `ManagerDashboardPage.tsx` — new section below "Sinais por setor": a "Gerar análise" button. Three states: idle (button only), loading (`Button`'s existing `loading` prop), result (`interpretation` as a paragraph + `suggestedActions` as a bulleted list in a `Card`). Error state is an inline retry, never blocks the rest of the page.

## 7. Testing approach

**Backend:**
- `generate-manager-insight.use-case.test.ts` — fake `GetManagerSignalsUseCase` output + fake `AiInsightPort`; asserts the formatted PT-BR summary is built correctly from a known fixture; asserts `InsightGenerationFailedError` on a schema-invalid port response.
- `groq-insight.adapter.test.ts` — `vi.mock("groq-sdk")`, same pattern as `groq.adapter.test.ts`; asserts the system prompt is sent, asserts `temperature: 0.3`, asserts a valid JSON completion parses correctly, asserts a malformed completion surfaces as a parse failure.
- `manager.controller.test.ts` (extended) — `POST /manager/insights`: 401 without a token, 200 with the structured shape on success, 502 when the port throws `InsightGenerationFailedError`.

**Frontend:**
- `generate-manager-insight.usecase.test.ts` — fake port, delegation + error passthrough.
- `ManagerDashboardPage.test.tsx` (extended) — idle state shows the button; success shows interpretation + action list; a rejected mutation shows an inline retry state without breaking the rest of the page (segments/trend still render).

## 8. Out of scope (explicitly not decided/built here)

- **Doctor-facing AI insight** (contextualizing a doctor's own check-in against burnout
  research) — a real, named idea from this same conversation, but a different audience with
  different clinical/legal sensitivity (this app is careful never to sound like it's
  diagnosing a person). Deliberately deferred to its own future spec, not bundled here.
- **Follow-up conversation on the generated insight** — one-shot generation only, no
  message history, no multi-turn thread. If this is wanted later, it's closer in shape to
  the existing chat component than to this one.
- **Real retrieval (RAG) over curated documents** (NR-1 text, burnout research papers) — the
  model's training-knowledge grounding is the chosen approach for this timeline; a real
  document/vector-store pipeline is a genuinely new subsystem, not scoped here.
- **Auto-generation on dashboard load, or pre-generated/cached insights** — on-demand button
  click only; no caching layer, no background regeneration job.
- **Insights for individual doctors, or for any data below the k=5 threshold** — structurally
  impossible given the input is `GetManagerSignalsUseCase`'s already-suppressed output, but
  stated explicitly as a permanent constraint, not an oversight to revisit.
