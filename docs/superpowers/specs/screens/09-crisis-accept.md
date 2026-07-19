# 09 — Crisis: accept (professional-bond direction)

**Route / File:** `/crisis/connect` · `src/presentation/pages/CrisisAcceptPage.tsx`

**Purpose:** When the user chooses a human, this screen does not simulate a live connection —
Zelo has no psychologist matching or secure channel yet. Instead it asks the user's professional
bond (SUS vs. private health plan / rede privada) and shows the correct next-step direction for
that bond, while keeping the CVV 188 line visible no matter what. See
`general-documentations/documentacao-produto/adr-003-crisis-protocol-rescope-peer-chat-differentiator.md`
for why the live-connection illusion was dropped.

## Layout
`PhoneShell`, `pt-[30px]`, flex column min-height full:
1. **Back** — "← Voltar" → `/crisis`.
2. **Title** — `h1` "Vamos te direcionar", `mb-2`.
3. **Bond question** (shown until a bond is chosen) — `caption text-muted` "Você é atendido pelo
   SUS ou por um plano de saúde/rede privada?", followed by two outline buttons: "SUS" and "Plano
   de saúde / rede privada".
4. **Direction card** (shown after a bond is chosen, replaces the question) — `Card`:
   `body font-extrabold` title (e.g. "Rede SUS" or "Plano de saúde / rede privada"), `caption
   text-muted` message with the concrete next step for that bond.
5. **Always-on CVV card** — `Card tone="brand-tint"`: mono label "sempre disponível",
   `body-strong` "CVV · 188", `caption` "Ligação gratuita e sigilosa, 24h.". Rendered both before
   and after the bond is chosen.
6. Spacer (`flex-1`).
7. **Primary** — `Button primary` "Entendi" → `/home`. Only rendered once a direction is shown.

## Copy (PT-BR)
"Vamos te direcionar" · "Você é atendido pelo SUS ou por um plano de saúde/rede privada?" · "SUS"
· "Plano de saúde / rede privada" · "sempre disponível" · "CVV · 188" · "Ligação gratuita e
sigilosa, 24h." · "Entendi".

Direction messages come from `GetCrisisDirectionUseCase` (see Data / logic below) and are not
hardcoded in this file.

## Data / logic
- The bond question and direction card come from `GetCrisisDirectionUseCase.execute(bond)`
  (`ProfessionalBond = "sus" | "private"`), called synchronously once the user picks a bond. It
  never fails and needs no network.
- The CVV card content comes from `RequestHumanHandoffUseCase.execute()` (label + phone), the same
  singleton and pattern used by `CrisisOfferPage.tsx`/`CrisisDeclinePage.tsx`. Call it
  synchronously; it never fails and needs no network (FR-6b). Do not hardcode "188" in JSX — read
  it from the use-case so there's one source of truth.
- No token, no session, no "available now" language, no network call, nothing written to storage.
  There is no live psychologist connection to simulate.

## Interactions
- Choosing "SUS" or "Plano de saúde / rede privada" replaces the bond question with the matching
  direction card; the CVV card stays visible throughout.
- Primary ("Entendi") → `/home`. Back → `/crisis`.

## Acceptance criteria
- Renders fully with network disabled (airplane mode) — CVV number present before and after
  choosing a bond.
- Choosing SUS shows the SUS-specific direction (mentions CAPS); choosing the private option
  shows the private-network-specific direction (mentions the health plan's central).
- No text implies a live connection is happening now (no "token", no "disponível agora", no
  "Conectando com segurança").
- Nothing is written to storage; no `fetch` call is made.
