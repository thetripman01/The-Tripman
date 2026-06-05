import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * The single source of truth for which timezone "calendar days" are
 * computed in throughout the booking/availability flow.
 *
 * Tripman runs in Toronto and books slots from 7pm through 3am next day.
 * A slot starting at 11pm EDT is the same calendar day as one starting at
 * 8pm EDT — even though UTC has rolled into tomorrow. Treating these as
 * different days breaks tour-window logic ("Ottawa Jul 12–14" would also
 * fire on Jul 11 9pm because UTC is already Jul 12).
 *
 * Anything that compares "what day is this booking on" MUST use these
 * helpers — never `.toISOString().slice(0,10)` (that's UTC, wrong).
 */
export const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE || "America/Toronto";

/**
 * Convert any UTC timestamp to its YYYY-MM-DD calendar date in the
 * business timezone. Critical for tour-window comparisons.
 *
 * Example (during EDT, UTC-4):
 *   toBusinessCalendarDay("2026-06-12T01:00:00Z") // → "2026-06-11"
 *   toBusinessCalendarDay("2026-06-12T04:00:00Z") // → "2026-06-12"
 */
export function toBusinessCalendarDay(input: Date | string | number): string {
  return formatInTimeZone(new Date(input), BUSINESS_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Parse a YYYY-MM-DD calendar date (assumed to be the admin's intended
 * business-TZ day) into the UTC instant representing that day's start.
 *
 * Example (during EDT, UTC-4):
 *   businessDayStartUtc("2026-06-12") // → Date for "2026-06-12T04:00:00Z"
 *
 * Use this when storing availability windows so we preserve the intent
 * "midnight in Toronto" regardless of DST.
 */
export function businessDayStartUtc(yyyyMmDd: string): Date {
  return fromZonedTime(yyyyMmDd + "T00:00:00", BUSINESS_TIMEZONE);
}

/**
 * Mirror of businessDayStartUtc for the inclusive END of a day.
 *   businessDayEndUtc("2026-06-15") // → "2026-06-16T03:59:59.999Z" (EDT)
 */
export function businessDayEndUtc(yyyyMmDd: string): Date {
  return fromZonedTime(yyyyMmDd + "T23:59:59.999", BUSINESS_TIMEZONE);
}

/**
 * Tripman runs an OVERNIGHT shift: 7pm → 3am (next morning). A booking at
 * 1am Jun 16 EDT is part of "Jun 15's session", not Jun 16's. This matters
 * for tour-window comparisons — if Ottawa is bookable Jun 12–15 and
 * Montreal is bookable Jun 16–20, a slot at 1am Jun 16 should still show
 * Ottawa, not flip to Montreal at midnight.
 *
 * Rule: timestamps between 00:00 and `BUSINESS_DAY_CUTOFF_HOUR` (default 6)
 * in business TZ are attributed to the PREVIOUS calendar day. Anything at
 * or after the cutoff is "today's" session.
 *
 * Override with env var `BUSINESS_DAY_CUTOFF_HOUR` if the operating
 * window ever changes (e.g. nightlife extending to 5am EDT → set cutoff
 * to 7 to be safe).
 */
export const BUSINESS_DAY_CUTOFF_HOUR = (() => {
  const raw = process.env.BUSINESS_DAY_CUTOFF_HOUR;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 12 ? parsed : 6;
})();

/**
 * Converts a UTC timestamp to the business "session day" it belongs to.
 *
 * - `2026-06-15T22:00:00Z` (Jun 15 6pm EDT) → "2026-06-15"
 * - `2026-06-16T03:00:00Z` (Jun 15 11pm EDT) → "2026-06-15"
 * - `2026-06-16T05:30:00Z` (Jun 16 1:30am EDT) → "2026-06-15"
 *   ↑ overnight slot, still attributed to Jun 15's shift
 * - `2026-06-16T11:00:00Z` (Jun 16 7am EDT) → "2026-06-16" (past cutoff)
 * - `2026-06-16T23:00:00Z` (Jun 16 7pm EDT) → "2026-06-16"
 */
export function toBusinessSessionDay(input: Date | string | number): string {
  const ts = new Date(input);
  const calendarDay = toBusinessCalendarDay(ts);
  const localHour = parseInt(formatInTimeZone(ts, BUSINESS_TIMEZONE, "H"), 10);
  if (localHour < BUSINESS_DAY_CUTOFF_HOUR) {
    // Roll back one day. Build a Date for the calendar day at noon UTC
    // (a safe anchor not affected by DST flips) and subtract 24h.
    const anchor = new Date(calendarDay + "T12:00:00.000Z");
    anchor.setUTCDate(anchor.getUTCDate() - 1);
    return formatInTimeZone(anchor, BUSINESS_TIMEZONE, "yyyy-MM-dd");
  }
  return calendarDay;
}
