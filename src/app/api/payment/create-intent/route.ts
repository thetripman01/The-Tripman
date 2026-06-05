import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getTripmanQuoteForBooking } from "@/lib/tripman-packages";

const createPaymentIntentSchema = z.object({
  bookingId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = createPaymentIntentSchema.parse(body);

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

    // Always compute amount + currency + tax server-side to prevent
    // tampering. Currency is derived from the pickup country (USA → USD,
    // Canada → CAD) and tax is +13% applied automatically. We never trust
    // a client-supplied currency or amount here.
    const quote = getTripmanQuoteForBooking(
      booking.eventType.slug,
      booking.peopleCount,
      booking.pickupCountry,
    );
    if (!quote || quote.totalCents <= 0) {
      return NextResponse.json(
        {
          error:
            "This package does not have a fixed price. Payment cannot be created.",
        },
        { status: 400 },
      );
    }
    // Total charged to Stripe = subtotal + tax. Breakdown is stored
    // locally + in Stripe metadata for reconciliation.
    const amountCents = quote.totalCents;
    const normalizedCurrency = quote.currency;

    // Persist the breakdown on the booking row. Doing this BEFORE creating
    // the Stripe intent means our DB is always the source of truth for the
    // receipt — even if Stripe goes down mid-call. We also persist on
    // intent-reuse paths below.
    await db.booking.update({
      where: { id: booking.id },
      data: {
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        taxRate: quote.taxRate,
        currency: quote.currency,
      },
    });

    // If we already created an intent for this booking, reuse it (supports
    // page refresh / retry). BUT — if the existing intent's amount or
    // currency no longer matches our authoritative quote (e.g. admin
    // changed pickupCountry, or tax rate changed), cancel it and create a
    // fresh one. This keeps tax + currency in lockstep with the booking.
    if (booking.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(
        booking.paymentIntentId,
      );
      const status = existing.status;
      // If already paid, no need to create another intent.
      if (status === "succeeded") {
        return NextResponse.json(
          { error: "Payment has already been completed for this booking." },
          { status: 409 },
        );
      }
      const stale =
        existing.amount !== amountCents ||
        existing.currency !== normalizedCurrency;
      // If intent is still usable AND in-sync with our quote, return it.
      if (
        !stale &&
        (status === "requires_payment_method" ||
          status === "requires_confirmation" ||
          status === "requires_action" ||
          status === "processing")
      ) {
        if (existing.client_secret) {
          return NextResponse.json({
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
            currency: existing.currency,
            amountCents: existing.amount,
            subtotalCents: quote.subtotalCents,
            taxCents: quote.taxCents,
            taxLabel: quote.taxLabel,
          });
        }
      }
      // Stale or unusable → cancel so the next call below creates fresh.
      if (stale) {
        try {
          await stripe.paymentIntents.cancel(booking.paymentIntentId);
        } catch (err) {
          console.warn("Could not cancel stale payment intent:", err);
        }
        await db.booking.update({
          where: { id: booking.id },
          data: { paymentIntentId: null },
        });
      }
    }

    // Create payment intent. Metadata captures the tax breakdown so any
    // Stripe-side report or audit can reconstruct the receipt without
    // hitting our DB.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: normalizedCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking.id,
        eventTypeSlug: booking.eventType.slug,
        subtotalCents: String(quote.subtotalCents),
        taxCents: String(quote.taxCents),
        taxRate: String(quote.taxRate),
        taxLabel: quote.taxLabel,
      },
      description: `${booking.eventType.name} (incl. ${quote.taxLabel} ${(
        quote.taxRate * 100
      ).toFixed(0)}%) - ${booking.fullName}`,
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
      subtotalCents: quote.subtotalCents,
      taxCents: quote.taxCents,
      taxLabel: quote.taxLabel,
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
