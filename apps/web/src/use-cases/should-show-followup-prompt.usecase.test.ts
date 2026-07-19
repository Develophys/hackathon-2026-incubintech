import { describe, expect, it } from "vitest";
import { ShouldShowFollowUpPromptUseCase, FOLLOWUP_INTERVAL_DAYS } from "./should-show-followup-prompt.usecase";

describe("ShouldShowFollowUpPromptUseCase", () => {
  const useCase = new ShouldShowFollowUpPromptUseCase();
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("returns false when there is no assessment yet", () => {
    expect(useCase.execute({ mostRecentAssessmentAt: null, alreadyAnswered: false, now })).toBe(false);
  });

  it(`returns false when fewer than ${FOLLOWUP_INTERVAL_DAYS} days have passed`, () => {
    const recent = new Date(now);
    recent.setUTCDate(recent.getUTCDate() - (FOLLOWUP_INTERVAL_DAYS - 1));
    expect(useCase.execute({ mostRecentAssessmentAt: recent, alreadyAnswered: false, now })).toBe(false);
  });

  it(`returns true when at least ${FOLLOWUP_INTERVAL_DAYS} days have passed and no answer yet`, () => {
    const old = new Date(now);
    old.setUTCDate(old.getUTCDate() - FOLLOWUP_INTERVAL_DAYS);
    expect(useCase.execute({ mostRecentAssessmentAt: old, alreadyAnswered: false, now })).toBe(true);
  });

  it("returns false when already answered, regardless of elapsed time", () => {
    const old = new Date(now);
    old.setUTCDate(old.getUTCDate() - FOLLOWUP_INTERVAL_DAYS - 10);
    expect(useCase.execute({ mostRecentAssessmentAt: old, alreadyAnswered: true, now })).toBe(false);
  });
});
