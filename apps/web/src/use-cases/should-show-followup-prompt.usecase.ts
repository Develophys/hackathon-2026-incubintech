// Resolves US-009's open question (exact follow-up interval) for the hackathon PoC —
// see docs/superpowers/specs/2026-07-19-followup-mechanism-design.md §5 for why 3 days.
export const FOLLOWUP_INTERVAL_DAYS = 3;

export interface ShouldShowFollowUpPromptInput {
  mostRecentAssessmentAt: Date | null;
  alreadyAnswered: boolean;
  now: Date;
}

export class ShouldShowFollowUpPromptUseCase {
  execute({ mostRecentAssessmentAt, alreadyAnswered, now }: ShouldShowFollowUpPromptInput): boolean {
    if (alreadyAnswered || mostRecentAssessmentAt === null) return false;

    const elapsedMs = now.getTime() - mostRecentAssessmentAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    return elapsedDays >= FOLLOWUP_INTERVAL_DAYS;
  }
}
