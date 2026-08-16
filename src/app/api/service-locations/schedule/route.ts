import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businessDayStartUtc, toBusinessCalendarDay } from "@/lib/timezone";

// GET /api/service-locations/schedule
//
// Public. Returns the UPCOMING "tour" locations — every isActive location
// that has at least one of availableFrom / availableUntil set AND hasn't
// finished yet, sorted by availableFrom ascending. The public booking
// calendar uses this list to color-code day cells (Ottawa = orange, …).
//
// Always-on cities (the default GTA) intentionally do NOT appear here —
// they're the visual baseline. Only date-windowed tours need a color.
//
// Finished tours are excluded so the calendar goes back to its plain
// Toronto/GTA look once a tour wraps. Without this the legend kept showing
// every past stop (the whole Europe run stayed coloured after it ended) —
// admin no longer has to deactivate each city by hand.
//
// We expose availableFrom / availableUntil as ISO strings so the client
// can paint the calendar without a second round-trip per day.
//
// Internal admin notes are NOT included (avoid leaking tour plans before
// they're announced; admin notes can contain unannounced details).

// Date-dependent: never let this be statically optimized at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Start of today in the business timezone. A tour whose last day is today
    // stays listed (its availableUntil is today's end-of-day); one that ended
    // yesterday or earlier drops off.
    const todayStart = businessDayStartUtc(toBusinessCalendarDay(new Date()));

    const locations = await db.serviceLocation.findMany({
      where: {
        isActive: true,
        AND: [
          // Tour-only: at least one bound must be set.
          {
            OR: [
              { availableFrom: { not: null } },
              { availableUntil: { not: null } },
            ],
          },
          // Not already finished (open-ended tours have no end date).
          {
            OR: [
              { availableUntil: null },
              { availableUntil: { gte: todayStart } },
            ],
          },
        ],
      },
      orderBy: [{ availableFrom: "asc" }, { city: "asc" }],
    });

    // Project to the minimum the calendar needs.
    const result = locations.map((loc) => ({
      id: loc.id,
      country: loc.country,
      city: loc.city,
      availableFrom: loc.availableFrom?.toISOString() ?? null,
      availableUntil: loc.availableUntil?.toISOString() ?? null,
    }));

    return NextResponse.json(result, {
      headers: {
        // Short cache — tour schedules change rarely, but we want the next
        // edit to be visible to customers within a couple of minutes.
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching service-location schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 },
    );
  }
}
