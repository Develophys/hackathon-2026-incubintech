const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Client-side, display-only, never persisted or sent anywhere — see the TODO(week2)
 * note on CrisisAcceptPage. Not cryptographically meaningful; it only needs to look
 * like a session token, not function as one.
 */
export function generateEphemeralToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `zl-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}
