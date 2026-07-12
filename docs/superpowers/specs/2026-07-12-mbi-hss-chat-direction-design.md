# MBI-HSS-aware chat directioning — design spec

**Status:** approved design, not yet implemented. This is the spec an implementation plan
will be written against next.

**Relationship to prior decisions:** `general-documentations/documentacao-produto/adr-002-mbi-hss-direction.md`
records why MBI-HSS stays a gated, unscored assessment for this cycle and establishes that its
*only* permitted practical effect right now is tone/directioning inside the existing acolhimento
chat. This spec is the technical design for that one effect. Read the ADR first — this doc does
not repeat its reasoning about licensing, cutoffs, or the warning-tier decision.

**Why this fits inside the existing chat, not a new component:** unlike
`2026-07-11-manager-ai-insight-design.md` (a deliberately separate AI capability for a
different audience), this is a **content addition to the existing acolhimento chat's static
system prompt** (`apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts`). No new
module, no new port, no new endpoint, no new per-conversation state. The file already documents
its own tone-engineering philosophy (concrete tells over abstract instructions, few-shot
examples over rules alone) — this addition follows that same convention rather than introducing
a new one.

---

## 1. Non-negotiables

- **Never names the instrument or a score.** The model must never say "MBI-HSS," "burnout
  inventory," "exaustão emocional," "despersonalização," or any other clinical/instrument label
  to the user, and must never imply it has computed or observed a score. This stays a background
  interpretive lens for the model, not user-facing content — directly required by FR-4's ban on
  diagnosis-adjacent language.
- **No new signal, no new state.** `hasActiveRiskSignal`, `SendChatMessageUseCase`, and the
  crisis-fallback path are untouched. This spec adds prompt content only; it does not add a
  boolean, a detector, or a new controller path.
- **Never routes to `/crisis`.** Per ADR-002's warning-tier decision, this directioning only
  ever nudges toward the existing always-visible "falar com uma pessoa real" shortcut (FR-6b,
  already in the UI chrome per `screens/11-chat.md`) — it never triggers the acute-crisis
  handoff reserved for PHQ-9 item 9 / future validated acute-risk criteria.
- **Tone calibration, not detection logic.** There is no code that parses user messages for
  MBI-HSS-dimension keywords. The "detection" is entirely inside the LLM's own reading of the
  conversation, guided by the system prompt — consistent with how the rest of this file already
  works (there's no sentiment-analysis pipeline for the existing tone rules either).

## 2. Architecture

No new files, no new module. One modified file:

```text
apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts   (MODIFIED)
```

No changes to `send-chat-message.use-case.ts`, `groq.adapter.ts`, `ai-chat.port.ts`, or any
frontend file — the addition is entirely inside the `CHAT_SYSTEM_PROMPT` string.

## 3. Prompt content — the addition

Appended as a new labeled section within `CHAT_SYSTEM_PROMPT`, after the existing "Regras de
tom" block and before the closing line, following the file's existing register (direct,
example-driven, PT-BR, addressed to the model as instructions):

**New rule block** (paraphrased structure — exact PT-BR copy written at implementation time,
matching the file's existing voice):

- Notice three families of language as *themes*, not diagnostic categories:
  - **Exaustão** — physical/emotional depletion talk ("não durmo", "não aguento mais o
    plantão", "estou no limite").
  - **Cinismo/despersonalização** — detachment from patients/work talk ("não me importo mais",
    "virou só mais um procedimento", "não sinto nada quando um paciente piora").
  - **Baixa realização** — inefficacy/pointlessness talk ("não sirvo mais pra isso", "não faço
    diferença nenhuma", "qualquer um faz o que eu faço").
- These themes calibrate *how* the model responds (see example below) — they never produce a
  label, a score, or a stated observation like "parece que você está com despersonalização."
  That would violate the existing "Regras de tom" ban on clinical third-person paraphrasing
  (line 39 of the current file) — this addition reinforces that ban, doesn't create an
  exception to it.
- **Specific calibration for cinismo/despersonalização**: this is the theme most associated
  with disengagement in the literature the ADR cites, so when it shows up, the model naturally
  and warmly surfaces the "falar com uma pessoa real" option within that same turn — in
  character, as something a colleague would offer, not as a triggered system message.

**New few-shot example**, added to the existing `Exemplos de tom` block (4th example, same
format as the existing three):

```
Exemplo 4
Pessoa: "Sinceramente não sinto mais nada quando um paciente piora. Virou só mais um número."
Assistente certo: "Isso é pesado de admitir, ainda mais pra quem escolheu medicina por se
importar. Às vezes esse tipo de desligamento é o corpo se protegendo de alguma coisa que já
passou do ponto — quer só desabafar aqui, ou prefere falar com uma pessoa de verdade sobre
isso agora?"
Assistente errado (evitar): "Percebo sinais de despersonalização na sua fala, o que pode
indicar burnout. É importante buscar ajuda profissional."
```

## 4. Testing approach

No new automated test is meaningful here — the existing tone rules aren't unit-tested either
(they can't be; correctness is a property of LLM output, not deterministic code). Verification
is manual, same as how the existing tone rules were validated:

- Manually exercise the chat with a message matching each of the three themes (exhaustion,
  cynicism, inefficacy) and confirm: no instrument/score naming, no clinical third-person
  paraphrase, and — for the cynicism case — a natural mention of the human-connection option
  within that turn.
- Confirm the existing three tone examples still hold (no regression to the file's established
  voice) by re-running the existing manual tone check the file's own header describes (largest
  Llama variant, temperature ~0.75–0.85).

## 5. Out of scope (explicitly not decided/built here)

- **Any per-conversation risk-signal state or detector.** If a future spec wants to *track*
  that a conversation showed these themes (e.g., to inform the manager dashboard or a future
  real MBI-HSS flow), that's new state and a new spec — not bundled here.
- **Any change to the assessment flow, `ScoreAssessmentUseCase`, or the disabled MBI-HSS row.**
  Covered by ADR-002; unaffected by this spec.
- **Routing to `/crisis` from this directioning.** Explicitly excluded per ADR-002's
  warning-tier decision — only the existing FR-6b shortcut is ever surfaced.
- **Doctor-facing "here's what your patterns suggest" summaries.** Same category as the
  explicitly-deferred "doctor-facing AI insight" idea noted in
  `2026-07-11-manager-ai-insight-design.md` §8 — a different, higher-sensitivity feature, not
  scoped here.
