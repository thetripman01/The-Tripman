// Thin wrapper around the Meta Pixel browser SDK (`window.fbq`).
//
// We DO NOT initialise the pixel here — the base snippet in layout.tsx
// already calls `fbq('init', PIXEL_ID)` and fires a PageView. This module
// just exposes a typed helper so callers don't have to fight `(window as
// any).fbq` everywhere, and so a missing pixel (e.g. blocked by an ad
// blocker, or pixel not yet loaded) silently no-ops instead of throwing.
//
// PII note: never pass user email, phone, or other identifying data into
// fbq(). Meta requires advanced matching to be opt-in and explicitly
// hashed — the basic events here only carry non-PII metadata like value
// and currency. If we ever add advanced matching, route it through a
// separate function and a Resend / consent banner check first.

export const META_PIXEL_ID = "2435141220326453";

type FbqMethod = "init" | "track" | "trackCustom" | "trackSingle";

type Fbq = {
  (method: FbqMethod, event: string, params?: Record<string, unknown>): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * Track a standard or custom Meta Pixel event. Safe to call from any
 * client component — if the pixel hasn't loaded (or is blocked), this
 * is a no-op and never throws.
 *
 * Standard events Meta supports: PageView, ViewContent, Lead,
 * InitiateCheckout, AddPaymentInfo, Purchase, CompleteRegistration,
 * Contact, etc. Custom events go via the `Custom` prefix in
 * Meta Events Manager.
 *
 * Example:
 *   trackPixel("InitiateCheckout", { value: 111.87, currency: "CAD" });
 */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  try {
    fbq("track", event, params);
  } catch (err) {
    // Never let analytics break the booking flow.
    console.warn("Meta Pixel track failed:", err);
  }
}
