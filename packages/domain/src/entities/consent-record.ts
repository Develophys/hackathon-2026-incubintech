import { z } from "zod";

export const ConsentScope = z.enum(["crisis-human-connection", "peer-matching"]);
export type ConsentScope = z.infer<typeof ConsentScope>;

/**
 * Consent is recorded against sessionToken only (PRD FR-15, US-007 AC-3) —
 * there is no field here for a permanent user identity.
 */
export const ConsentRecordSchema = z.object({
  sessionToken: z.string().min(1),
  grantedAt: z.string().datetime(),
  scope: ConsentScope,
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
