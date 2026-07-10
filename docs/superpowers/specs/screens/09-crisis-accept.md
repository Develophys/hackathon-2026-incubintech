# 09 — Crisis: accept (connect to psychologist)

**Route / File:** `/crisis/connect` · `src/presentation/pages/CrisisAcceptPage.tsx`

**Purpose:** When the user chooses a human, connect them while making the privacy mechanics
visible and reassuring: an **ephemeral session token**, no identity stored, no CRM link.

## Layout
`PhoneShell`, `pt-[30px]`, flex column full height:
1. **Back** — "← Voltar" → `/crisis`.
2. **Title** — `h1` "Conectando com segurança", `mb-2`.
3. **Body** — `caption text-muted` "Um token temporário foi criado só para esta conversa. Sua
   identidade não é armazenada."
4. **Token box** — `bg-dark rounded-2xl p-[18px]`, mono text `text-dark-brand`:
   `token: zl-9f3a-t7k2-eph`, sub-line `text-[#6F8F84]` "expira ao fim da sessão · sem vínculo
   com CRM". (Token is illustrative; generate a random ephemeral id at runtime — see logic.)
5. **Provider card** — `Card`: round `UserRound` avatar (`bg-surface-brand`), name
   `body-strong` "Psicólogo(a) parceiro(a)", status `text-brand` "● disponível agora".
6. Spacer.
7. **Primary** — `Button primary` "Iniciar conversa segura" → `/chat`.

## Copy (PT-BR)
"Conectando com segurança" · "Um token temporário foi criado só para esta conversa. Sua
identidade não é armazenada." · "expira ao fim da sessão · sem vínculo com CRM" ·
"Psicólogo(a) parceiro(a)" · "● disponível agora" · "Iniciar conversa segura".

## Data / logic
- **Psychologist connection is Week-2 scope (not yet built).** For now this screen is a
  *designed placeholder*: generate a random ephemeral token client-side
  (`"zl-" + crypto.getRandomValues(...)` → short base32) for display; do NOT persist it, do NOT
  call a backend. Add `// TODO(week2): real provider matching + secure channel`.
- "Iniciar conversa segura" routes to `/chat` (the existing acolhimento surface) until the real
  provider channel exists.

## Interactions
- Primary → `/chat`. Back → `/crisis`.

## Acceptance criteria
- A fresh random token renders each visit; nothing is written to storage or network.
- Clear statements: identity not stored, no CRM link, token ephemeral.
- No claim of a live human connection that the backend can't yet honor (placeholder is labelled
  in code, not in UI copy — the UI reads as designed intent).
