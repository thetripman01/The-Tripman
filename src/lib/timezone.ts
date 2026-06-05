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
