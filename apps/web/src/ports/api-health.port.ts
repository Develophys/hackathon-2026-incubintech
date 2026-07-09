import { z } from "zod";

export const ApiHealthResultSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  database: z.boolean(),
});
export type ApiHealthResult = z.infer<typeof ApiHealthResultSchema>;

export interface ApiHealthPort {
  check(): Promise<ApiHealthResult>;
}
