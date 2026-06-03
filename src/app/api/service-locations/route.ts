import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { filterBookableLocations } from "@/lib/service-locations";

// GET /api/service-locations?date=YYYY-MM-DD
//
// Returns all ServiceLocation rows that are:
//   - isActive = true, AND
//   - available on the provided date (defaults to today in UTC).
//
// The response is intentionally minimal — only fields the public booking
// form needs. No internal notes, no createdAt, no IDs of inactive rows.
//
// This endpoint is unauthenticated by design (it powers the public form).

const querySchema = z.object({
  // ISO calendar date (YYYY-MM-DD). Strict format to avoid ambiguity.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const bookingDate = parsed.data.date
      ? new Date(parsed.data.date + "T12:00:00.000Z") // midday UTC to avoid edge-of-day shifts
      : new Date();

    if (Number.isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const allActive = await db.serviceLocation.findMany({
      where: { isActive: true },
      // Alphabetical by country, then city. Simple and predictable for the
      // public dropdown — admin doesn't have to manage a sort field.
      orderBy: [{ country: "asc" }, { city: "asc" }],
    });

    // filterBookableLocations also enforces "exclusive" mode: if any active
    // city has its date window covering this date AND is flagged exclusive,
    // only those exclusive rows are returned — every other city is hidden.
    // This is how a Montreal tour can hide the GTA without disabling them.
    const bookable = filterBookableLocations(allActive, bookingDate).map(
      (loc) => ({
        id: loc.id,
        country: loc.country,
        city: loc.city,
        isDefault: loc.isDefault,
      }),
    );

    return NextResponse.json(bookable);
  } catch (error) {
    console.error("Error fetching service locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch service locations" },
      { status: 500 },
    );
  }
}
