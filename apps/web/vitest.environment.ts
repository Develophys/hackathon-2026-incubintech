import { builtinEnvironments } from "vitest/environments";
import type { Environment } from "vitest/environments";

const jsdom = builtinEnvironments.jsdom;

/**
 * Wraps Vitest's built-in "jsdom" environment to fix a real-world incompatibility
 * between jsdom and Node's native `fetch`.
 *
 * Vitest's jsdom environment (see `populateGlobal`/`LIVING_KEYS` in
 * `vitest/dist/chunks/index.*.js`) unconditionally overrides `AbortController`
 * and `AbortSignal` on `globalThis` with jsdom's own implementation, which is
 * defined inside jsdom's separate VM realm (jsdom is instantiated with
 * `runScripts: "dangerously"`, which requires its own `vm` context). Node's
 * native `fetch`/`Request` (which Vitest deliberately leaves untouched, since
 * "fetch"/"Request" are NOT in `LIVING_KEYS`) validate `signal instanceof
 * AbortSignal` against Node's own main-realm `AbortSignal` class. A
 * jsdom-realm `AbortSignal` instance fails that check even though it is a
 * spec-compliant AbortSignal, because it comes from a different realm.
 *
 * This surfaces whenever code calls `new AbortController()` and passes its
 * `.signal` into `fetch`/`Request` — notably react-router's data router,
 * which builds an internal `Request` (via `createClientSideRequest`) for
 * *every* navigation, including the initial hydration of a route with a
 * `loader`, even when the loader itself never touches the network. Without
 * this fix, any test that mounts a `RouterProvider` for a route tree
 * containing a `loader` throws:
 *   TypeError: RequestInit: Expected signal ("AbortSignal {}") to be an
 *   instance of AbortSignal.
 * (Reproduced with a minimal `createMemoryRouter([{ path: "/", loader: () =>
 * null, Component: ... }])` — confirms this is an environment gap, not an
 * app bug.)
 *
 * Fix: capture the real, main-realm `AbortController`/`AbortSignal` before
 * delegating to jsdom's `setup()`, then restore them afterwards. jsdom's DOM
 * emulation (elements, events, etc.) is unaffected — only these two globals
 * are kept as Node's native classes so they interoperate with Node's native
 * fetch/Request.
 */
const jsdomWithRealAbortController: Environment = {
  ...jsdom,
  name: "jsdom-fixed-abort-controller",
  async setup(global, options) {
    const RealAbortController = global.AbortController;
    const RealAbortSignal = global.AbortSignal;
    const result = await jsdom.setup(global, options);
    global.AbortController = RealAbortController;
    global.AbortSignal = RealAbortSignal;
    return result;
  },
};

export default jsdomWithRealAbortController;
