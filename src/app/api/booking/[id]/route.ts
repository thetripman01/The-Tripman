import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUserFromRequest } from "@/lib/admin-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Admins can access full booking details without extra verification.
    const adminUser = await getAdminUserFromRequest(request);

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        ride: {
          include: {
            locations: {
              orderBy: { timestamp: "desc" },
              take: 10, // Get last 10 locations
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Customer access: require matching email via query param.
    if (!adminUser) {
      const { searchParams } = new URL(request.url);
      const email = searchParams.get("email")?.trim().toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "Email verification required" },
          { status: 401 },
        );
      }
      if (email !== booking.email.trim().toLowerCase()) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (adminUser) {
      // Admin response (full).
      return NextResponse.json({
        id: booking.id,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        pickup: booking.pickup,
        pickupCountry: booking.pickupCountry,
        pickupCity: booking.pickupCity,
        pickupAddress: booking.pickupAddress,
        peopleCount: booking.peopleCount,
        notes: booking.notes,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        timezone: booking.timezone,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amountPaid: booking.amountPaid,
        paymentIntentId: booking.paymentIntentId,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        eventType: {
          id: booking.eventType.id,
          slug: booking.eventType.slug,
          name: booking.eventType.name,
          description: booking.eventType.description,
          durationMin: booking.eventType.durationMin,
          priceCents: booking.eventType.priceCents,
        },
        ride: booking.ride
          ? {
              id: booking.ride.id,
              driverName: booking.ride.driverName,
              driverPhone: booking.ride.driverPhone,
              vehicleInfo: booking.ride.vehicleInfo,
              status: booking.ride.status,
              startTime: booking.ride.startTime,
              endTime: booking.ride.endTime,
              locations: booking.ride.locations,
            }
          : null,
      });
    }

    // Customer response (limited).
    return NextResponse.json({
      id: booking.id,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      pickup: booking.pickup,
      pickupCountry: booking.pickupCountry,
      pickupCity: booking.pickupCity,
      pickupAddress: booking.pickupAddress,
      peopleCount: booking.peopleCount,
      notes: booking.notes,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      timezone: booking.timezone,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amountPaid: booking.amountPaid,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      eventType: {
        id: booking.eventType.id,
        slug: booking.eventType.slug,
        name: booking.eventType.name,
        description: booking.eventType.description,
        durationMin: booking.eventType.durationMin,
        priceCents: booking.eventType.priceCents,
      },
      ride: booking.ride ? { id: booking.ride.id } : null,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}
