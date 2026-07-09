import type { Assessment } from "@zelo/domain";

/**
 * On-device-only extension of the backend's `Assessment` wire contract.
 * `riskSignal` lives here — NOT in `@zelo/domain` — because the backend
 * must never receive it (spec Section G; see the note on `AssessmentSchema`
 * in packages/domain/src/entities/assessment.ts).
 */
export interface AssessmentRecord extends Assessment {
  riskSignal: boolean;
}
