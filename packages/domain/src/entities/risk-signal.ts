import { z } from "zod";

export const RiskSignalReason = z.enum(["phq9-item-9-positive", "clinical-criteria-tbd"]);
export type RiskSignalReason = z.infer<typeof RiskSignalReason>;

export const RiskSignalSchema = z.object({
  assessmentId: z.string().uuid(),
  detectedAt: z.string().datetime(),
  reason: RiskSignalReason,
});

export type RiskSignal = z.infer<typeof RiskSignalSchema>;
