import { inferCurrency, type SupportedCurrency } from "./geo";

export const TRIPMAN_PACKAGES = [
  {
    slug: "tripman-experience",
    name: "The Tripman Experience",
    durationMin: 60,
    price: {
      baseCents: 9900, // 99 CAD — single flat rate, 1–4 people. Video feature not guaranteed.
      maxPeople: 4,
    },
  },
] as const;

export type TripmanPackageSlug = (typeof TRIPMAN_PACKAGES)[number]["slug"];

// Flat rate for USA pickups. Currency is automatically chosen based on the
// pickup country (see lib/geo.ts) — customers don't see a currency picker.
export const TRIPMAN_USD_FLAT_CENTS = 11000; // 110 USD

// Flat rate for European tour pickups. Charged in EUR for every European
// tour city (see EUR_COUNTRIES in lib/geo.ts). Tax (below) is applied on top.
export const TRIPMAN_EUR_FLAT_CENTS = 8000; // 80 EUR

// HST (Ontario) for CAD bookings is 13%. We apply the same 13% rate to USD
// and EUR bookings — labelled differently in display ("HST" / "Sales tax" /
// "VAT") since HST is Canada-specific. Stored on each booking so historical
// rates are preserved even if the rate changes in future.
export const TRIPMAN_TAX_RATE = 0.13;

// Re-exported for callers that still import the currency union from here.
export type { SupportedCurrency };

export interface TripmanQuote {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number;
  taxLabel: string; // "HST" (CAD), "Sales tax" (USD), "VAT" (EUR)
  currency: SupportedCurrency;
}

/** Tax label shown to the customer for a given currency. */
function taxLabelForCurrency(currency: SupportedCurrency): string {
  if (currency === "usd") return "Sales tax";
  if (currency === "eur") return "VAT";
  return "HST";
}

/** Subtotal (pre-tax) flat rate for a given currency, in cents. */
function flatSubtotalForCurrency(
  currency: SupportedCurrency,
  baseCadCents: number,
): number {
  if (currency === "usd") return TRIPMAN_USD_FLAT_CENTS;
  if (currency === "eur") return TRIPMAN_EUR_FLAT_CENTS;
  return baseCadCents;
}

/**
 * Compute tax cents from a subtotal using a rate. Rounds to nearest cent
 * (banker-friendly via Math.round, NOT floor — avoids systematically
 * under-collecting on the long tail).
 */
export function computeTaxCents(subtotalCents: number, rate: number): number {
  return Math.round(subtotalCents * rate);
}

/**
 * Returns the price breakdown Stripe should charge for a booking.
 * Server-side AUTHORITATIVE — mirrored on the client only for display.
 *
 * Pricing model:
 *   - Canada (or any non-USA country): subtotal = baseCadCents, currency = CAD
 *   - USA: subtotal = TRIPMAN_USD_FLAT_CENTS, currency = USD
 *   - Tax: +13% on subtotal (rounded to nearest cent)
 *
 * Returns null for invalid package / group size.
 */
export function getTripmanQuoteForBooking(
  slug: string,
  peopleCount: number | null | undefined,
  country: string | null | undefined,
): TripmanQuote | null {
  const baseCadCents = getTripmanPriceForPeople(slug, peopleCount);
  if (baseCadCents == null) return null;

  const currency = inferCurrency(country);
  const subtotalCents = flatSubtotalForCurrency(currency, baseCadCents);
  const taxCents = computeTaxCents(subtotalCents, TRIPMAN_TAX_RATE);
  const totalCents = subtotalCents + taxCents;
  const taxLabel = taxLabelForCurrency(currency);

  return {
    subtotalCents,
    taxCents,
    totalCents,
    taxRate: TRIPMAN_TAX_RATE,
    taxLabel,
    currency,
  };
}

export function formatCad(cents: number) {
  const dollars = cents / 100;
  // Whole dollars: "$99 CAD". Otherwise: "$99.50 CAD".
  const formatted = Number.isInteger(dollars)
    ? dollars.toFixed(0)
    : dollars.toFixed(2);
  return `$${formatted} CAD`;
}

export function formatUsd(cents: number) {
  const dollars = cents / 100;
  const formatted = Number.isInteger(dollars)
    ? dollars.toFixed(0)
    : dollars.toFixed(2);
  return `$${formatted} USD`;
}

export function formatEur(cents: number) {
  const euros = cents / 100;
  const formatted = Number.isInteger(euros)
    ? euros.toFixed(0)
    : euros.toFixed(2);
  return `€${formatted} EUR`;
}

/**
 * Format cents in the quote's currency, e.g. "$99 CAD" / "$110.50 USD" /
 * "€80 EUR".
 */
export function formatMoney(cents: number, currency: SupportedCurrency) {
  if (currency === "usd") return formatUsd(cents);
  if (currency === "eur") return formatEur(cents);
  return formatCad(cents);
}

/** Currency symbol for ad-hoc displays (EUR → €, CAD/USD → $). */
export function currencySymbol(currency: string | null | undefined): string {
  return (currency ?? "").toLowerCase() === "eur" ? "€" : "$";
}

/** Tax label for a stored currency string (used by emails/ICS/receipts). */
export function taxLabelForStoredCurrency(
  currency: string | null | undefined,
): string {
  const c = (currency ?? "cad").toLowerCase();
  if (c === "usd") return "Sales tax";
  if (c === "eur") return "VAT";
  return "HST";
}

/**
 * Format the TOTAL (subtotal + tax) using the quote's currency. Use this
 * when you want to show the customer what they'll actually pay.
 */
export function formatQuoteTotal(quote: TripmanQuote) {
  return formatMoney(quote.totalCents, quote.currency);
}

/**
 * Format the SUBTOTAL only (price before tax). For breakdown displays.
 */
export function formatQuoteSubtotal(quote: TripmanQuote) {
  return formatMoney(quote.subtotalCents, quote.currency);
}

/**
 * Format the tax line (e.g. "$12.87 HST (13%)" / "$14.30 Sales tax (13%)").
 */
export function formatQuoteTax(quote: TripmanQuote) {
  const pct = (quote.taxRate * 100).toFixed(0);
  return `${formatMoney(quote.taxCents, quote.currency)} ${quote.taxLabel} (${pct}%)`;
}

/**
 * @deprecated Use formatQuoteTotal/Subtotal/Tax for explicit semantics.
 * Kept temporarily so older callers (showing the pre-tax flat rate) still
 * work; new code MUST use the explicit variants because the meaning of
 * "the price" became ambiguous once tax was introduced.
 */
export function formatQuote(quote: TripmanQuote) {
  return formatQuoteTotal(quote);
}

export function getTripmanPackage(slug: string) {
  return TRIPMAN_PACKAGES.find((p) => p.slug === slug);
}

export function getTripmanFromPriceLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom";
  return formatCad(pkg.price.baseCents);
}

export function getTripmanTierBreakdownLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom pricing";
  return `${formatCad(pkg.price.baseCents)} (1–4 people)`;
}

export function getTripmanPriceForPeople(
  slug: string,
  peopleCount: number | null | undefined,
) {
  const pkg = getTripmanPackage(slug);
  if (!pkg || !pkg.price) return null;
  if (!peopleCount || Number.isNaN(peopleCount)) return null;

  // 1–4 people only
  if (peopleCount >= 1 && peopleCount <= pkg.price.maxPeople) {
    return pkg.price.baseCents;
  }
  return null;
}
