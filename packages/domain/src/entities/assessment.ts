import { z } from "zod";

export const AssessmentScaleType = z.enum(["PHQ-9", "GAD-7", "MBI-HSS"]);
export type AssessmentScaleType = z.infer<typeof AssessmentScaleType>;

/**
 * This is the wire contract with the BACKEND ONLY — deliberately no field
 * for raw answers (the backend must never receive them, PRD FR-2, FR-13)
 * and, just as deliberately, no `riskSignal` field either: the server must
 * never learn a risk signal exists unless the user explicitly opts into
 * human connection (spec Section G, PRD FR-15/US-007). `riskSignal` is a
 * frontend-local-only concept — see `apps/web/src/domain/assessment-record.ts`
 * (Plan 06) for the on-device record shape that includes it. Zod's default
 * object parsing strips unknown keys, so even a buggy client that includes
 * `riskSignal` in the request body will have it silently dropped by
 * `AssessmentSchema.parse()` before anything is persisted.
 */
/**
 * `scaleType` accepts all three enum members, including "MBI-HSS", even though
 * the frontend's ScoreAssessmentUseCase (Plan 06) currently throws rather than
 * ever producing an MBI-HSS payload (licensing not procured — see that plan's
 * Global Constraints). This is intentional, not an oversight: the backend is a
 * deliberately dumb ciphertext store that doesn't gate on which scales the
 * client can legitimately generate today: no plaintext or risk signal is
 * exposed regardless of scaleType, so there's nothing here for the backend to
 * protect by rejecting it.
 */
export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  scaleType: AssessmentScaleType,
  capturedAt: z.string().datetime(),
  ciphertext: z.string().min(1),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
