import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendCancellationNotification } from "@/lib/email";
import { getAdminUserFromRequest } from "@/lib/admin-session";

const cancelBookingSchema = z.object({
  email: z.string().email().optional(),
  reason: z.string().optional(),
  refundRequested: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, reason, refundRequested } = cancelBookingSchema.parse(body);

    // Admins can cancel without extra verification.
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json(
        {
          error: "Customer cancellations are currently disabled",
          message:
            "To cancel or change a booking, please contact The Tripman directly.",
        },
        { status: 403 },
      );
    }

    // Get booking details
    const booking = await db.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be cancelled (admin-only for now)
    const now = new Date();
    const bookingStart = new Date(booking.startsAt);
    const hoursUntilBooking =
      (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check if already cancelled
    if (booking.status === "CANCELED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 },
      );
    }

    // IMPORTANT (launch policy): no refunds are processed automatically.
    // We intentionally ignore `refundRequested` for now.
    // (Stripe disputes/chargebacks may still occur via Stripe, but we do not initiate refunds here.)
    void refundRequested;
    void hoursUntilBooking;

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: "CANCELED",
        notes: booking.notes
          ? `${booking.notes}\n\nCANCELLED: ${reason || "Customer requested"}`
          : `CANCELLED: ${reason || "Customer requested"}`,
      },
      include: { eventType: true },
    });

    // Send cancellation notification
    try {
      await sendCancellationNotification(updatedBooking);
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      refundAmount: 0,
      message:
        "Booking cancelled successfully. Refunds are not available at this time.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid cancellation data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 },
    );
  }
}
