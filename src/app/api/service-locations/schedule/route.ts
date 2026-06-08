import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/service-locations/schedule
//
// Public. Returns the upcoming "tour" locations — every isActive location
// that has at least one of availableFrom / availableUntil set, sorted by
// availableFrom ascending. The public booking calendar uses this list to
// color-code day cells (Ottawa = orange, Montreal = green, …).
//
// Always-on cities (the default GTA) intentionally do NOT appear here —
// they're the visual baseline. Only date-windowed tours need a color.
//
// We expose availableFrom / availableUntil as ISO strings so the client
// can paint the calendar without a second round-trip per day.
//
// Internal admin notes are NOT included (avoid leaking tour plans before
// they're announced; admin notes can contain unannounced details).

export async function GET() {
  try {
    const locations = await db.serviceLocation.findMany({
      where: {
        isActive: true,
        // Tour-only: at least one bound must be set.
        OR: [
          { availableFrom: { not: null } },
          { availableUntil: { not: null } },
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
