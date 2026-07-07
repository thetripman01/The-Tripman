import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendRideStatusUpdate } from "@/lib/email";
import { getAdminUserFromRequest } from "@/lib/admin-session";
import { secureCompare } from "@/lib/secure-compare";

const updateStatusSchema = z.object({
  rideId: z.string(),
  status: z.enum([
    "ASSIGNED",
    "DRIVER_EN_ROUTE",
    "ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    const secret = request.headers.get("x-tripman-tracking-secret");
    const expected = process.env.TRACKING_API_SECRET;
    const authedBySecret = Boolean(
      expected && secret && secureCompare(secret, expected),
    );

    if (!adminUser && !authedBySecret) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { rideId, status, driverName, driverPhone, vehicleInfo } =
      updateStatusSchema.parse(body);

    // Update ride status
    const updatedRide = await db.ride.update({
      where: { id: rideId },
      data: {
        status,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        vehicleInfo: vehicleInfo || undefined,
        startTime: status === "IN_PROGRESS" ? new Date() : undefined,
        endTime: status === "COMPLETED" ? new Date() : undefined,
      },
      include: {
        booking: {
          include: {
            eventType: true,
          },
        },
      },
    });

    // Send status update email to customer
    try {
      await sendRideStatusUpdate(updatedRide.booking, status, {
        driverName: updatedRide.driverName ?? undefined,
        driverPhone: updatedRide.driverPhone ?? undefined,
        vehicleInfo: updatedRide.vehicleInfo ?? undefined,
      });
    } catch (error) {
      console.error("Failed to send status update email:", error);
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating ride status:", error);
    return NextResponse.json(
      { error: "Failed to update ride status" },
      { status: 500 },
    );
  }
}
