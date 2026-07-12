import { timingSafeEqual } from "node:crypto";

// A length mismatch short-circuits before the constant-time comparison. This leaks the
// *length* of a mismatch via timing, but not its content — an accepted tradeoff for a
// single shared demo credential, not a high-security multi-tenant secret.
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
