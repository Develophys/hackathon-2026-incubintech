# 08 — Crisis: offer

**Route / File:** `/crisis` · `src/presentation/pages/CrisisOfferPage.tsx`

**Purpose:** The fork. Offer a real human, honoring autonomy ("a escolha é sua"), and keep the
CVV 188 line visible no matter what. Reachable from Result (risk) and from Chat (always).

## Layout
`PhoneShell`, `pt-[30px]`, flex column min-height full:
1. **Icon** — `IconBadge` 60×60 `HeartHandshake`, `bg-surface-brand`.
2. **Title** — `h1` "Você não está sozinho(a).", `mt-5`.
3. **Body** — `text-body text-muted` "A escolha é sempre sua. Você prefere falar com uma pessoa
   de verdade agora?"
4. **Primary** — `Button primary` "Sim, quero falar com um psicólogo" → `/crisis/connect`.
5. **Outline** — `Button outline` "Agora não" → `/crisis/line`.
6. Spacer (`flex-1`).
7. **Always-on CVV card** — `Card tone="brand-tint"`: mono eyebrow "sempre disponível",
   `body-strong` "CVV · 188", `caption` "Ligação gratuita e sigilosa, 24h."

## Copy (PT-BR)
"Você não está sozinho(a)." · "A escolha é sempre sua. Você prefere falar com uma pessoa de
verdade agora?" · "Sim, quero falar com um psicólogo" · "Agora não" · "sempre disponível" ·
"CVV · 188" · "Ligação gratuita e sigilosa, 24h."

## Data / logic
- The CVV card content comes from `RequestHumanHandoffUseCase.execute()` (label + phone). Call
  it synchronously; it never fails and needs no network (FR-6b). Do not hardcode "188" in JSX —
  read it from the use-case so there's one source of truth.

## Interactions
- Primary → `/crisis/connect`. Outline → `/crisis/line`.
- CVV card `tel:188` link optional (real phone action).

## Acceptance criteria
- Renders fully with network disabled (airplane mode) — CVV number present.
- Both branches reachable; no dead-end.
- Tone is supportive, not clinical-cold; autonomy language present.
