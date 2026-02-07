import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";

const createPaymentIntentSchema = z.object({
  bookingId: z.string(),
  // Currency can be changed later, but Tripman operates in Canada today.
  currency: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, currency } = createPaymentIntentSchema.parse(body);

    // Get booking details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { eventType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment can only be created for pending bookings." },
        { status: 400 },
      );
    }

    const holdMinutes = parseInt(process.env.PAYMENT_HOLD_MINUTES || "15", 10);
    const expiresAt = new Date(
      booking.createdAt.getTime() + holdMinutes * 60_000,
    );
    if (Date.now() > expiresAt.getTime()) {
      return NextResponse.json(
        { error: "This booking hold has expired. Please book again." },
        { status: 410 },
      );
    }

    // Always compute amount server-side to prevent tampering.
    // For Tripman packages, price depends on peopleCount tiers.
    const tierPriceCents = getTripmanPriceForPeople(
      booking.eventType.slug,
      booking.peopleCount,
    );
    const amountCents = tierPriceCents ?? booking.eventType.priceCents;
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        {
          error:
            "This package does not have a fixed price. Payment cannot be created.",
        },
        { status: 400 },
      );
    }

    const normalizedCurrency = (currency ?? "cad").toLowerCase();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: normalizedCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking.id,
        eventTypeSlug: booking.eventType.slug,
      },
      description: `Payment for ${booking.eventType.name} - ${booking.fullName}`,
    });

    // Store payment intent id early for traceability.
    await db.booking.update({
      where: { id: booking.id },
      data: { paymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency: normalizedCurrency,
      amountCents,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payment data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 },
    );
  }
}
