# Routing & State

How screens connect, what new routes exist, and the minimal state added. Router is
`react-router` v6 data router (`createBrowserRouter` in `src/app/router.tsx`). State is Zustand
(see existing `src/stores/ui.store.ts`) + local component state. **No new global data store for
assessment answers** — the answer array lives in the assessment page component and is handed to
the existing use-cases on submit.

---

## 1. Route table (replace the `children` array in `router.tsx`)

| Path | Component | Notes |
|---|---|---|
| `/` | `SplashPage` | First-run entry; redirects to `/home` if consent already given |
| `/privacy` | `PrivacyPage` | Onboarding step 2 |
| `/consent` | `ConsentPage` | Writes consent, then → `/home` |
| `/home` | `HomePage` | Authenticated hub (replaces current index scaffold) |
| `/assessment` | `AssessmentSelectPage` | Scale picker |
| `/assessment/phq9` | `Phq9AssessmentPage` | One-question-per-screen flow |
| `/assessment/gad7` | `Gad7AssessmentPage` | Same pattern |
| `/assessment/result` | `AssessmentResultPage` | Reads result from router `state` (see §3) |
| `/crisis` | `CrisisOfferPage` | Reachable from result & chat |
| `/crisis/connect` | `CrisisAcceptPage` | Ephemeral-token connect flow |
| `/crisis/line` | `CrisisDeclinePage` | CVV 188 |
| `/chat` | `ChatPage` | Existing; restyled |
| `/peers` | `PeersPage` | Anonymous peer list |
| `/manager` | `ManagerDashboardPage` | Demo/aggregated (gate behind a role later) |

> Keep the current data-router shape (`id: "root"`, `Component: () => <Outlet/>`). Add a
> loader on `/` that checks the consent store and `redirect("/home")` if already consented.

### Nav graph (happy path)
```
Splash → Privacy → Consent → Home
Home → Assessment(select) → PHQ-9(q1..q9) → Result
Result → Chat            (default next step)
Result → Crisis          (only when riskSignal, or user taps)
Chat → Crisis            (persistent "falar com uma pessoa real")
Crisis → Crisis/connect  (accept)  → Chat (secure)
Crisis → Crisis/line     (decline) → Home
Home → Chat | Peers | Manager
```

---

## 2. Consent store — `src/stores/consent.store.ts` (new)

Mirror the style of `ui.store.ts`. Persist to `localStorage` so warm starts skip onboarding.

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsentState {
  hasConsented: boolean;
  consentedAt: string | null;
  grant: () => void;
  revoke: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasConsented: false,
      consentedAt: null,
      grant: () => set({ hasConsented: true, consentedAt: new Date().toISOString() }),
      revoke: () => set({ hasConsented: false, consentedAt: null }),
    }),
    { name: "zelo.consent" },
  ),
);
```
- **Do not** store anything identifying here. Consent is a boolean + timestamp only.
- `revoke()` is surfaced later in a "Você/Profile" screen (out of scope for these 13, but leave
  the store ready).

---

## 3. Passing the assessment result forward

The result screen must NOT recompute or refetch. Pass the computed result via router navigation
state when leaving the question flow:

```ts
// at end of PHQ-9 flow, after ScoreAssessmentUseCase via useSubmitAssessment:
navigate("/assessment/result", {
  state: {
    scaleType: "PHQ-9",
    totalScore,     // number
    max: 27,
    riskSignal,     // boolean — for UI branching ONLY, never sent to backend
  },
});
```
`AssessmentResultPage` reads `useLocation().state`. If `state` is null (deep link / refresh),
redirect to `/assessment`.

> `riskSignal` in router state is fine — it never crosses the network. The **submit** payload is
> produced by `SubmitAssessmentUseCase`, which already excludes it.

---

## 4. Navigation helper (optional but recommended)

Add a tiny typed helper so screens don't sprinkle string paths:

```ts
// src/presentation/lib/routes.ts
export const routes = {
  splash: "/", privacy: "/privacy", consent: "/consent", home: "/home",
  assessment: "/assessment", phq9: "/assessment/phq9", gad7: "/assessment/gad7",
  result: "/assessment/result", crisis: "/crisis", crisisConnect: "/crisis/connect",
  crisisLine: "/crisis/line", chat: "/chat", peers: "/peers", manager: "/manager",
} as const;
```

---

## Acceptance criteria
- Cold start (no `zelo.consent`) lands on Splash; completing consent routes to Home and sets the
  store; reload now lands on Home directly.
- `/assessment/result` with no navigation state redirects to `/assessment` (no crash).
- Back button behaves: within PHQ-9 it steps to the previous question; at q1 it returns to the
  selector.
- No route change ever posts `riskSignal` to the API (verify in network tab).
