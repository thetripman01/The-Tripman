import crypto from "crypto";

/**
 * Constant-time string equality for comparing secrets (API keys, tokens).
 * A plain `===` short-circuits on the first differing byte, which leaks
 * how much of a guess was correct through response timing.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
