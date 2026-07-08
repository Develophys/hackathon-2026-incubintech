import { z } from "zod";

export const CrisisSessionStatus = z.enum(["pending", "connected", "closed"]);
export type CrisisSessionStatus = z.infer<typeof CrisisSessionStatus>;

export const CrisisSessionSchema = z.object({
  sessionToken: z.string().min(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  status: CrisisSessionStatus,
});

export type CrisisSession = z.infer<typeof CrisisSessionSchema>;
