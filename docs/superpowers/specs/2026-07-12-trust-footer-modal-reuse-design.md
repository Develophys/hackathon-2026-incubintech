# On-device trust footer — tap-to-explain reuse — design spec

**Status:** approved, ready for planning.

## 1. Problem

The Consent screen's encryption note is already tappable and opens `EncryptionInfoModal`
(`docs/superpowers/specs/2026-07-12-encryption-info-modal-design.md`), explaining AES-256 and
on-device protection in plain language. The same underlying trust claim — "your data never
leaves your device unprotected" — also appears as static, non-interactive text on two other
screens:

- `AssessmentSelectPage.tsx` (`docs/superpowers/specs/screens/05-assessment-select.md`) — "🔒
  tudo processado no seu aparelho" footer, centered below the scale list.
- `AssessmentResultPage.tsx` (`docs/superpowers/specs/screens/07-result.md`) — "🔒 processado no
  seu aparelho" stamp, top-left of the header row.

Both are inert `<div>`s today. A doctor reading either has no way to learn what "processado no
seu aparelho" actually means without leaving the app — the exact gap `EncryptionInfoModal` was
built to close, just not wired up here yet.

This is the "second real case" anticipated (and explicitly deferred) in §9 of the encryption
info modal spec: reuse the existing modal rather than writing new copy or a new component.

## 2. Scope

Wire the existing `EncryptionInfoModal` as the tap target on these two screens' trust
footers, mirroring the pattern already shipped on `ConsentPage.tsx` (commit `2822d46`). No new
modal, no new copy, no change to `EncryptionInfoModal.tsx` itself, no change to the external
link (still the Wikipedia placeholder pending a real link from the user).

Out of scope: `PrivacyBadge`, `SectionLabel`, and any other screen not listed above.

## 3. Component & trigger — per screen

### `AssessmentSelectPage.tsx`
Current markup (lines 57–60): a centered `<div className="mt-6 flex items-center justify-center
gap-1">` wrapping a `Lock` icon and the mono caption span.

Change: wrap in a `<button type="button">` instead of `<div>`, same classes plus
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand` (matching the focus
treatment already used on this page's scale-selection buttons), `onClick={() =>
setIsEncryptionInfoOpen(true)}`, `aria-label="Saiba mais sobre a criptografia AES-256"`.

### `AssessmentResultPage.tsx`
Current markup (lines 52–55): a `<div className="flex items-center gap-1">` wrapping the same
icon+caption pattern, left-aligned in the header row next to `PrivacyBadge`.

Same transformation: `<div>` → `<button type="button">`, same `onClick`/`aria-label`, add a
focus ring class consistent with this page's other interactive elements.

### Both pages
- No chevron affordance is added (unlike Consent's full-width bar) — these are small centered/
  inline labels, not full-width rows; the existing focus ring on tap/keyboard-focus is enough of
  an affordance change, and adding a chevron would visually clutter a compact footer.
- State: local `useState<boolean>` per page (`isEncryptionInfoOpen`), same as `ConsentPage`.
  Page-local ephemeral UI state, no store.
- Render `<EncryptionInfoModal isOpen={isEncryptionInfoOpen}
  onClose={() => setIsEncryptionInfoOpen(false)} />` once at the bottom of each page's JSX, inside
  `PhoneShell`.

## 4. Accessibility

- Reuses `EncryptionInfoModal`'s existing a11y wiring untouched (focus-to-close-button, Escape,
  backdrop click, `role="dialog"`/`aria-modal`/`aria-labelledby`) — no new a11y work here.
- Both trigger buttons get the same accessible name as Consent's
  (`"Saiba mais sobre a criptografia AES-256"`) rather than screen-specific wording, so a screen
  reader user hears one consistent affordance for this trust claim everywhere it appears in the
  app.

## 5. Testing

- `AssessmentSelectPage.test.tsx` (modify): add the same two cases as `ConsentPage.test.tsx` —
  tapping the footer button opens the modal (dialog with name "Criptografia AES-256" becomes
  visible); the existing assertion that "tudo processado no seu aparelho" text is present
  continues to pass since it still renders inside the trigger button.
- `AssessmentResultPage.test.tsx` (modify): same two cases, adapted to this page's existing
  render setup (it requires `location.state` to render at all — reuse the existing test's
  state-seeding helper).
- No changes needed to `EncryptionInfoModal.test.tsx` — the component itself is untouched.
- `a11y.test.tsx`: no change needed, same reasoning as the Consent spec (§7) — modal starts
  closed, so the per-screen axe pass is unaffected.

## 6. Documentation updates

`docs/superpowers/specs/screens/05-assessment-select.md` and
`docs/superpowers/specs/screens/07-result.md` each get a short addition under "Data / logic" and
"Interactions" noting the trust footer is now tappable and opens `EncryptionInfoModal` — matching
the addition already made to `03-consent.md` for the same feature.

## 7. What this spec does NOT do

- Does not write new modal copy or introduce a second modal — the whole point is reuse (§1).
- Does not change `EncryptionInfoModal.tsx`, its content, or its external link.
- Does not add a chevron or otherwise change these footers' visual weight beyond adding
  interactivity (§3).
- Does not touch `PrivacyBadge`, `SectionLabel`, or any screen other than AssessmentSelect and
  AssessmentResult.
