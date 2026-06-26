import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFreeBusyTimes, getWorkingHours } from "@/lib/calendar";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  classifySlotStatus,
  getCooldownMinutes,
  getPendingHoldMinutes,
  getSlotIntervalMinutes,
} from "@/lib/booking-conflicts";
import { getOperatingTimezoneForDate } from "@/lib/service-locations";
import { sessionAnchorUtc } from "@/lib/timezone";

type Interval = { start: Date; end: Date };

function parseHHMM(value: string) {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysYmd(ymdStr: string, days: number) {
  const d = new Date(ymdStr + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

function startOfDayUtc(dateYmd: string, timeZone: string) {
  return fromZonedTime(`${dateYmd}T00:00:00.000`, timeZone);
}

function endOfDayUtc(dateYmd: string, timeZone: string) {
  return fromZonedTime(`${dateYmd}T23:59:59.999`, timeZone);
}

function dowInTz(dateUtc: Date, timeZone: string) {
  // ISO day-of-week: 1 (Mon) .. 7 (Sun)
  const iso = parseInt(formatInTimeZone(dateUtc, timeZone, "i"), 10);
  return iso === 7 ? 0 : iso; // 0 (Sun) .. 6 (Sat)
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const out: Interval[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (!last || cur.start > last.end) {
      out.push({ start: new Date(cur.start), end: new Date(cur.end) });
    } else {
      last.end = new Date(Math.max(last.end.getTime(), cur.end.getTime()));
    }
  }
  return out;
}

function subtractIntervals(base: Interval[], blocks: Interval[]): Interval[] {
  let result = [...base];
  const sortedBlocks = [...blocks].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  for (const blk of sortedBlocks) {
    const next: Interval[] = [];
    for (const iv of result) {
      // no overlap
      if (blk.end <= iv.start || blk.start >= iv.end) {
        next.push(iv);
        continue;
      }
      // left remainder
      if (blk.start > iv.start) {
        next.push({ start: iv.start, end: new Date(blk.start) });
      }
      // right remainder
      if (blk.end < iv.end) {
        next.push({ start: new Date(blk.end), end: iv.end });
      }
    }
    result = next;
  }
  return result.filter((iv) => iv.end > iv.start);
}

function intervalsFromRulesForDate(
  dateYmd: string,
  timeZone: string,
  rules: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }>,
) {
  // Service window is "this date's schedule", and can span into next day for overnight rules.
  const d0 = startOfDayUtc(dateYmd, timeZone);
  const dow = dowInTz(d0, timeZone);
  const nextYmd = addDaysYmd(dateYmd, 1);

  const base: Interval[] = [];
  const subtract: Interval[] = [];

  const add = (isAvailable: boolean, iv: Interval) => {
    if (iv.end <= iv.start) return;
    (isAvailable ? base : subtract).push(iv);
  };

  for (const r of rules) {
    const start = parseHHMM(r.startTime);
    const end = parseHHMM(r.endTime);
    const overnight = end.h < start.h || (end.h === start.h && end.m < start.m);

    // Same-day portion
    if (r.daysOfWeek.includes(dow)) {
      const ivStart = fromZonedTime(`${dateYmd}T${r.startTime}:00`, timeZone);
      const ivEnd = overnight
        ? fromZonedTime(`${nextYmd}T${r.endTime}:00`, timeZone)
        : fromZonedTime(`${dateYmd}T${r.endTime}:00`, timeZone);
      add(r.isAvailable, { start: ivStart, end: ivEnd });
    }
  }

  return {
    base: mergeIntervals(base),
    subtract: mergeIntervals(subtract),
  };
}

function generateSlotsFromIntervals(
  intervals: Interval[],
  durationMinutes: number,
  stepMinutes: number,
) {
  const slots: Date[] = [];
  for (const iv of intervals) {
    let cur = new Date(iv.start);
    while (cur < iv.end) {
      const slotEnd = new Date(cur.getTime() + durationMinutes * 60000);
      if (slotEnd <= iv.end) slots.push(new Date(cur));
      cur = new Date(cur.getTime() + stepMinutes * 60000);
    }
  }
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const eventTypeSlug = searchParams.get("eventType");

    if (!date || !eventTypeSlug) {
      return NextResponse.json(
        { error: "Date and eventType are required" },
        { status: 400 },
      );
    }

    // Get event type details
    const eventType = await db.eventType.findUnique({
      where: { slug: eventTypeSlug },
    });

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 },
      );
    }

    // Parse date and create time range
    const dateYmd = date; // request is YYYY-MM-DD

    // Determine the OPERATING timezone for this calendar day. During an
    // exclusive tour window (e.g. the Europe tour) the day's slots are
    // generated and displayed in the tour city's timezone; on a normal day
    // we stay on the home base (America/Toronto). We anchor the lookup at
    // the session anchor (8pm business-TZ) — the same anchor the public
    // /api/service-locations endpoint uses — so tour-day detection lines up
    // exactly with which city the booking form will offer.
    const activeLocations = await db.serviceLocation.findMany({
      where: { isActive: true },
    });
    const operating = getOperatingTimezoneForDate(
      activeLocations,
      sessionAnchorUtc(dateYmd),
    );
    const timeZone = operating.timezone;
    const startOfDay = startOfDayUtc(dateYmd, timeZone);
    // window end: we may need into next day for overnight schedules
    const endOfWindow = endOfDayUtc(addDaysYmd(dateYmd, 1), timeZone);
    const prevStart = startOfDayUtc(addDaysYmd(dateYmd, -1), timeZone);

    // Get Google Calendar busy times
    let busyTimes: Array<{ start: Date; end: Date }> = [];
    try {
      const googleBusyTimes = await getFreeBusyTimes(startOfDay, endOfWindow);
      busyTimes = googleBusyTimes.map((period) => ({
        start: new Date(period.start || ""),
        end: new Date(period.end || ""),
      }));
    } catch {
      // Continue without Google Calendar data if not configured
    }

    // Get existing bookings for this date
    const pendingCutoff = new Date(
      Date.now() - getPendingHoldMinutes() * 60_000,
    );
    const existingBookings = await db.booking.findMany({
      where: {
        startsAt: {
          gte: startOfDay,
          lte: endOfWindow,
        },
        OR: [
          { status: "CONFIRMED" },
          { status: "PENDING", createdAt: { gte: pendingCutoff } },
        ],
      },
    });

    // Get availability blocks (vacation/unavailable times)
    const blocks = await db.availabilityBlock.findMany({
      where: {
        startsAt: { lt: endOfWindow },
        endsAt: { gt: startOfDay },
      },
      orderBy: { startsAt: "asc" },
    });

    // Generate all possible time slots.
    // Slot interval = spacing between possible start times (default 30min,
    // so customers see 8:00, 8:30, 9:00, ...). Cooldown = mandatory gap
    // between any two bookings (default 30min, accepts legacy
    // TRAVEL_BUFFER_MINUTES too).
    const slotIntervalMinutes = getSlotIntervalMinutes();
    const travelBufferMinutes = getCooldownMinutes();
    // Recurring availability rules (optional). If any "available" rules exist for the day,
    // we use them. Otherwise we fall back to default working hours.
    const rules = await db.availabilityRule.findMany({
      where: {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: endOfWindow } }] },
          { OR: [{ endDate: null }, { endDate: { gte: prevStart } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    let baseIntervals: Interval[] = [];
    let subtractIntervalsList: Interval[] = [];

    const applicable = intervalsFromRulesForDate(
      dateYmd,
      timeZone,
      rules.map((r) => ({
        daysOfWeek: r.daysOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        isAvailable: r.isAvailable,
        startDate: r.startDate,
        endDate: r.endDate,
      })),
    );
    baseIntervals = applicable.base;
    subtractIntervalsList = applicable.subtract;

    const hasAnyAvailableRule = baseIntervals.length > 0;
    if (!hasAnyAvailableRule) {
      const wh = getWorkingHours();
      if (!wh.daysOfWeek.includes(dowInTz(startOfDay, timeZone))) {
        return NextResponse.json([]);
      }
      const ivStart = fromZonedTime(
        `${dateYmd}T${String(wh.start).padStart(2, "0")}:00:00`,
        timeZone,
      );
      const ivEnd = fromZonedTime(
        `${dateYmd}T${String(wh.end).padStart(2, "0")}:00:00`,
        timeZone,
      );
      baseIntervals = [{ start: ivStart, end: ivEnd }];
    }

    // Apply "unavailable recurring rules"
    const usableIntervals = subtractIntervals(
      baseIntervals,
      subtractIntervalsList,
    );
    const allSlots = generateSlotsFromIntervals(
      usableIntervals,
      eventType.durationMin,
      slotIntervalMinutes,
    );

    // Classify every candidate slot so the calendar can SHOW booked / on-hold
    // times (greyed, non-selectable) for transparency, instead of silently
    // hiding them. The "available" set is identical to the old filter — only
    // the relabelled (formerly hidden) slots are newly surfaced.
    const now = new Date();
    const minNoticeMs =
      parseInt(process.env.BOOKING_MIN_NOTICE_HOURS || "24", 10) * 3_600_000;
    const cooldownMs = travelBufferMinutes * 60_000;

    const confirmedIntervals = existingBookings
      .filter((b) => b.status === "CONFIRMED")
      .map((b) => ({ start: new Date(b.startsAt), end: new Date(b.endsAt) }));
    const pendingIntervals = existingBookings
      .filter((b) => b.status === "PENDING")
      .map((b) => ({ start: new Date(b.startsAt), end: new Date(b.endsAt) }));
    const blockIntervals = blocks.map((b) => ({
      start: new Date(b.startsAt),
      end: new Date(b.endsAt),
    }));
    const busyIntervals = busyTimes.map((b) => ({
      start: new Date(b.start),
      end: new Date(b.end),
    }));

    // Format slots for response (skipping past / min-notice slots → null).
    const formattedSlots = allSlots.flatMap((slot) => {
      const slotEnd = new Date(slot.getTime() + eventType.durationMin * 60000);
      const status = classifySlotStatus({
        slotStart: slot,
        slotEnd,
        now,
        minNoticeMs,
        cooldownMs,
        confirmed: confirmedIntervals,
        pending: pendingIntervals,
        blocks: blockIntervals,
        busy: busyIntervals,
      });
      if (!status) return [];
      return [
        {
          // datetime is the true source of truth; time is for display.
          time: formatInTimeZone(slot, timeZone, "HH:mm"),
          datetime: slot.toISOString(),
          status,
        },
      ];
    });

    // Friendly label for the calendar's timezone notice, e.g.
    // "Brussels — Belguim (GMT+2)" on tour days, "Toronto / GTA — Canada (EDT)"
    // otherwise. The abbreviation is computed for the requested day so it
    // reflects the correct DST offset.
    const tzAbbrev = formatInTimeZone(
      sessionAnchorUtc(dateYmd),
      timeZone,
      "zzz",
    );
    const timezoneLabel = operating.location
      ? `${operating.location.city} — ${operating.location.country} (${tzAbbrev})`
      : `Toronto / GTA — Canada (${tzAbbrev})`;

    return NextResponse.json({
      timezone: timeZone,
      timezoneLabel,
      // Surfaced so the UI can explain the gap it keeps between rides.
      cooldownMinutes: travelBufferMinutes,
      slots: formattedSlots,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
