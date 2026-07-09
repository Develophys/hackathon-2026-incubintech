import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * @testing-library/react's automatic post-test cleanup only self-registers
 * when `afterEach` is a *global* (i.e. vitest's `test.globals: true`). This
 * project keeps globals off and imports `describe`/`it`/`expect` explicitly
 * from "vitest" in every test file, so that auto-detection never fires and
 * each test's rendered DOM leaks into the next one in the same file. Task 5's
 * ChatPage.test.tsx (two `it` blocks, each calling `render(<ChatPage />)`)
 * surfaced this: without an explicit cleanup, the second test's
 * `getByText(/não substitui atendimento profissional/i)` matched two
 * disclaimer elements (one per leaked render) and failed. Registering
 * cleanup explicitly here fixes it without turning on implicit globals.
 */
afterEach(() => {
  cleanup();
});
