# 06 — Assessment question (one-question-per-screen)

**Route / File:** `/assessment/phq9` · `src/presentation/pages/Phq9AssessmentPage.tsx`
(and `/assessment/gad7` · `Gad7AssessmentPage.tsx`, identical pattern with GAD-7 data)

**Purpose:** Replace the current all-questions-on-one-page `AssessmentForm` with a calm,
paced, **one item at a time** flow — far better UX for someone in distress, and it makes the
progress legible. Introduces `QuestionCard` component.

## Why rebuild `AssessmentForm`
The existing `AssessmentForm.tsx` renders all 9 fieldsets at once with default radios. Sereno
paces the user: single question, big tappable options, visible progress, gentle back. Keep the
same **contract** (answers: `number[]`, submitted via the existing hook) so downstream logic is
untouched.

## Layout
`PhoneShell`, `pt-6`, flex column min-height full:
1. **Progress row** — `flex items-center gap-3`: back arrow button (`ChevronLeft`) +
   `ProgressBar value={(qi/total)*100}` (flex-1) + `mono-data` "`{qi+1}/{total}`".
2. **Context line** — `caption text-muted-2` "Nas últimas 2 semanas, com que frequência você foi
   incomodado(a) por:", `mt-[26px]`.
3. **Question** — `h2` Newsreader, the current item text, `mt-[10px] mb-[26px]`.
4. **Options** — `QuestionCard` renders the 4 frequency options as full-width buttons
   (`gap-[11px]`), `rounded-input border border-line bg-surface p-[16px_18px] text-label
   font-semibold text-ink-2`. Selected/tapped → advance.

## `components/QuestionCard.tsx`
```ts
interface QuestionCardProps {
  question: string;
  options: readonly { value: number; label: string }[];
  selected?: number;
  onSelect: (value: number) => void;
}
```

## Copy (PT-BR)
- Context: "Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:"
- Questions: from `PHQ9_QUESTIONS` (do not retype — import from
  `domain/assessment-scales/phq9`). GAD-7 from `GAD7_QUESTIONS`.
- Options: from `FREQUENCY_RESPONSE_OPTIONS` — "Nenhuma vez" / "Vários dias" / "Mais da metade
  dos dias" / "Quase todos os dias".

## Data / logic
- State: `answers: (number|undefined)[]` of length `PHQ9_QUESTIONS.length`, plus `qi` index.
- Selecting an option sets `answers[qi]` and, if `qi < last`, `qi++`; else runs submit.
- **Submit** uses the existing pipeline: call `useSubmitAssessment` (which wraps
  `SubmitAssessmentUseCase` → score on-device, encrypt, store, POST *without* riskSignal).
  Obtain `{ totalScore, riskSignal }` from `ScoreAssessmentUseCase` (via the hook's result) and
  `navigate(routes.result, { state: { scaleType, totalScore, max, riskSignal } })`.
- **Never** post `riskSignal`. `PHQ9_RISK_ITEM_INDEX` drives it inside the use-case; don't
  recompute it in the page.

## Interactions
- Tap option → next question (auto-advance) or → Result on the last.
- Back arrow → previous question; at q1 → `/assessment`.

## Acceptance criteria
- Exactly one question visible at a time; progress bar + counter accurate.
- Answers array length equals scale length; submit rejected if incomplete (can't happen with
  auto-advance, but guard anyway).
- Result navigation carries correct `totalScore`, `max` (27 PHQ / 21 GAD), and `riskSignal`.
- Network payload on submit contains **no** `riskSignal` field.
- Questions/options come from the domain constants, not hardcoded copies.
