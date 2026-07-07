/**
 * Google Calendar "event template" links.
 *
 * Opening one of these URLs shows Google's pre-filled "create event" screen
 * in the user's own calendar — no OAuth, no API key, nothing server-side.
 * The admin panel uses this so Tripman can push any booking into his
 * personal Google Calendar with one click. (Distinct from lib/calendar.ts,
 * which writes to the business calendar via the API after payment.)
 */

export interface GoogleCalendarEventOptions {
  title: string;
  start: Date | string;
  end: Date | string;
  /**
   * IANA zone the event should display in (the booking's operating
   * timezone — tour city or Toronto). The timestamps are absolute either
   * way; this only controls the wall-clock Google shows on the form.
   */
  timezone?: string | null;
  details?: string;
  location?: string;
}

// Google expects UTC "basic" timestamps: 20260724T180000Z.
function utcBasic(input: Date | string): string {
  return new Date(input).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function googleCalendarEventUrl(
  opts: GoogleCalendarEventOptions,
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${utcBasic(opts.start)}/${utcBasic(opts.end)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  if (opts.timezone && opts.timezone.trim()) {
    params.set("ctz", opts.timezone.trim());
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
