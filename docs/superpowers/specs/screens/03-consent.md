# 03 — Consent

**Route / File:** `/consent` · `src/presentation/pages/ConsentPage.tsx`

**Purpose:** Explicit, revocable consent. Confirms the three things the user is agreeing to,
plus the encryption guarantee, then unlocks the app.

## Layout
`PhoneShell`, `pt-[30px]`:
1. **Back** — "← Voltar" → `/privacy`.
2. **Title** — `h1` "Seu consentimento", `mb-[6px]`.
3. **Sub** — `caption text-muted` "Confirme antes de entrar. Você pode revogar quando quiser."
4. **Three consent rows** — `gap-[12px]`. Each: `Card` (radius-input, `p-[15px]`, `shadow-card`)
   with a green check chip (22×22 `rounded-[7px] bg-brand text-white`, `Check` icon) + statement
   in `text-label text-ink-2` (bold the key phrase).
5. **Encryption note** — `bg-surface-brand rounded-2xl p-[13px]` mono callout with a `Lock` glyph.
6. **Primary CTA** — "Aceitar e entrar".

## Copy (PT-BR)
Rows (bold spans marked with **…**):
1. Entendo que o Zelo **não emite diagnóstico** e não substitui atendimento profissional.
2. Autorizo o uso **anônimo e agregado** dos meus sinais para melhorar o cuidado da equipe.
3. Minha identidade só é revelada se **eu escolher** falar com uma pessoa.

Encryption note: **"🔒 Criptografia AES-256 no seu aparelho antes de qualquer envio."**
(render the lock as a `Lock` icon, not emoji.)

CTA: **"Aceitar e entrar"**

## Data / logic
- The three rows are **acknowledgements**, presented as a single required consent (matching the
  prototype's one-tap accept). If product wants per-item checkboxes later, keep the store shape;
  for now tapping the CTA implies all three.
- On CTA: `useConsentStore().grant()` then `navigate(routes.home, { replace: true })`.

## Interactions
- CTA → grant consent → Home.
- Back → Privacy.

## Acceptance criteria
- Tapping "Aceitar e entrar" sets `zelo.consent` (`hasConsented: true`, timestamp set) and lands
  on Home.
- Reloading after consent skips onboarding.
- Copy exact; encryption claim is truthful (Web Crypto AES-256 already exists in
  `infrastructure/crypto`).
