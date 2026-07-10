import { describe, expect, it, beforeEach } from "vitest";
import { useConsentStore } from "./consent.store";

describe("useConsentStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("starts with no consent", () => {
    expect(useConsentStore.getState().hasConsented).toBe(false);
    expect(useConsentStore.getState().consentedAt).toBeNull();
  });

  it("grant() sets hasConsented and a timestamp, persisted to localStorage", () => {
    useConsentStore.getState().grant();
    const state = useConsentStore.getState();
    expect(state.hasConsented).toBe(true);
    expect(state.consentedAt).not.toBeNull();

    const persisted = JSON.parse(localStorage.getItem("zelo.consent")!);
    expect(persisted.state.hasConsented).toBe(true);
  });

  it("revoke() clears consent", () => {
    useConsentStore.getState().grant();
    useConsentStore.getState().revoke();
    expect(useConsentStore.getState().hasConsented).toBe(false);
    expect(useConsentStore.getState().consentedAt).toBeNull();
  });
});
