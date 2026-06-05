import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Slot interval (minutes between possible booking start times).
 * Default: 30 → customers see 8:00, 8:30, 9:00, 9:30 etc.
 * Override via SLOT_INTERVAL_MINUTES env var.
 */
export function getSlotIntervalMinutes(): number {
  const raw = process.env.SLOT_INTERVAL_MINUTES;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

/**
 * Minutes of mandatory cool-down (driver rest / travel) AFTER each booking
 * before the next one can start. Default: 30.
 *
 * Accepts the legacy env name TRAVEL_BUFFER_MINUTES too, since prod already
 * has that variable. Prefer the newer COOLDOWN_MINUTES if both are set.
 */
export function getCooldownMinutes(): number {
  const raw = process.env.COOLDOWN_MINUTES ?? process.env.TRAVEL_BUFFER_MINUTES;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30;
}

/**
 * Returns how long a PENDING booking holds a slot before being treated as
 * "abandoned cart" (driven by PAYMENT_HOLD_MINUTES, default 15).
 */
export function getPendingHoldMinutes(): number {
  const raw = process.env.PAYMENT_HOLD_MINUTES;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

interface ConflictCheckOptions {
  excludeBookingId?: string; // For reschedules — don't conflict with self.
}

/**
 * Returns the first existing booking that conflicts with the proposed
 * [newStartsAt, newEndsAt] window, considering the cooldown buffer that
 * must separate any two bookings.
 *
 * Two bookings conflict if [Bs, Be + cooldown] overlaps [Ns, Ne + cooldown].
 * Equivalently: Bs < Ne + cooldown AND Be > Ns - cooldown.
 *
 * Only CONFIRMED bookings AND PENDING bookings within their hold window
 * count. Older PENDING (abandoned) holds don't block.
 */
export async function findConflictingBooking(
  db: PrismaClient,
  newStartsAt: Date,
  newEndsAt: Date,
  opts: ConflictCheckOptions = {},
) {
  const cooldownMs = getCooldownMinutes() * 60_000;
  const holdMinutes = getPendingHoldMinutes();
  const pendingCutoff = new Date(Date.now() - holdMinutes * 60_000);

  const where: Prisma.BookingWhereInput = {
    // Same overlap formula but each side extended by `cooldown` so the gap
    // between any two confirmed bookings is at least `cooldown` minutes.
    startsAt: { lt: new Date(newEndsAt.getTime() + cooldownMs) },
    endsAt: { gt: new Date(newStartsAt.getTime() - cooldownMs) },
    OR: [
      { status: "CONFIRMED" },
      { status: "PENDING", createdAt: { gte: pendingCutoff } },
    ],
  };

  if (opts.excludeBookingId) {
    where.id = { not: opts.excludeBookingId };
  }

  return db.booking.findFirst({ where });
}
