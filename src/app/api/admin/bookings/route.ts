import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const eventType = searchParams.get("eventType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const includePast = searchParams.get("includePast") === "1";
    const includeCanceled = searchParams.get("includeCanceled") === "1";
    const includeExpiredPending =
      searchParams.get("includeExpiredPending") === "1";
    const includePending = searchParams.get("includePending") !== "0"; // default true

    // Build where clause
    const where: Record<string, unknown> = {};
    const holdMinutes = parseInt(process.env.PAYMENT_HOLD_MINUTES || "15", 10);
    const pendingCutoff = new Date(Date.now() - holdMinutes * 60_000);

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.startsAt = {} as Record<string, unknown>;
      if (dateFrom) {
        (where.startsAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.startsAt as Record<string, unknown>).lte = new Date(
          dateTo + "T23:59:59.999Z",
        );
      }
    } else if (!includePast) {
      // Default: hide past bookings in the admin dashboard to keep it clean.
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      where.startsAt = { gte: startOfToday };
    }

    if (eventType) {
      where.eventType = {
        slug: eventType,
      };
    }

    // Default view: keep the dashboard clean.
    // If status filter is not explicitly set, we can exclude:
    // - CANCELED bookings (unless includeCanceled=1)
    // - Expired PENDING holds (unless includeExpiredPending=1)
    if (!status) {
      const ors: Array<Record<string, unknown>> = [{ status: "CONFIRMED" }];
      if (includePending) {
        ors.push(
          includeExpiredPending
            ? { status: "PENDING" }
            : { status: "PENDING", createdAt: { gte: pendingCutoff } },
        );
      }
      if (includeCanceled) ors.push({ status: "CANCELED" });
      where.OR = ors;
    }

    const bookings = await db.booking.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        pickup: true,
        pickupCountry: true,
        pickupCity: true,
        pickupAddress: true,
        peopleCount: true,
        notes: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        status: true,
        paymentStatus: true,
        amountPaid: true,
        paymentIntentId: true,
        createdAt: true,
        eventType: {
          select: {
            name: true,
            durationMin: true,
            priceCents: true,
            slug: true,
          },
        },
      },
      // Ascending: nearest upcoming booking first. Past bookings (when
      // includePast is enabled) tail at the bottom; admin scrolls down for
      // history rather than up.
      orderBy: {
        startsAt: "asc",
      },
    });

    return NextResponse.json(
      bookings.map((b) => ({
        ...b,
        // Convenience for UI: whether a pending booking hold is expired.
        isExpiredHold:
          b.status === "PENDING" &&
          new Date(b.createdAt).getTime() < pendingCutoff.getTime(),
      })),
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}
