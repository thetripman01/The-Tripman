import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUserFromRequest } from "@/lib/admin-session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    const adminUser = await getAdminUserFromRequest(request);

    // Customer access requires matching email via query param.
    if (!adminUser) {
      // Same email-knowledge guard as /api/booking/[id] — rate limit it so
      // the email can't be brute-forced. The tracking page polls every 30s
      // (~20 hits / 10 min), so 120 leaves plenty of headroom for a family
      // sharing one IP.
      const limited = rateLimit(getClientIp(request), {
        key: "tracking-lookup",
        limit: 120,
        windowMs: 10 * 60_000,
      });
      if (!limited.ok) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: limited.retryAfterSeconds
              ? { "Retry-After": String(limited.retryAfterSeconds) }
              : undefined,
          },
        );
      }
      const { searchParams } = new URL(request.url);
      const email = searchParams.get("email")?.trim().toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "Email verification required" },
          { status: 401 },
        );
      }

      const bookingForEmailCheck = await db.booking.findUnique({
        where: { id: bookingId },
        select: { email: true },
      });

      if (!bookingForEmailCheck) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 },
        );
      }

      if (email !== bookingForEmailCheck.email.trim().toLowerCase()) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get booking with ride and location data
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: true,
        ride: {
          include: {
            locations: {
              orderBy: { timestamp: "desc" },
              take: 1, // Get latest location
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.ride) {
      return NextResponse.json({
        status: "not_started",
        message: "Ride tracking has not started yet",
      });
    }

    const latestLocation = booking.ride.locations[0];

    return NextResponse.json({
      rideId: booking.ride.id,
      status: booking.ride.status,
      driverName: booking.ride.driverName,
      driverPhone: booking.ride.driverPhone,
      vehicleInfo: booking.ride.vehicleInfo,
      startTime: booking.ride.startTime,
      endTime: booking.ride.endTime,
      currentLocation: latestLocation
        ? {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            address: latestLocation.address,
            timestamp: latestLocation.timestamp,
            accuracy: latestLocation.accuracy,
            speed: latestLocation.speed,
            heading: latestLocation.heading,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching ride tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch ride tracking" },
      { status: 500 },
    );
  }
}
