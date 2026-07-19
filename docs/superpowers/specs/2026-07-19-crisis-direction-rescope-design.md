# Crisis direction re-scope — design spec

**Status:** design, ready to implement. Derived from `general-documentations/documentacao-produto/adr-003-crisis-protocol-rescope-peer-chat-differentiator.md` (Parte 1) and the ACM's answer to question 1.2 (`general-documentations/Perguntas encaminhadas a ACM.pdf`): "não é esperada integração técnica direta com esses serviços nesta fase; o essencial é o direcionamento correto e imediato", with routing differentiated by "vínculo do profissional — rede SUS ou plano de saúde/rede privada."

## 1. What already exists (read before changing anything)

`screens/09-crisis-accept.md` and `CrisisAcceptPage.tsx` are **already a designed placeholder**, not a real live-connection feature:

- `generateEphemeralToken()` (`apps/web/src/presentation/lib/generate-ephemeral-token.ts`) produces a random display-only string. It is never persisted, never sent over the network. Its only caller is `CrisisAcceptPage.tsx`.
- The primary button ("Iniciar conversa segura") just navigates to `/chat` — the existing AI acolhimento surface. No backend call happens anywhere on this screen today.
- `RequestHumanHandoffUseCase` (`apps/web/src/use-cases/request-human-handoff.usecase.ts`) is a separate, unrelated use case: it powers the FR-6b "talk to a real person" shortcut inside the chat (`/chat`), not this screen. It is out of scope for this change and does not need to move.

**Consequence:** there is no live-connection code to rip out. This is a content/UX change to one screen plus one new pure use case — genuinely cheap, consistent with ADR-003's framing.

## 2. What changes

`CrisisAcceptPage.tsx` (route `/crisis/connect`, unchanged — no router/test-suite-wide renames, to keep blast radius minimal 6 days before the final) stops simulating "connecting to a psychologist" and instead asks the one piece of information needed to route correctly, then shows the routing result. No live-connection illusion, no ephemeral token, no "disponível agora" status.

### New flow on `/crisis/connect`

1. On entry, before any selection, the screen asks: "Você é atendido pelo SUS ou por um plano de saúde/rede privada?" — two buttons, `SUS` and `Plano de saúde / rede privada`. Neither choice is persisted anywhere (no storage write, no network call) — it exists only in component state for this render, consistent with the anonymity golden rule in `docs/superpowers/specs/AGENTS.md`.
2. On selection, the screen shows a direction card for that vínculo, produced by a new pure use case (`GetCrisisDirectionUseCase`, see §3). Both directions are placeholder-labeled pending the ACM's answer to the open clarifying question sent 19/07/2026 (`general-documentations/documentacao-produto/2026-07-19_stakeholder-update-email-esclarecimentos-acm.md` — "existe uma lista/diretório concreto de canais...?"). Placeholder content (to replace once that answer lands, tracked as a `// TODO(acm-response)` comment in the use case, not silently shipped as if final):
   - **SUS**: "Procure o CAPS (Centro de Atenção Psicossocial) mais próximo ou o serviço de saúde mental da sua unidade de saúde. Se for uma emergência, o CVV também pode ajudar agora."
   - **Plano de saúde / rede privada**: "Entre em contato com a central do seu plano de saúde ou com o serviço de saúde ocupacional do hospital para acionar o atendimento em saúde mental da sua rede. Se for uma emergência, o CVV também pode ajudar agora."
3. The always-on CVV 188 card (same copy/behavior as `08-crisis-offer.md`'s always-on card and `10-crisis-decline.md`'s hero card — reuse, do not re-derive the label/phone: call `RequestHumanHandoffUseCase.execute()` for it, same as those two screens already do) stays visible on this screen too, **before and after** the vínculo selection — it must never be gated behind the choice.
4. Primary CTA changes from "Iniciar conversa segura" (which implied a live human session starting) to "Entendi" — returns to `/home`. There is nothing to "start" anymore; the screen's job is informing, not connecting.
5. Back button behavior unchanged: `/crisis`.

### What does NOT change

- `08-crisis-offer.md` / `CrisisOfferPage.tsx` — the fork screen, unchanged.
- `10-crisis-decline.md` / `CrisisDeclinePage.tsx` — the refusal + CVV screen, unchanged.
- FR-9 (recusa), FR-15 (consentimento) — unaffected, these were never about the live-connection illusion.
- FR-6b / `RequestHumanHandoffUseCase` / the chat's "falar com uma pessoa real" shortcut — explicitly out of scope, per ADR-003 Parte 2. Do not touch this file as part of this change.
- The route `/crisis/connect` itself — kept as-is to avoid an unnecessary router/navigation-test churn six days before the final; only the screen's content and logic change.

## 3. New use case: `GetCrisisDirectionUseCase`

Same shape as `RequestHumanHandoffUseCase` — deliberately synchronous, I/O-free, no ports, no network, so it can never fail and needs no loading/error state on this already-anxious screen.

```ts
// apps/web/src/use-cases/get-crisis-direction.usecase.ts
export type ProfessionalBond = "sus" | "private";

export interface CrisisDirectionInfo {
  bond: ProfessionalBond;
  title: string;
  message: string;
}

const DIRECTIONS: Record<ProfessionalBond, Omit<CrisisDirectionInfo, "bond">> = {
  sus: {
    title: "Rede SUS",
    message:
      "Procure o CAPS (Centro de Atenção Psicossocial) mais próximo ou o serviço de saúde mental da sua unidade de saúde. Se for uma emergência, o CVV também pode ajudar agora.",
  },
  private: {
    title: "Plano de saúde / rede privada",
    message:
      "Entre em contato com a central do seu plano de saúde ou com o serviço de saúde ocupacional do hospital para acionar o atendimento em saúde mental da sua rede. Se for uma emergência, o CVV também pode ajudar agora.",
  },
};

// TODO(acm-response): replace DIRECTIONS' messages with the concrete channel list
// once the ACM answers the clarifying e-mail sent 19/07/2026 (see
// general-documentations/documentacao-produto/2026-07-19_stakeholder-update-email-esclarecimentos-acm.md).
// Until then these are honest, generic placeholders — not a claim of a confirmed directory.
export class GetCrisisDirectionUseCase {
  execute(bond: ProfessionalBond): CrisisDirectionInfo {
    return { bond, ...DIRECTIONS[bond] };
  }
}
```

## 4. Screen spec rewrite target (`docs/superpowers/specs/screens/09-crisis-accept.md`)

Replace the whole file's body (route/purpose lines stay the same file, new content) to describe: the vínculo question, the direction card, the always-on CVV card, and the "Entendi" → `/home` CTA — mirroring the structure the implementation plan's Task 2 produces. The plan is the source of truth for exact copy; the spec file is updated in the same task as the component, not left stale.

## 5. Acceptance criteria (carried into the plan's tests)

- Renders fully with network disabled — no fetch, no token generation, nothing to fail.
- Both vínculo choices are reachable and produce visibly different direction text.
- CVV 188 line is present before a vínculo is chosen and remains present after.
- Nothing is written to `localStorage`/`sessionStorage`/IndexedDB by this screen (same invariant the old placeholder already tested for the token — carried forward for the vínculo selection).
- No copy on this screen implies a live/real-time connection to a human (no "disponível agora", no "conversa segura", no session/token language).
