# 11 — Chat (acolhimento)

**Route / File:** `/chat` · `src/presentation/pages/ChatPage.tsx` (restyle existing; keep logic)

**Purpose:** AI active-listening support. This screen already works — it consumes
`useChatConversation` and streams tokens. **Do not change the logic**; re-skin it to Sereno and
keep the two non-negotiables: the disclaimer banner and the persistent "falar com uma pessoa
real" shortcut.

## Keep from the existing implementation
- `useChatConversation(CONVERSATION_ID)` → `{ messages, isStreaming, crisisFallback,
  providerError, sendMessage }`.
- `sendMessage(text, false)` — the `hasActiveRiskSignal` arg stays `false` here (see the code
  comment in the current `ChatPage`: real risk-signal detection is a separate, not-yet-built
  feature; wiring `crisisFallback` back in would be circular).
- The anonymization happens in the use-case (`AnonymizeTextUseCase`) before send — do not move it
  to the component.

## Layout
`PhoneShell` (no BottomNav on chat), flex column full height:
1. **Header** — `bg-surface border-b border-surface-brand`, `flex items-center gap-3 p-[14px_20px]`:
   back arrow → `/home`; title stack `body-strong` "Acolhimento" + `mono-data text-muted-2`
   "texto anonimizado antes do envio".
2. **Disclaimer banner** — full-width `bg-warn-bg text-warn-ink text-[12.5px] text-center p-[9px]`
   "Acolhimento por IA — não substitui atendimento profissional." **Non-dismissable.**
3. **Message list** — `flex-1 overflow-y-auto no-scrollbar p-[18px_16px] flex flex-col gap-3`.
   Map `messages`:
   - assistant: `self-start bg-surface text-ink rounded-[20px] rounded-bl-md shadow-card`,
     `max-w-[80%] p-[13px_15px] text-[14.5px] leading-relaxed`.
   - user: `self-end bg-brand text-white rounded-[20px] rounded-br-md`.
   - Streaming assistant bubble updates in place (already handled by the hook).
   - If `providerError`: inline `text-danger` retry note. If `crisisFallback`: surface the CVV
     line inline (reuse handoff copy).
4. **Handoff button** — `bg-surface-brand text-brand rounded-2xl p-[13px] mx-4 font-bold`
   "🫂 Falar com uma pessoa real" (HeartHandshake icon) → `/crisis`. **Always visible.**
5. **Composer** — reuse `ChatComposer` (existing) restyled: input `bg-surface border border-line
   rounded-pill p-[13px_18px]` placeholder "Escreva como você está…"; send button 46px circle
   `bg-brand text-white` (`ArrowUp`), disabled while `isStreaming`.

## Copy (PT-BR)
"Acolhimento" · "texto anonimizado antes do envio" · disclaimer above · "Falar com uma pessoa
real" · placeholder "Escreva como você está…".

## Data / logic
- Wraps existing hook + `ChatComposer` + `ChatMessageList` (you may inline the list styling or
  restyle `ChatMessageList.tsx`). Keep `CONVERSATION_ID` handling as-is.
- Handoff button opens `/crisis` (route) instead of the old in-page `HumanHandoffPanel` — or keep
  the panel if product prefers a sheet; either way it must not depend on the network.

## Interactions
- Send → `sendMessage(text, false)`. Handoff → `/crisis`. Back → `/home`.

## Acceptance criteria
- Disclaimer always present; handoff button always present (both survive scroll & streaming).
- Bubbles styled per Sereno; streaming updates the last assistant bubble in place.
- With the provider forced to error, the handoff/CVV path still works (network-independent).
- No change to anonymization or send semantics.
