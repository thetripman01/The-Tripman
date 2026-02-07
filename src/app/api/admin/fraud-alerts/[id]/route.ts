import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";

const updateFraudAlertSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED"]),
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

    const { id } = await params;
    const body = await request.json();
    const { status } = updateFraudAlertSchema.parse(body);

    // Extract booking ID from fraud alert ID
    const bookingId = id.replace("fraud-", "");

    // IMPORTANT: Fraud review must never "confirm" a paid booking without payment.
    // This endpoint is best-effort admin tooling; keep it conservative.
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { eventType: true },
    });

    if (booking) {
      const tierPriceCents = getTripmanPriceForPeople(
        booking.eventType.slug,
        booking.peopleCount,
      );
      const fixedPriceCents =
        tierPriceCents ?? booking.eventType.priceCents ?? null;
      const requiresPayment = Boolean(fixedPriceCents && fixedPriceCents > 0);

      if (status === "REJECTED") {
        // If unpaid, we can safely cancel.
        if (!requiresPayment || booking.paymentStatus !== "COMPLETED") {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              status: "CANCELED",
              notes: booking.notes
                ? `${booking.notes}\n\nFRAUD REVIEW: Rejected`
                : "FRAUD REVIEW: Rejected",
            },
          });
        } else {
          // Paid bookings should not be auto-cancelled here (refund handling is separate).
          await db.booking.update({
            where: { id: bookingId },
            data: {
              notes: booking.notes
                ? `${booking.notes}\n\nFRAUD REVIEW: Rejected (paid booking - manual action required)`
                : "FRAUD REVIEW: Rejected (paid booking - manual action required)",
            },
          });
        }
      }

      if (status === "APPROVED" || status === "REVIEWED") {
        // Do NOT change booking status here. Payment webhook controls confirmation.
        await db.booking.update({
          where: { id: bookingId },
          data: {
            notes: booking.notes
              ? `${booking.notes}\n\nFRAUD REVIEW: ${status}`
              : `FRAUD REVIEW: ${status}`,
          },
        });
      }
    }

    // In a real system, you would update the fraud alert status in the database
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: `Fraud alert ${status.toLowerCase()}`,
      bookingId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid fraud alert data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating fraud alert:", error);
    return NextResponse.json(
      { error: "Failed to update fraud alert" },
      { status: 500 },
    );
  }
}
