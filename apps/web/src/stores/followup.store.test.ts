import { describe, expect, it, beforeEach } from "vitest";
import { useFollowUpStore } from "./followup.store";

describe("useFollowUpStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useFollowUpStore.setState({ answer: null, answeredAt: null });
  });

  it("starts with no answer", () => {
    expect(useFollowUpStore.getState().answer).toBeNull();
  });

  it("recordAnswer persists the answer to localStorage", () => {
    useFollowUpStore.getState().recordAnswer("yes");

    expect(useFollowUpStore.getState().answer).toBe("yes");
    expect(useFollowUpStore.getState().answeredAt).not.toBeNull();

    const persisted = JSON.parse(localStorage.getItem("zelo.followup")!);
    expect(persisted.state.answer).toBe("yes");
  });

  it("recordAnswer('no') is stored distinctly from 'yes'", () => {
    useFollowUpStore.getState().recordAnswer("no");
    expect(useFollowUpStore.getState().answer).toBe("no");
  });
});
