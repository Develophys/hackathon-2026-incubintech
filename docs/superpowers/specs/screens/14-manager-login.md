# 14 — Manager login (access gate for the manager dashboard)

> Added after the original 13-screen build, alongside real data for `screens/13-manager.md` —
> see `2026-07-11-manager-login-simulated-dashboard-design.md` and `routing-and-state.md` §5
> for the full authentication model and why this screen exists at all (doctors never see an
> equivalent login screen, on purpose).

**Route / File:** `/manager/login` · `src/presentation/pages/ManagerLoginPage.tsx`

**Purpose:** Gate `ManagerDashboardPage` behind a real, server-enforced shared access code —
one institution, one code, not a per-manager account (see the design spec §2 for why a full
account system wasn't built for this scope). This is the only screen in the app that asks for
a credential; every other screen is either consent-gated (doctors) or fully open.

## Layout
`PhoneShell`, `pt-[30px]`:
1. **Back** — "‹ Início" → `/home`.
2. **Title** — `h1` "Acesso do gestor".
3. **Subtitle** — `caption text-muted` "Digite o código fornecido pela sua instituição."
4. **Form** — a `Card` containing:
   - Label "Código de acesso" (`htmlFor="manager-code"`).
   - A single text input (`id="manager-code"`), placeholder "Digite o código".
   - An inline error, only when present: `role="alert"`, `text-danger` — either "Código
     incorreto." (wrong code) or "Não foi possível entrar agora. Tente novamente." (any other
     failure — network error, backend down, etc.).
5. **Submit** — `Button` "Entrar", `loading` while the request is in flight, `disabled` while
   the input is empty.

## Copy (PT-BR)
"Acesso do gestor" · "Digite o código fornecido pela sua instituição." · "Código de acesso" ·
"Digite o código" · "Entrar" · "Código incorreto." · "Não foi possível entrar agora. Tente
novamente."

## Data / logic
- `useManagerLogin()` (`apps/web/src/presentation/hooks/useManagerLogin.ts`) — a `useMutation`
  wrapping `apps/web/src/use-cases/login-manager.usecase.ts`, which calls
  `POST /manager/login` with `{ code }`.
- The backend compares the code against `MANAGER_ACCESS_CODE` using
  `crypto.timingSafeEqual` and, on a match, returns an HMAC-signed opaque token + expiry (8h).
  A mismatch returns `401`; the frontend maps that specifically to `InvalidManagerCodeError`
  so the UI can show "Código incorreto." instead of a generic failure message — any *other*
  error (network failure, `500`, etc.) falls back to the generic message.
- On success, the hook writes `{ token, expiresAt }` into `useManagerSessionStore`
  (`apps/web/src/stores/manager-session.store.ts`), persisted to **`sessionStorage`** (not
  `localStorage` — a manager session is meant to end when the tab closes), then the page
  navigates to `/manager`.
- This screen itself does **not** check whether a session already exists — the `/manager`
  route's loader is what redirects *to* this screen when needed (see
  `routing-and-state.md` §5). Visiting `/manager/login` directly while already logged in just
  re-shows the form; submitting again simply issues a new token.

## Interactions
- Back → `/home`.
- Submit with an empty field: button stays disabled, no request is sent.
- Submit with the correct code → `/manager`.
- Submit with an incorrect code → inline "Código incorreto.", stays on this screen, field
  keeps its value so the user doesn't need to retype the whole thing (just the digits they
  might have mistyped).

## Acceptance criteria
- The submit button is disabled until the field has non-whitespace content.
- A wrong code shows the specific "Código incorreto." message, not the generic one, and does
  not navigate.
- A correct code navigates to `/manager` and the session persists across a page reload
  (verified via `sessionStorage`, not just in-memory state — a full browser reload, not just a
  React re-render, must keep the session).
- A fresh browser tab/context (no `sessionStorage` carried over) visiting `/manager` directly
  redirects back to this screen.
- No credential value is ever written to `localStorage`, only `sessionStorage`.
