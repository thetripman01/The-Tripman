import type { NextRequest } from "next/server";

/**
 * Minimal in-memory sliding-window rate limiter, scoped by IP address.
 *
 * Caveats (read before relying on this):
 *   - State is per-process. In a serverless deployment (Vercel) every cold
 *     start gets a fresh map, and concurrent instances each track their
 *     own counts. A determined attacker spreading load across instances
 *     can effectively multiply their allowance.
 *   - Still useful as defense-in-depth: blunts simple bots, and the
 *     bcrypt cost on /admin/session itself caps brute-force throughput at
 *     ~4 attempts/sec/instance.
 *
 * For production-grade rate limiting (sticky across instances) swap this
 * for an Upstash Redis client. Keep the public API of `rateLimit()` the
 * same so callers don't need to change.
 */

type Bucket = { hits: number[]; blockedUntil: number | null };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow unbounded over the lifetime of
// a process. Runs at most every 5 minutes per process.
let lastCleanup = 0;
function maybeCleanup(nowMs: number, windowMs: number) {
  if (nowMs - lastCleanup < 5 * 60_000) return;
  lastCleanup = nowMs;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => nowMs - t < windowMs);
    if (
      bucket.hits.length === 0 &&
      (bucket.blockedUntil == null || bucket.blockedUntil < nowMs)
    ) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitOptions {
  /** Bucket scope, e.g. "admin-login" — keeps separate routes independent. */
  key: string;
  /** Max hits allowed within `windowMs`. */
  limit: number;
  /** Sliding window in milliseconds. */
  windowMs: number;
  /** How long to block once `limit` is exceeded. */
  blockDurationMs?: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Extracts the client IP from common reverse-proxy headers.
 * Falls back to "unknown" so we still bucket somehow.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Records a hit for `ip`+`key` and returns whether the request is allowed.
 *
 * Call this BEFORE doing the expensive work (DB query, bcrypt, etc.).
 */
export function rateLimit(
  ip: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const blockDurationMs = options.blockDurationMs ?? options.windowMs;
  const bucketKey = `${options.key}:${ip}`;
  maybeCleanup(now, options.windowMs);

  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { hits: [], blockedUntil: null };
    buckets.set(bucketKey, bucket);
  }

  // If currently in penalty box, reject.
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  // Drop hits outside the window.
  bucket.hits = bucket.hits.filter((t) => now - t < options.windowMs);

  if (bucket.hits.length >= options.limit) {
    bucket.blockedUntil = now + blockDurationMs;
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
    };
  }

  bucket.hits.push(now);
  return { ok: true, remaining: options.limit - bucket.hits.length };
}

/**
 * Manually clear a key on success (e.g. reset failed-login counter when
 * the user finally logs in correctly). Optional, but a nice UX touch.
 */
export function clearRateLimit(ip: string, key: string) {
  buckets.delete(`${key}:${ip}`);
}
