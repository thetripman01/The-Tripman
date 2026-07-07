import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { BUSINESS_TIMEZONE, businessDayStartUtc } from "@/lib/timezone";

// GET /api/admin/stats — headline booking counts for the dashboard.
//
// Counts CONFIRMED bookings only (paid / real customers; pending holds and
// cancellations excluded). "This month" uses business-timezone month
// boundaries so a ride sold late on the 31st in Toronto doesn't leak into
// next month just because UTC already rolled over.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth) return auth;

    const now = new Date();
    const ym = formatInTimeZone(now, BUSINESS_TIMEZONE, "yyyy-MM");
    const [year, month] = ym.split("-").map(Number);
    const nextYm =
      month === 12
        ? `${year + 1}-01`
        : `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthStart = businessDayStartUtc(`${ym}-01`);
    const monthEnd = businessDayStartUtc(`${nextYm}-01`);

    const [total, thisMonth, upcoming] = await Promise.all([
      db.booking.count({ where: { status: "CONFIRMED" } }),
      db.booking.count({
        where: {
          status: "CONFIRMED",
          startsAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      db.booking.count({
        where: { status: "CONFIRMED", startsAt: { gte: now } },
      }),
    ]);

    return NextResponse.json({ total, thisMonth, upcoming });
  } catch (error) {
    console.error("Error computing booking stats:", error);
    return NextResponse.json(
      { error: "Failed to compute stats" },
      { status: 500 },
    );
  }
}
