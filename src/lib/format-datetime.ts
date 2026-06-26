import { formatInTimeZone } from "date-fns-tz";

/**
 * Booking date/time formatting — ALWAYS rendered in the booking's own
 * operating timezone (the tour city, or Toronto for GTA), never the viewer's
 * device timezone.
 *
 * Why this exists: a booking's startsAt/endsAt are absolute UTC instants. The
 * calendar shows them in the tour-city timezone (e.g. Europe/Amsterdam), but
 * the various summaries used to call `toLocaleString()`, which formats in the
 * VIEWER's browser/OS timezone. So the same booking looked different depending
 * on where you opened it (e.g. a Brussels slot showing Toronto or Istanbul
 * time). Routing every summary through these helpers keeps the booking page,
 * the on-page summary, the admin panel and the emails all in agreement.
 *
 * The zone abbreviation (e.g. "CEST" / "EDT") is included on the time so the
 * value is unambiguous even when the viewer is elsewhere.
 */

const HOME_TIMEZONE = "America/Toronto";

function resolveZone(zone?: string | null): string {
  return zone && zone.trim() ? zone : HOME_TIMEZONE;
}

/** e.g. "Sunday, August 2, 2026" in the booking's timezone. */
export function formatBookingDate(
  input: Date | string,
  zone?: string | null,
): string {
  return formatInTimeZone(
    new Date(input),
    resolveZone(zone),
    "EEEE, MMMM d, yyyy",
  );
}

/** e.g. "9:00 PM CEST" in the booking's timezone. */
export function formatBookingTime(
  input: Date | string,
  zone?: string | null,
): string {
  return formatInTimeZone(new Date(input), resolveZone(zone), "h:mm a zzz");
}

/**
 * e.g. "9:00 PM – 10:00 PM CEST" in the booking's timezone. Start and end
 * share a single trailing zone label since they're always the same zone.
 */
export function formatBookingTimeRange(
  start: Date | string,
  end: Date | string,
  zone?: string | null,
): string {
  const z = resolveZone(zone);
  const startStr = formatInTimeZone(new Date(start), z, "h:mm a");
  const endStr = formatInTimeZone(new Date(end), z, "h:mm a zzz");
  return `${startStr} – ${endStr}`;
}
