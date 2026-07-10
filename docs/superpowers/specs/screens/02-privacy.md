# 02 — Privacy transparency

**Route / File:** `/privacy` · `src/presentation/pages/PrivacyPage.tsx`

**Purpose:** Earn trust *before* asking anything. The core adoption barrier is fear of exposure
(fear it hurts the CRM record). This screen answers "how are you protecting me?" in three claims.

## Layout
`PhoneShell`, `pt-[30px]`:
1. **Eyebrow** — `SectionLabel` "Privacidade primeiro".
2. **Title** — `h1` "Como o Zelo protege você", `mt-[10px] mb-[22px]`.
3. **Three claim cards** — vertical stack, `gap-[14px]`. Each: `Card size="md"` with a
   horizontal layout: numbered `IconBadge`-style square (38×38, `rounded-icon bg-surface-brand`,
   `font-serif text-[17px] text-brand`, digit 1/2/3) + text block (`body-strong` title + `caption`
   `text-muted`).
4. **Primary CTA** — "Entendi, continuar", `mt-[24px]`.

## Copy (PT-BR)
| # | Title | Body |
|---|---|---|
| 1 | Processado no seu aparelho | O cálculo do seu resultado nunca sai do celular. |
| 2 | Anônimo por padrão | Ninguém do hospital vê quem você é — nem o seu CRM. |
| 3 | Você no controle | Nada é compartilhado sem o seu aceite explícito. |

CTA: **"Entendi, continuar"**

## Data / logic
- None. Static content. This screen is the human-readable face of the real guarantees
  (on-device scoring, anonymized submission, explicit consent) — keep claims truthful to the
  architecture; do not add a claim the code doesn't back.

## Interactions
- CTA → `routes.consent`.
- Optional back → `routes.splash`.

## Acceptance criteria
- Three cards render with consistent numbered badges.
- Copy matches exactly (these are trust-critical strings).
- Reads in one scroll on a 360×640 viewport (no CTA below a second scroll).
