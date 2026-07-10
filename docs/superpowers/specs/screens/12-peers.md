# 12 — Peers (anonymous matching)

**Route / File:** `/peers` · `src/presentation/pages/PeersPage.tsx`

**Purpose:** Connect to a trained peer for support, with mutual anonymity — neither side sees the
other's identity. This is the "anonymous peer matching" pillar.

> **Backend status:** peer matching is **not yet built** (Week-2 scope, per the handoff
> use-case note). Build this screen as designed UI over placeholder peer data, clearly marked
> `// TODO(week2): peer-matching gateway`. Do NOT invent a use-case or port for it now.

## Layout
`PhoneShell`, `pt-[26px]`:
1. **Back** — "← Início" → `/home`.
2. **Title** — `h1` "Pares anônimos", **Sub** `caption text-muted` "Médicos treinados para
   ouvir. Nem você nem seu par veem a identidade um do outro."
3. **Peer list** (`gap-[12px]`): each `Card` row — square `IconBadge`-style initial
   (`bg-surface-brand text-brand font-serif`, letter), text stack `body-strong` name +
   `caption text-muted-2` status, right `→ text-brand`.
   - "Colega · Clínica médica" — "plantão noturno · ● disponível"
   - "Colega · Residência" — "responde em ~1h"
4. **Trust footer** — `bg-surface-brand rounded-2xl` mono callout "🔒 conexão sem troca de
   identidade".

## Copy (PT-BR)
"Pares anônimos" · "Médicos treinados para ouvir. Nem você nem seu par veem a identidade um do
outro." · "Colega · Clínica médica" / "plantão noturno · disponível" · "Colega · Residência" /
"responde em ~1h" · "conexão sem troca de identidade".

## Data / logic
- Placeholder peer array in the component. Tapping a peer can route to `/chat` (reuse the chat
  surface) as a stand-in until the real peer channel exists — label with a TODO.
- The mutual-anonymity guarantee is a product promise; keep copy truthful to it (no avatars,
  names, or CRMs — only role + availability).

## Interactions
- Peer row → `/chat` (placeholder). Back → `/home`.

## Acceptance criteria
- No identifying info shown for peers (role/status only).
- Anonymity guarantee visible.
- Placeholder clearly marked in code; no fabricated backend calls.
