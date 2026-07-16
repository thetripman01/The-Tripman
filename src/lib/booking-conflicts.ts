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
 * Display status for a single time slot in the public calendar.
 *   - available   : bookable now
 *   - booked      : directly overlaps a CONFIRMED booking
 *   - pending     : directly overlaps a held (recent) PENDING booking
 *   - unavailable : admin block / external busy time, or sits inside the
 *                   cooldown buffer around another booking
 */
export type SlotStatus = "available" | "booked" | "pending" | "unavailable";

export interface TimeInterval {
  start: Date;
  end: Date;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

/**
 * Classify a slot for display. Returns `null` for slots that should NOT be
 * shown at all (in the past, or inside the minimum-notice window) — there's
 * nothing useful about showing a time nobody could ever pick.
 *
 * IMPORTANT: the "available" result is byte-for-byte the same set the old
 * boolean filter produced — a slot is available iff it doesn't collide
 * (cooldown-extended) with any booking or busy time and isn't inside an admin
 * block. The new "booked"/"pending"/"unavailable" labels only RELABEL slots
 * that were already being hidden, so making them visible can't accidentally
 * let someone book a taken slot. (The booking POST re-validates regardless.)
 */
export function classifySlotStatus(params: {
  slotStart: Date;
  slotEnd: Date;
  now: Date;
  minNoticeMs: number;
  cooldownMs: number;
  confirmed: TimeInterval[];
  pending: TimeInterval[];
  blocks: TimeInterval[];
  busy: TimeInterval[];
}): SlotStatus | null {
  const {
    slotStart,
    slotEnd,
    now,
    minNoticeMs,
    cooldownMs,
    confirmed,
    pending,
    blocks,
    busy,
  } = params;

  // Hidden entirely: already in the past, or sooner than the booking
  // minimum-notice window allows.
  if (slotStart.getTime() < now.getTime()) return null;
  if (slotStart.getTime() < now.getTime() + minNoticeMs) return null;

  // Direct overlaps (no cooldown) get an informative label.
  if (confirmed.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))) {
    return "booked";
  }
  if (pending.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))) {
    return "pending";
  }
  // Admin blocks (vacation / tour travel days / private events) are deliberate
  // full closures — HIDE the slot entirely (return null) rather than showing a
  // greyed "unavailable" row, so a blocked day reads cleanly as "no times". We
  // still surface booked/on-hold times (below) for transparency.
  if (blocks.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))) {
    return null;
  }

  // Inside the cooldown buffer around a booking, or overlapping an external
  // (Google) busy time → not bookable, but not "booked" either.
  const cooldownHit = (list: TimeInterval[]) =>
    list.some((b) =>
      overlaps(
        slotStart,
        slotEnd,
        new Date(b.start.getTime() - cooldownMs),
        new Date(b.end.getTime() + cooldownMs),
      ),
    );
  if (cooldownHit(confirmed) || cooldownHit(pending) || cooldownHit(busy)) {
    return "unavailable";
  }

  return "available";
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
  // Accepts a transaction client too, so callers can run this + the create
  // inside one atomic transaction (see the advisory-lock guard in
  // /api/booking) to prevent double-booking races.
  db: PrismaClient | Prisma.TransactionClient,
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
