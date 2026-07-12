# Technical debt log

Deliberate, scoped trade-offs taken to hit the hackathon timeline. Each entry
records the decision, why it's safe to defer, and what would make it worth
revisiting. Not a backlog of every shortcut — only debt with a real security,
correctness, or scalability edge.

---

## TD-001: Manager session token in `sessionStorage` + `Authorization: Bearer`, not an `HttpOnly` cookie

- **Date:** 2026-07-12
- **Area:** `apps/web/src/stores/manager-session.store.ts`,
  `apps/api/src/modules/manager/infrastructure/manager-auth.guard.ts`
- **Status:** Accepted, deferred

**Decision.** Manager auth stays as-is: an HMAC-signed opaque token
(`manager-token.service.ts`, 8h expiry, timing-safe verify) issued by
`POST /manager/login`, held client-side in `sessionStorage` (tab-scoped,
cleared on close), sent as `Authorization: Bearer <token>`.

**Risk being accepted.** If an XSS vector is ever introduced (e.g. a future
`dangerouslySetInnerHTML` on manager-facing pages), injected JS can read
`sessionStorage` and exfiltrate the token. React's default escaping closes
this today, but nothing enforces it stays that way.

**Why deferred instead of fixed.** The safer alternative (`HttpOnly; Secure;
SameSite` cookie, never touched by client JS) is not a drop-in swap here
because the frontend (Vercel) and API (Fly.io) are cross-origin
(`apps/api/src/main.ts`). Cross-site cookies require `SameSite=None`, which
removes the CSRF protection cookies are meant to provide — reintroducing a
risk on the other side unless a CSRF token is added too. It also turns the
router guard (`router.tsx:72`, currently a synchronous in-memory
`isValid()` check) into an async `GET /manager/me` round-trip on every
manager-route navigation. Full estimate: ~8 source files + ~9 test files
across `apps/web` and `apps/api` (controller, guard, CORS config, 3 HTTP
adapters, session store, login hook, router loader) — roughly 3-5 hours,
not a quick change.

**Compensating control taken instead.** No `dangerouslySetInnerHTML` (or
equivalent raw-HTML injection) on any manager route. This is the actual
attack vector that matters given the current design; keeping it closed is
cheap and removes most of the practical risk.

**Revisit when:** any of the following becomes true —
- A manager-facing screen needs to render user-supplied or third-party HTML.
- The manager surface handles data more sensitive than aggregate/anonymized
  signals (i.e. the blast radius of a stolen token grows).
- Post-hackathon hardening pass has time budget for the ~3-5h cookie
  migration described above.
