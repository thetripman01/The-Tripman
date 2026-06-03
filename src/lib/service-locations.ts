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
