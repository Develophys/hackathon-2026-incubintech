# Zelo — Sereno UI Spec

Implementation spec for the **Sereno** visual direction (Direction 1A) across all 13 screens of
the Zelo PWA. Written to be handed to Claude Code (or any coding agent) and followed
top-to-bottom.

## Start here
**`AGENTS.md`** — the build plan. Read it first. It sequences the work into phases and links
everything below.

## Contents
```
AGENTS.md                  ← the build plan (start here)
design-tokens.md           ← color / type / spacing / radius / shadow / band palette
tailwind-and-css.md        ← paste-ready tailwind.config.ts + index.css + fonts
ui-primitives.md           ← shared components with TypeScript prop signatures
routing-and-state.md       ← route table, consent store, result hand-off
screens/
  00-overview.md           ← screen map + per-screen template + global conventions
  01-splash.md … 13-manager.md
```

## What this spec assumes about the repo
- `apps/web`: React + Vite + Tailwind + react-router v6 (data router) + Zustand.
- Clean architecture already in place: `domain / ports / use-cases / infrastructure /
  presentation / stores`. **This spec only touches the presentation layer** (+ tailwind config,
  index.css, router, and a new consent store).
- Existing capabilities are consumed as-is: `ScoreAssessmentUseCase` (on-device scoring +
  `riskSignal`), `SubmitAssessmentUseCase` (score→encrypt→store→POST, strips riskSignal),
  `RequestHumanHandoffUseCase` (sync, network-free CVV 188), `useChatConversation` (streaming),
  `useSubmitAssessment`.

## Non-negotiables (also in AGENTS.md §Golden rules)
1. `riskSignal` never crosses the network.
2. Scoring stays on-device.
3. MBI-HSS stays disabled ("em breve") — scoring throws by design.
4. Human-handoff / CVV 188 must work with no network.
5. AI chat is acolhimento, never diagnosis — disclaimer always present.
6. Anonymity is always visible; identity revealed only by explicit user action.
7. Tokens only — no raw hex in components.
8. PT-BR copy in the specs is normative.

## Not yet built (designed as labelled placeholders)
Peer-matching gateway, real psychologist connection channel, history endpoint, and the manager
aggregation API are **Week-2 scope**. The relevant screens (09, 12, 13, and Home's history
chart) are built as designed UI over placeholder data with explicit `// TODO(week2)` markers —
do not fabricate use-cases or ports for them.

## Visual reference
Direction **1A "Sereno"** in `Zelo Fluxo.dc.html` (option `#1a`) is the pixel reference.
