# Chat improvements from David's feedback — design spec

**Status:** mixed. Sections A and B are ready to implement now (quick wins, target before 25/07). Sections C and D are specced for later — post-hackathon build, not part of the 25/07 demo scope.

**Source:** informal feedback from Dr. David Mendes (the same doctor interviewed for ENT-01, referenced in `chat-system-prompt.ts`) while testing the app, relayed 20/07/2026:
1. In an anxiety crisis it's hard to talk/type — a breathing-technique guide could help.
2. Chat conversations aren't stored — can't go back to an old one.
3. The AI asks too many questions in a row — feels like an interrogation.
4. The AI could ask the person to rate their anxiety level in chat and route them to in-app resources based on the answer.

## 0. Context that shaped every decision below

- The chat pipeline is pure text streaming: `AiChatPort.streamReply()` (`apps/api/src/modules/chat/application/ports/ai-chat.port.ts`) takes messages + a system prompt and yields `ChatToken` deltas. There is **no tool-calling or structured output** anywhere in this path. Any design that assumes the AI can trigger an action directly is wrong — the AI can only produce prose. Real actions have to be wired through app UI, not parsed out of model text.
- `ChatPage.tsx` currently has zero persistence: messages live in `useChatConversation`'s `useState`, and `CONVERSATION_ID` is a hardcoded constant. Nothing survives a refresh.
- The app has **no auth/account system** anywhere in `apps/api/src/modules` (only `assessment`, `chat`, `health`, `manager`). Anonymity is the core product pitch (`docs/superpowers/specs/identity-and-aggregation.md`), not an oversight — any design here has to preserve that, not work around it.
- A GAD-7/PHQ-9 self-assessment flow already exists end-to-end (`AssessmentSelectPage` → `Gad7AssessmentPage`/`Phq9AssessmentPage` → `AssessmentResultPage`), scored locally (`score-assessment.usecase.ts`, `band-for.ts`) and persisted locally, **encrypted**, via `IndexedDbAssessmentStoreAdapter` and `encrypt-assessment.usecase.ts`. This is the validated instrument the ACM confirmed is the right approach (per `docs/superpowers/specs/2026-07-19-crisis-direction-rescope-design.md` context) — item 4 should point at it, not reinvent it.

## A. Quick win — cap AI questions per message (ship now)

Single-line addition to `CHAT_SYSTEM_PROMPT` in `apps/api/src/modules/chat/application/prompts/chat-system-prompt.ts`, in the existing "Regras de tom" block:

> Faça no máximo uma pergunta por resposta. Muitas respostas podem não ter pergunta nenhuma — uma reação ou observação curta já é suficiente; nem toda resposta precisa terminar em pergunta.

This sits next to the existing "nem toda resposta precisa seguir a fórmula 'valide + pergunta aberta'" rule (line 40 today) rather than duplicating it — it's a stricter, explicit cap on top of that existing looser guidance. No code changes outside the prompt string.

**Acceptance criteria:** the prompt file contains the new rule; no other files change. This is prompt engineering — verify by manually running a few chat turns and confirming replies don't stack multiple questions, not by an automated test (the existing prompt has no automated tone tests today, per `chat-system-prompt.ts` having no sibling `.test.ts`).

## B. Quick win — anxiety-rating CTA surfaced from chat (ship now)

Two independent pieces, per §0's tool-calling constraint:

- **Prompt addition** (same file, same block): give the AI permission — not a script — to mention the idea of a quick check-in when it detects language suggesting acute anxiety/overwhelm, in the chat's existing colloquial voice. E.g.: *"Quando perceber sinais de ansiedade ou sobrecarga na fala da pessoa, você pode mencionar a ideia de fazer uma avaliação rápida (não é obrigatório, e não repita isso a cada mensagem) — mas não conduza a conversa inteira em torno disso."*
- **UI**: add a second persistent button to `ChatPage.tsx`, alongside the existing "Falar com uma pessoa real" button (same visual treatment — `bg-surface-brand`, pill/rounded, icon + label), labeled "Avaliar como estou" or similar, routing to `routes.assessment` (the existing `AssessmentSelectPage`, which already lets the person choose GAD-7 or PHQ-9 — no need to hardcode one). This button is **always visible**, not conditionally rendered based on AI output — reliability doesn't depend on parsing what the model said.

**Why reuse the existing assessment flow instead of a new in-chat 1-10 rating:** GAD-7 is already the clinically validated instrument the ACM confirmed as correct, already scored, already banded, already encrypted at rest. A bespoke "rate 1-10 in chat" mechanic would duplicate that pipeline for a less rigorous result, for no time saved (the button + route already exist).

**Acceptance criteria:**
- `CHAT_SYSTEM_PROMPT` contains the new permission-to-suggest rule.
- `ChatPage.tsx` renders a second CTA button routing to `routes.assessment`, visible on every chat render regardless of conversation state.
- `ChatPage.test.tsx` gains a test asserting the new button is present and navigates correctly (follow the existing test pattern already used for the "Falar com uma pessoa real" button in that file).

## C. Spec for later — breathing exercise (post-hackathon)

**Trigger:** same two-track pattern as B.
- Prompt permission (not a script) for the AI to mention trying a breathing exercise when it detects the person is struggling to articulate themselves, in the same voice as the rest of `CHAT_SYSTEM_PROMPT`.
- A third persistent button in `ChatPage.tsx`'s CTA row (wind/lungs icon, e.g. `lucide-react`'s `Wind`), always visible, routing to a new `routes.breathing` → `BreathingExercisePage`.

**Content:** new page, `apps/web/src/presentation/pages/BreathingExercisePage.tsx`, following the existing page/route/`PhoneShell` pattern used by every other screen. v1 scope:
- One technique: box breathing (4s in → 4s hold → 4s out → 4s hold), looped.
- A single animated circle (CSS transform scale, timed to the 4-phase cycle) with a short text label per phase ("inspire", "segure", "expire", "segure") — large, minimal, no reading comprehension required beyond one word at a time.
- A cycle counter and a way to stop and return to chat at any point (`BackButton`, same as every other screen).
- No settings, no technique picker, no audio — v1 is deliberately one fixed technique. Multiple techniques are v2 scope, not this spec.

**Acceptance criteria (for whenever this gets built):**
- `BreathingExercisePage` renders and animates the 4-phase cycle without requiring any input from the user beyond starting/stopping.
- Reachable from chat via the persistent button regardless of conversation state, and via back navigation without losing the in-progress chat conversation underneath it.
- `CHAT_SYSTEM_PROMPT` gains the permission-to-suggest rule described above.

## D. Spec for later — conversation persistence (post-hackathon)

**Storage:** local-only, IndexedDB, mirroring the existing `IndexedDbAssessmentStoreAdapter` pattern (`apps/web/src/infrastructure/storage/indexeddb-assessment-store.adapter.ts`) — same library, same "no backend, no accounts" shape. This is a deliberate architectural echo of §0's identity constraint, not a new decision.

**Encryption:** the assessment store never persists plaintext — records go through `encrypt-assessment.usecase.ts` first, and the app already explains this to users via `EncryptionInfoModal`. Chat history should follow the same convention: encrypt message content client-side before writing to IndexedDB, so chat isn't the one local data store that's the odd one out.

**Scope:** one continuous thread that survives closing/reopening the app — **not** a multi-session "list of past conversations" screen (bigger UI lift than what was asked for; David's complaint was "I can't get back to what I already said," not "I want to browse named chat threads"). Concretely:
- New adapter `apps/web/src/infrastructure/storage/indexeddb-chat-store.adapter.ts`, same shape as the assessment one: `save(message)` / `listAll()`.
- `useChatConversation` (`apps/web/src/presentation/hooks/useChatConversation.ts`) loads persisted messages for `CONVERSATION_ID` on mount instead of starting from `[]`, and saves each new message (both user and assistant, once streaming completes) as it's appended.
- `CONVERSATION_ID` in `ChatPage.tsx` stays a hardcoded constant — there's still exactly one conversation per device, so no session-switching logic is needed.

**Acceptance criteria (for whenever this gets built):**
- Closing and reopening the app (simulated in tests as unmount/remount of `ChatPage`) restores the prior message list from IndexedDB.
- Message content is encrypted at rest, following the same `encrypt-assessment.usecase.ts` pattern (new sibling use case, not a reuse of the assessment-specific one, since the payload shape differs).
- No new backend/API surface — this is a frontend-only change.

## Summary of what changes where

| Item | Ship by 25/07? | Files touched |
|---|---|---|
| A. Question cap | Yes | `chat-system-prompt.ts` |
| B. Anxiety-rating CTA | Yes | `chat-system-prompt.ts`, `ChatPage.tsx`, `ChatPage.test.tsx` |
| C. Breathing exercise | No — spec only | `chat-system-prompt.ts`, `ChatPage.tsx`, new `BreathingExercisePage.tsx`, `routes.ts` |
| D. Conversation persistence | No — spec only | new `indexeddb-chat-store.adapter.ts`, new encrypt use case, `useChatConversation.ts` |
