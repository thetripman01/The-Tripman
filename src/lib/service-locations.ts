import type { ServiceLocation } from "@prisma/client";

/**
 * Determines whether a given ServiceLocation is bookable for a specific
 * booking date.
 *
 * A location is bookable when:
 *   1. isActive is true, AND
 *   2. availableFrom is null OR availableFrom <= date, AND
 *   3. availableUntil is null OR date <= availableUntil
 *
 * The bounds are inclusive — admin sets "Ottawa 12-14 July" meaning the
 * entire 14th is still bookable. We compare on calendar dates only,
 * normalizing both sides to UTC midnight to avoid timezone edge cases.
 */
export function isLocationAvailableOn(
  location: Pick<
    ServiceLocation,
    "isActive" | "availableFrom" | "availableUntil"
  >,
  date: Date,
): boolean {
  if (!location.isActive) return false;

  const day = startOfUtcDay(date);

  if (location.availableFrom) {
    const from = startOfUtcDay(location.availableFrom);
    if (day.getTime() < from.getTime()) return false;
  }

  if (location.availableUntil) {
    const until = endOfUtcDay(location.availableUntil);
    if (day.getTime() > until.getTime()) return false;
  }

  return true;
}

/**
 * Validates a free-text country/city pair against the database list.
 * Used at booking-time to reject any payload that bypasses the dropdown
 * (e.g. someone hitting the API directly with a made-up city).
 *
 * Returns the matching ServiceLocation if valid + available for the date,
 * or null if it should be rejected.
 *
 * Note: this only checks the standalone availability window. For full
 * "is this city actually bookable today, considering exclusive tours"
 * use `isLocationBookableOn` which also enforces exclusive-mode hiding.
 */
export function findMatchingActiveLocation(
  candidates: ServiceLocation[],
  country: string,
  city: string,
  bookingDate: Date,
): ServiceLocation | null {
  const normalizedCountry = country.trim().toLowerCase();
  const normalizedCity = city.trim().toLowerCase();

  const match = candidates.find(
    (loc) =>
      loc.country.trim().toLowerCase() === normalizedCountry &&
      loc.city.trim().toLowerCase() === normalizedCity,
  );

  if (!match) return null;
  if (!isLocationAvailableOn(match, bookingDate)) return null;
  return match;
}

/**
 * Filters a list of locations down to the set actually bookable on the
 * given date. Enforces two-stage logic:
 *
 *   1. Drop anything failing isLocationAvailableOn (isActive + date window).
 *   2. If any of the survivors are flagged `exclusive`, return ONLY the
 *      exclusive ones — every non-exclusive city is hidden for that date.
 *      This is the "tour takeover" mode: marking Montreal exclusive with
 *      window Jul 18–21 hides every GTA city during that window without
 *      the admin having to disable them one by one.
 *
 * Multiple exclusive locations can coexist (e.g. NY + NJ together on a
 * USA tour) — all of them remain bookable, just nothing else.
 */
export function filterBookableLocations<
  T extends Pick<
    ServiceLocation,
    "isActive" | "availableFrom" | "availableUntil" | "exclusive"
  >,
>(locations: T[], bookingDate: Date): T[] {
  const available = locations.filter((loc) =>
    isLocationAvailableOn(loc, bookingDate),
  );
  const exclusiveActive = available.filter((loc) => loc.exclusive);
  if (exclusiveActive.length > 0) return exclusiveActive;
  return available;
}

/**
 * Authoritative server-side check for booking POST validation: is THIS
 * specific (country, city) bookable on the given date, considering both
 * its own availability window AND any active exclusive tours?
 *
 * Pass in the full active-locations list (typically every isActive=true
 * row from DB) so the function can detect exclusive takeovers.
 */
export function isLocationBookableOn(
  target: Pick<ServiceLocation, "country" | "city">,
  allLocations: ServiceLocation[],
  bookingDate: Date,
): boolean {
  const bookable = filterBookableLocations(allLocations, bookingDate);
  const normalizedCountry = target.country.trim().toLowerCase();
  const normalizedCity = target.city.trim().toLowerCase();
  return bookable.some(
    (loc) =>
      loc.country.trim().toLowerCase() === normalizedCountry &&
      loc.city.trim().toLowerCase() === normalizedCity,
  );
}

/**
 * Formats a structured location for display in emails, ICS, admin, etc.
 * Falls back to legacy free-text pickup if the structured fields are absent
 * (older bookings predating the structured-location migration).
 */
export function formatPickupLocation(booking: {
  pickupCountry: string | null;
  pickupCity: string | null;
  pickupAddress: string | null;
  pickup: string | null;
}): string | null {
  const hasStructured =
    booking.pickupCountry && booking.pickupCity && booking.pickupAddress;
  if (hasStructured) {
    return `${booking.pickupAddress}, ${booking.pickupCity}, ${booking.pickupCountry}`;
  }
  return booking.pickup ?? null;
}

function startOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
