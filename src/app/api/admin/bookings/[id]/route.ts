import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/admin-session";
import { deleteGoogleCalendarEvent } from "@/lib/calendar";
import { sendCancellationNotification } from "@/lib/email";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";
import { isLocationBookableOn } from "@/lib/service-locations";
import { findConflictingBooking } from "@/lib/booking-conflicts";

// PATCH /api/admin/bookings/[id]
//
// Admin can change:
//   - status (PENDING / CONFIRMED / CANCELED) — existing behaviour
//   - startsAt + endsAt (rescheduling). Old slot is implicitly freed.
//     Conflict check excludes the booking itself.
//   - pickupCountry + pickupCity + pickupAddress (location change).
//     Validated against active ServiceLocations on the booking's date.
//
// All fields optional. At least one must be present. status alone, location
// alone, time alone, or any combination are valid.
//
// When pickupCountry changes on a still-PENDING booking, the existing
// Stripe PaymentIntent is cancelled so the next create-intent fetch
// computes the correct currency (CAD vs USD) from the new country.

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const MAX_LOCATION_FIELD = 200;

const updateBookingSchema = z
  .object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELED"]).optional(),
    startsAt: z
      .string()
      .regex(ISO_DATETIME, "startsAt must be ISO datetime")
      .optional(),
    endsAt: z
      .string()
      .regex(ISO_DATETIME, "endsAt must be ISO datetime")
      .optional(),
    pickupCountry: z.string().trim().min(1).max(MAX_LOCATION_FIELD).optional(),
    pickupCity: z.string().trim().min(1).max(MAX_LOCATION_FIELD).optional(),
    pickupAddress: z.string().trim().min(3).max(MAX_LOCATION_FIELD).optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    "At least one field must be provided",
  )
  .refine(
    // If you provide ONE of startsAt/endsAt you must provide both (we
    // can't half-update a time window).
    (d) =>
      (d.startsAt === undefined && d.endsAt === undefined) ||
      (d.startsAt !== undefined && d.endsAt !== undefined),
    "startsAt and endsAt must be provided together",
  )
  .refine(
    // Same rule for location: changing the address while leaving the
    // city or country alone would silently desync the displayed full
    // pickup string. Force the admin to set all three together.
    (d) => {
      const locationFields = [d.pickupCountry, d.pickupCity, d.pickupAddress];
      const provided = locationFields.filter((v) => v !== undefined).length;
      return provided === 0 || provided === 3;
    },
    "pickupCountry, pickupCity, and pickupAddress must be provided together",
  );

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const body = await request.json();
    const data = updateBookingSchema.parse(body);
    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Reject status=CONFIRMED if the booking still owes a payment.
    if (data.status === "CONFIRMED") {
      const tierPriceCents = getTripmanPriceForPeople(
        booking.eventType.slug,
        booking.peopleCount,
      );
      const fixedPriceCents =
        tierPriceCents ?? booking.eventType.priceCents ?? null;
      const requiresPayment = Boolean(fixedPriceCents && fixedPriceCents > 0);
      if (requiresPayment && booking.paymentStatus !== "COMPLETED") {
        return NextResponse.json(
          { error: "Cannot confirm: payment has not been completed." },
          { status: 400 },
        );
      }
    }

    // --- Reschedule validation (if date/time changing) ---
    let newStartsAt: Date | undefined;
    let newEndsAt: Date | undefined;
    if (data.startsAt && data.endsAt) {
      newStartsAt = new Date(data.startsAt);
      newEndsAt = new Date(data.endsAt);
      if (
        Number.isNaN(newStartsAt.getTime()) ||
        Number.isNaN(newEndsAt.getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid startsAt/endsAt" },
          { status: 400 },
        );
      }
      if (newEndsAt.getTime() <= newStartsAt.getTime()) {
        return NextResponse.json(
          { error: "endsAt must be after startsAt" },
          { status: 400 },
        );
      }

      // Conflict check — exclude THIS booking so we don't conflict with
      // ourselves. The shared helper also enforces the cooldown buffer.
      const conflict = await findConflictingBooking(
        db,
        newStartsAt,
        newEndsAt,
        {
          excludeBookingId: id,
        },
      );
      if (conflict) {
        return NextResponse.json(
          { error: "The new time slot conflicts with another booking." },
          { status: 409 },
        );
      }
    }

    // --- Location validation (if location changing) ---
    const newCountry = data.pickupCountry;
    const newCity = data.pickupCity;
    const newAddress = data.pickupAddress;
    if (newCountry && newCity && newAddress) {
      const validateAgainstDate = newStartsAt ?? booking.startsAt;
      const allActiveLocations = await db.serviceLocation.findMany({
        where: { isActive: true },
      });
      const ok = isLocationBookableOn(
        { country: newCountry, city: newCity },
        allActiveLocations,
        validateAgainstDate,
      );
      if (!ok) {
        return NextResponse.json(
          {
            error:
              "The selected pickup city is not bookable on the booking's date.",
          },
          { status: 400 },
        );
      }
    }

    // --- Build update payload ---
    const updateData: Prisma.BookingUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (newStartsAt) updateData.startsAt = newStartsAt;
    if (newEndsAt) updateData.endsAt = newEndsAt;
    if (newCountry && newCity && newAddress) {
      updateData.pickupCountry = newCountry;
      updateData.pickupCity = newCity;
      updateData.pickupAddress = newAddress;
      // Keep legacy combined `pickup` string in sync for older consumers.
      updateData.pickup = `${newAddress}, ${newCity}, ${newCountry}`;
    }

    // If the country changed on a PENDING booking, invalidate the existing
    // Stripe payment intent — it was created in the old currency. Next
    // create-intent call will produce a fresh one in the correct currency.
    if (
      booking.status === "PENDING" &&
      newCountry &&
      booking.pickupCountry &&
      booking.pickupCountry.trim().toLowerCase() !==
        newCountry.trim().toLowerCase() &&
      booking.paymentIntentId
    ) {
      try {
        await stripe.paymentIntents.cancel(booking.paymentIntentId);
      } catch (err) {
        // Already cancelled / succeeded — log and continue.
        console.warn(
          "Could not cancel stale payment intent during admin edit:",
          err,
        );
      }
      updateData.paymentIntentId = null;
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData,
      include: { eventType: true },
    });

    // --- Side effects (calendar + cancellation email) ---
    if (data.status === "CANCELED" && booking.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(booking.googleEventId);
      } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
      }
    }
    if (data.status === "CANCELED") {
      try {
        await sendCancellationNotification(updatedBooking);
      } catch (error) {
        console.error("Failed to send cancellation notification:", error);
      }
    }

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { id } = await params;

    const holdMinutes = parseInt(process.env.PAYMENT_HOLD_MINUTES || "15", 10);
    const pendingCutoff = new Date(Date.now() - holdMinutes * 60_000);

    const booking = await db.booking.findUnique({
      where: { id },
      include: { ride: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isExpiredPending =
      booking.status === "PENDING" && booking.createdAt < pendingCutoff;

    // Safety: only allow deletion for canceled bookings or expired pending holds.
    if (!(booking.status === "CANCELED" || isExpiredPending)) {
      return NextResponse.json(
        { error: "Only canceled or expired pending bookings can be deleted." },
        { status: 400 },
      );
    }

    // Delete tracking data if present (ride + locations).
    if (booking.ride) {
      await db.location.deleteMany({ where: { rideId: booking.ride.id } });
      await db.ride.delete({ where: { id: booking.ride.id } });
    }

    await db.booking.delete({ where: { id } });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}
