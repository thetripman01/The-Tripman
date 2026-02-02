import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getFreeBusyTimes,
  generateTimeSlots,
  getWorkingHours,
} from "@/lib/calendar";

type Interval = { start: Date; end: Date };

function parseHHMM(value: string) {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
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
  date: Date,
  rules: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }>,
) {
  const d0 = startOfDayLocal(date);
  const d1 = endOfDayLocal(date);
  const dow = d0.getDay(); // 0-6, Sun-Sat
  const prev = new Date(d0);
  prev.setDate(prev.getDate() - 1);
  const prevDow = prev.getDay();

  const base: Interval[] = [];
  const subtract: Interval[] = [];

  const add = (isAvailable: boolean, iv: Interval) => {
    const clipped: Interval = {
      start: new Date(Math.max(iv.start.getTime(), d0.getTime())),
      end: new Date(Math.min(iv.end.getTime(), d1.getTime())),
    };
    if (clipped.end <= clipped.start) return;
    (isAvailable ? base : subtract).push(clipped);
  };

  for (const r of rules) {
    const start = parseHHMM(r.startTime);
    const end = parseHHMM(r.endTime);
    const overnight = end.h < start.h || (end.h === start.h && end.m < start.m);

    // Same-day portion
    if (r.daysOfWeek.includes(dow)) {
      const ivStart = new Date(d0);
      ivStart.setHours(start.h, start.m, 0, 0);

      const ivEnd = new Date(d0);
      if (overnight) {
        // until end of day (overflow handled by previous-day rule on next date)
        ivEnd.setHours(23, 59, 59, 999);
      } else {
        ivEnd.setHours(end.h, end.m, 0, 0);
      }
      add(r.isAvailable, { start: ivStart, end: ivEnd });
    }

    // Overflow portion: if previous day had overnight rule, add early-morning window on this day
    if (overnight && r.daysOfWeek.includes(prevDow)) {
      const ivStart = new Date(d0);
      ivStart.setHours(0, 0, 0, 0);
      const ivEnd = new Date(d0);
      ivEnd.setHours(end.h, end.m, 0, 0);
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
  bufferMinutes: number,
) {
  const slots: Date[] = [];
  for (const iv of intervals) {
    let cur = new Date(iv.start);
    while (cur < iv.end) {
      const slotEnd = new Date(cur.getTime() + durationMinutes * 60000);
      if (slotEnd <= iv.end) slots.push(new Date(cur));
      cur = new Date(cur.getTime() + (durationMinutes + bufferMinutes) * 60000);
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
    const selectedDate = new Date(date);
    const startOfDay = startOfDayLocal(selectedDate);
    const endOfDay = endOfDayLocal(selectedDate);
    const prevStart = new Date(startOfDay);
    prevStart.setDate(prevStart.getDate() - 1);

    // Get Google Calendar busy times
    let busyTimes: Array<{ start: Date; end: Date }> = [];
    try {
      const googleBusyTimes = await getFreeBusyTimes(startOfDay, endOfDay);
      busyTimes = googleBusyTimes.map((period) => ({
        start: new Date(period.start || ""),
        end: new Date(period.end || ""),
      }));
    } catch {
      // Continue without Google Calendar data if not configured
    }

    // Get existing bookings for this date
    const existingBookings = await db.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: "CANCELED",
        },
      },
    });

    // Get availability blocks (vacation/unavailable times)
    const blocks = await db.availabilityBlock.findMany({
      where: {
        startsAt: { lt: endOfDay },
        endsAt: { gt: startOfDay },
      },
      orderBy: { startsAt: "asc" },
    });

    // Generate all possible time slots
    const bufferMinutes = parseInt(process.env.BUFFER_MINUTES || "15");
    // Recurring availability rules (optional). If any "available" rules exist for the day,
    // we use them. Otherwise we fall back to default working hours.
    const rules = await db.availabilityRule.findMany({
      where: {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: endOfDay } }] },
          { OR: [{ endDate: null }, { endDate: { gte: prevStart } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    let baseIntervals: Interval[] = [];
    let subtractIntervalsList: Interval[] = [];

    const applicable = intervalsFromRulesForDate(
      selectedDate,
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
      if (!wh.daysOfWeek.includes(startOfDay.getDay())) {
        return NextResponse.json([]);
      }
      const ivStart = new Date(startOfDay);
      ivStart.setHours(wh.start, 0, 0, 0);
      const ivEnd = new Date(startOfDay);
      ivEnd.setHours(wh.end, 0, 0, 0);
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
      bufferMinutes,
    );

    // Filter out unavailable slots
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = new Date(slot.getTime() + eventType.durationMin * 60000);

      // Check if slot is in the past
      if (slot < new Date()) {
        return false;
      }

      // Check minimum notice hours
      const minNoticeHours = parseInt(
        process.env.BOOKING_MIN_NOTICE_HOURS || "24",
      );
      const minNoticeTime = new Date();
      minNoticeTime.setHours(minNoticeTime.getHours() + minNoticeHours);
      if (slot < minNoticeTime) {
        return false;
      }

      // Check Google Calendar conflicts
      const hasGoogleConflict = busyTimes.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slot < busyEnd && slotEnd > busyStart;
      });

      if (hasGoogleConflict) {
        return false;
      }

      // Check existing booking conflicts
      const hasBookingConflict = existingBookings.some(
        (booking: { startsAt: Date | string; endsAt: Date | string }) => {
          const bookingStart = new Date(booking.startsAt);
          const bookingEnd = new Date(booking.endsAt);
          return slot < bookingEnd && slotEnd > bookingStart;
        },
      );

      if (hasBookingConflict) {
        return false;
      }

      // Check admin availability blocks
      const hasBlockConflict = blocks.some((b) => {
        const bStart = new Date(b.startsAt);
        const bEnd = new Date(b.endsAt);
        return slot < bEnd && slotEnd > bStart;
      });

      if (hasBlockConflict) {
        return false;
      }

      return true;
    });

    // Format slots for response
    const formattedSlots = availableSlots.map((slot) => ({
      time: slot.toTimeString().slice(0, 5), // HH:MM format
      datetime: slot.toISOString(),
    }));

    return NextResponse.json(formattedSlots);
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
