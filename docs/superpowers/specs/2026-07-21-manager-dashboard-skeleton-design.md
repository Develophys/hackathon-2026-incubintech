# Manager Dashboard skeleton loading — design spec

**Status:** design, ready to implement. Independent of [[2026-07-20-path-alias-cleanup-design]] (already shipped) and of the sibling spec for the assessment-submit sync indicator — grouped only because the user raised all three in one message.

## 1. Problem

`ManagerDashboardPage.tsx` fetches its data via `useManagerSignals()` (`apps/web/src/presentation/hooks/useManagerSignals.ts`), a TanStack Query `useQuery`. The page destructures only `{ data, error, isError }` — `isLoading` is never read. Every data-driven value on the page falls back to a zero-ish default while the query is in flight:

```ts
const overallConcerningRate = data?.overallConcerningRate ?? 0;
const checkInsLast4Weeks = data?.checkInsLast4Weeks ?? 0;
const followUpResponseRate = data?.followUpResponseRate ?? 0;
```

So on first paint (and on any full remount, e.g. after login), the manager briefly sees "0%" KPI cards, an empty trend chart, and no segments — before the real numbers pop in. Nothing currently signals "this is still loading" versus "this is genuinely zero."

There is no `Skeleton` component anywhere in `apps/web/src` today (confirmed absent). The closest existing loading-feedback precedent is `Button`'s built-in `loading` prop (`apps/web/src/presentation/ui/Button.tsx`), which already correctly drives the "Análise com IA" button's own independent `useManagerInsight()` mutation — that section is out of scope here, it already works.

## 2. Decision: per-section skeletons, shaped like their content

Add one new primitive, `apps/web/src/presentation/ui/Skeleton.tsx`:

```tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={["animate-pulse rounded-md bg-line", className].join(" ")} />;
}
```

`bg-line` (`#DFE4E1`, already defined in `apps/web/src/app/index.css`) is the existing neutral token closest to a skeleton gray; `animate-pulse` is Tailwind's built-in utility (no new dependency), and the app's global `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }` rule (`index.css:105-107`) already disables it for users who need that, with no extra work.

In `ManagerDashboardPage.tsx`, destructure `isLoading` from `useManagerSignals()` and, while `true`, swap each of the four data-driven sections for a skeleton shaped like its own content (not one page-wide overlay):

- **KPI row (2 cards) + follow-up KPI card (3 cards total, same shape):** a small local component, e.g. `KpiCardSkeleton`, rendering a `Card` with a centered `Skeleton` bar sized like the big number (`h-[30px] w-16`) above a full-width caption-sized `Skeleton` bar (`mt-2 h-3 w-32`).
- **Trend card:** a title-width `Skeleton` bar in place of "Tendência geral", and, in the existing `flex h-14 items-end gap-2` bar row, six same-height pulsing `Skeleton` blocks (not variable heights — real heights are data the skeleton must not fabricate).
- **Segments card:** a title-width `Skeleton` bar, then 3 fixed skeleton rows (the real row count is unknown before data arrives) — each row a label-width bar + value-width bar side by side, and a full-width track-height bar beneath (mirroring the real segment bar's `h-2 rounded-pill` track).

These skeleton sub-components live inside `ManagerDashboardPage.tsx` rather than becoming new files — the page is ~150 lines today and already inlines all of its JSX; this keeps the same pattern rather than introducing a split the file doesn't need yet.

**Rejected alternative:** a single full-page skeleton overlay while any part of `data` is missing. Rejected per the earlier per-section decision — sections should resolve independently in feel, even though today they all come from one query and therefore resolve at the same instant; the visual shape still matches each section instead of a generic block, so it reads as "this specific card is loading" rather than "the whole page is frozen."

## 3. What does NOT change

- `useManagerInsight()` / the "Análise com IA" section: already has correct, independent loading UX via `Button`'s `loading` prop. Not touched.
- The 401 → logout redirect effect (`useEffect` at `ManagerDashboardPage.tsx:27-32`): unaffected, still fires off `isError`/`error`.
- No change to `useManagerSignals.ts` itself — `isLoading` is already provided by `useQuery`, it just wasn't being read.

## 4. Testing

Add one test to `ManagerDashboardPage.test.tsx` following the file's existing per-test `vi.spyOn(container.getManagerSignalsUseCase, "execute")` mocking convention: mock `execute` with a manually-controlled `Promise` (via `mockImplementation(() => new Promise((resolve) => { ... }))`, resolving it after an assertion) so the test can assert skeleton elements (via `data-testid="kpi-skeleton"`, `data-testid="trend-skeleton"`, `data-testid="segments-skeleton"` on the relevant `Card` wrappers) are present before resolution, and gone (replaced by the real content, e.g. `screen.getByText("Plantão noturno")`) after — mirroring the existing `waitFor`-based assertions already used throughout that file.

## 5. Acceptance criteria

- On first load (query `isLoading === true`), the two top KPI cards, the follow-up KPI card, the trend card, and the segments card each show a skeleton shaped like their own eventual content — no "0%"/"0" flash of fallback values.
- Once `data` resolves, all four sections render their real content exactly as they do today (no behavior change to the loaded state).
- The "Análise com IA" section's existing button-spinner loading behavior is unchanged.
- New test in `ManagerDashboardPage.test.tsx` passes, asserting skeleton presence during load and absence after.
- Full `apps/web` test suite and `tsc --noEmit` still pass.
