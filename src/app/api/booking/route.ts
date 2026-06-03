import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendAdminNotification, sendBookingConfirmation } from "@/lib/email";
import { checkForFraud, logFraudAttempt } from "@/lib/fraud-detection";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";
import { isLocationAvailableOn } from "@/lib/service-locations";

const bookingSchema = z.object({
  eventTypeId: z.string(),
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  // Structured pickup location.
  pickupCountry: z.string().trim().min(1).max(100),
  pickupCity: z.string().trim().min(1).max(100),
  pickupAddress: z.string().trim().min(3).max(200),
  peopleCount: z.string().optional(),
  notes: z.string().max(2000).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string().max(64),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Get event type
    const eventType = await db.eventType.findUnique({
      where: { id: validatedData.eventTypeId },
    });

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 },
      );
    }

    // Validate the pickup location against the admin-managed list.
    // This is the authoritative check — the client-side filter is just UX.
    // We do this BEFORE fraud detection so attackers spamming garbage cities
    // get a clear 400 without ever entering the fraud-detection path.
    const startsAtDate = new Date(validatedData.startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid booking start time" },
        { status: 400 },
      );
    }
    const locationMatch = await db.serviceLocation.findUnique({
      where: {
        country_city: {
          country: validatedData.pickupCountry,
          city: validatedData.pickupCity,
        },
      },
    });
    if (!locationMatch || !isLocationAvailableOn(locationMatch, startsAtDate)) {
      return NextResponse.json(
        {
          error:
            "Selected pickup city is not available for this date. Please refresh and pick a serviced city.",
        },
        { status: 400 },
      );
    }

    // Fraud detection check
    const fraudResult = await checkForFraud({
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      eventTypeId: validatedData.eventTypeId,
      startsAt: new Date(validatedData.startsAt),
      endsAt: new Date(validatedData.endsAt),
      amountPaid: eventType.priceCents ?? undefined,
    });

    // Log fraud attempt if detected
    if (fraudResult.isFraudulent || fraudResult.riskScore >= 30) {
      await logFraudAttempt("pending", fraudResult, {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        eventTypeId: validatedData.eventTypeId,
        startsAt: new Date(validatedData.startsAt),
        endsAt: new Date(validatedData.endsAt),
        amountPaid: eventType.priceCents ?? undefined,
      });
    }

    // Block high-risk bookings
    if (fraudResult.isFraudulent) {
      return NextResponse.json(
        {
          error: "Booking cannot be processed at this time",
          message: "Please contact customer service for assistance",
          fraudDetected: true,
        },
        { status: 400 },
      );
    }

    // Check for booking conflicts
    const holdMinutes = parseInt(process.env.PAYMENT_HOLD_MINUTES || "15", 10);
    const pendingCutoff = new Date(Date.now() - holdMinutes * 60_000);
    const conflictingBooking = await db.booking.findFirst({
      where: {
        startsAt: {
          lt: new Date(validatedData.endsAt),
        },
        endsAt: {
          gt: new Date(validatedData.startsAt),
        },
        OR: [
          { status: "CONFIRMED" },
          {
            status: "PENDING",
            createdAt: { gte: pendingCutoff },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 },
      );
    }

    const peopleCountNum = validatedData.peopleCount
      ? parseInt(validatedData.peopleCount, 10)
      : null;

    // Determine whether this booking requires payment.
    // For Tripman packages, price depends on peopleCount tiers.
    const tierPriceCents = getTripmanPriceForPeople(
      eventType.slug,
      peopleCountNum,
    );

    // For paid packages, require valid group size (1–4 people)
    if (eventType.priceCents != null && tierPriceCents == null) {
      return NextResponse.json(
        { error: "Group size must be 1–4 people for this package." },
        { status: 400 },
      );
    }

    const fixedPriceCents = tierPriceCents ?? eventType.priceCents ?? null;
    const requiresPayment = Boolean(fixedPriceCents && fixedPriceCents > 0);

    // Compose a human-readable legacy `pickup` string for downstream consumers
    // (calendar invites, older email templates, fraud-detection text checks).
    // The structured fields remain the source of truth.
    const combinedPickup = `${validatedData.pickupAddress}, ${validatedData.pickupCity}, ${validatedData.pickupCountry}`;

    // Create booking (IMPORTANT: do NOT confirm until payment succeeds for paid packages)
    const booking = await db.booking.create({
      data: {
        eventTypeId: validatedData.eventTypeId,
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        pickup: combinedPickup,
        pickupCountry: validatedData.pickupCountry,
        pickupCity: validatedData.pickupCity,
        pickupAddress: validatedData.pickupAddress,
        peopleCount: peopleCountNum,
        notes: validatedData.notes,
        startsAt: new Date(validatedData.startsAt),
        endsAt: new Date(validatedData.endsAt),
        timezone: validatedData.timezone,
        status: requiresPayment ? "PENDING" : "CONFIRMED",
        paymentStatus: requiresPayment ? "PENDING" : "PENDING",
      },
      include: {
        eventType: true,
      },
    });

    // Emails:
    // - Paid bookings: send confirmation only AFTER Stripe webhook succeeds (prevents "free confirmed bookings").
    // - Non-priced bookings (promo ride/custom): confirm immediately and notify admin.
    if (!requiresPayment) {
      try {
        await sendBookingConfirmation(booking);
        await sendAdminNotification(booking);
      } catch (error) {
        console.error("Failed to send confirmation emails:", error);
      }
    }

    return NextResponse.json({
      id: booking.id,
      requiresPayment,
      amountCents: fixedPriceCents,
      currency: "cad",
      message: requiresPayment
        ? "Booking created. Payment required to confirm."
        : "Booking created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400 },
      );
    }

    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
