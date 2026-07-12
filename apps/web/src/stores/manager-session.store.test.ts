import { describe, expect, it, beforeEach } from "vitest";
import { useManagerSessionStore } from "./manager-session.store";

describe("useManagerSessionStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useManagerSessionStore.setState({ token: null, expiresAt: null });
  });

  it("starts with no session", () => {
    expect(useManagerSessionStore.getState().token).toBeNull();
    expect(useManagerSessionStore.getState().isValid()).toBe(false);
  });

  it("setSession stores a token, persisted to sessionStorage", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    useManagerSessionStore.getState().setSession("abc.def", future);

    expect(useManagerSessionStore.getState().token).toBe("abc.def");
    expect(useManagerSessionStore.getState().isValid()).toBe(true);

    const persisted = JSON.parse(sessionStorage.getItem("zelo.manager-session")!);
    expect(persisted.state.token).toBe("abc.def");
  });

  it("isValid() returns false once expiresAt is in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    useManagerSessionStore.getState().setSession("abc.def", past);

    expect(useManagerSessionStore.getState().isValid()).toBe(false);
  });

  it("clearSession() removes the token", () => {
    useManagerSessionStore.getState().setSession("abc.def", new Date(Date.now() + 60_000).toISOString());
    useManagerSessionStore.getState().clearSession();

    expect(useManagerSessionStore.getState().token).toBeNull();
    expect(useManagerSessionStore.getState().isValid()).toBe(false);
  });
});
