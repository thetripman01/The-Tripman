import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  sendAdminNotification,
  sendBookingConfirmation,
  sendPaymentConfirmation,
} from "@/lib/email";
import { createGoogleCalendarEvent } from "@/lib/calendar";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await db.booking.findUnique({
          where: { id: bookingId },
          include: { eventType: true },
        });
        if (!booking) break;

        // Idempotency: ignore if already confirmed/paid.
        if (
          booking.status === "CONFIRMED" &&
          booking.paymentStatus === "COMPLETED"
        ) {
          return NextResponse.json({ received: true });
        }

        // Basic validation: ensure Stripe intent matches our booking.
        // (Prevents a random intent from confirming a bookingId if metadata is tampered somewhere upstream.)
        if (
          booking.paymentIntentId &&
          booking.paymentIntentId !== paymentIntent.id
        ) {
          console.warn("PaymentIntent mismatch for booking", {
            bookingId,
            expected: booking.paymentIntentId,
            got: paymentIntent.id,
          });
          return NextResponse.json({ received: true });
        }

        // Confirm booking + store payment info
        const updated = await db.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentIntentId: paymentIntent.id,
            paymentStatus: "COMPLETED",
            amountPaid: paymentIntent.amount_received ?? paymentIntent.amount,
          },
          include: { eventType: true },
        });

        // Create Google Calendar event only after successful payment (custom scheduler only).
        const schedulerMode =
          process.env.SCHEDULER_MODE ?? process.env.NEXT_PUBLIC_SCHEDULER_MODE;
        if (schedulerMode === "custom" && !updated.googleEventId) {
          try {
            const eventId = await createGoogleCalendarEvent(updated);
            if (eventId) {
              await db.booking.update({
                where: { id: updated.id },
                data: { googleEventId: eventId },
              });
            }
          } catch (e) {
            console.error(
              "Failed to create Google Calendar event after payment:",
              e,
            );
          }
        }

        // Send emails after payment succeeds.
        try {
          await sendPaymentConfirmation(updated, paymentIntent);
          await sendBookingConfirmation(updated);
          await sendAdminNotification(updated);
        } catch (e) {
          console.error("Failed to send payment/booking emails:", e);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        if (!bookingId) break;

        await db.booking.update({
          where: { id: bookingId },
          data: {
            status: "PENDING",
            paymentStatus: "FAILED",
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
