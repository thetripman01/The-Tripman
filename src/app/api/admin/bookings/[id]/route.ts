import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { deleteGoogleCalendarEvent } from "@/lib/calendar";
import { sendCancellationNotification } from "@/lib/email";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const body = await request.json();
    const { status } = updateBookingSchema.parse(body);
    const { id } = await params;

    // Get the booking
    const booking = await db.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Prevent accidentally confirming an unpaid paid-booking from the admin panel.
    if (status === "CONFIRMED") {
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

    // Update the booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status },
      include: { eventType: true },
    });

    // Handle Google Calendar integration
    if (status === "CANCELED" && booking.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(booking.googleEventId);
      } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
      }
    }

    // Send cancellation notification if booking is canceled
    if (status === "CANCELED") {
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
