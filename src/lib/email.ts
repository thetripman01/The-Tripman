import { Resend } from "resend";
import { Booking, EventType } from "@prisma/client";
import { generateICS } from "./ics";
import type Stripe from "stripe";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface BookingWithEventType extends Booking {
  eventType: EventType;
}

export async function sendBookingConfirmation(booking: BookingWithEventType) {
  if (!resend) {
    console.log("Resend not configured, skipping email");
    return;
  }

  const icsContent = generateICS(booking);

  try {
    await resend.emails.send({
      from: "The Tripman <bookings@thetripman.com>",
      to: booking.email,
      subject: `Booking Confirmed: ${booking.eventType.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16C784;">Booking Confirmed!</h1>
          <p>Hi ${booking.fullName},</p>
          <p>Your booking with The Tripman has been confirmed. Here are the details:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${booking.eventType.name}</h3>
            <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(booking.startsAt).toLocaleTimeString()} - ${new Date(booking.endsAt).toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${booking.eventType.durationMin} minutes</p>
            ${booking.pickup ? `<p><strong>Pickup Location:</strong> ${booking.pickup}</p>` : ""}
            ${booking.peopleCount ? `<p><strong>Number of People:</strong> ${booking.peopleCount}</p>` : ""}
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ""}
            ${booking.eventType.priceCents ? `<p><strong>Price:</strong> $${(booking.eventType.priceCents / 100).toFixed(2)}</p>` : ""}
          </div>
          
          <p>Please add this event to your calendar using the attached .ics file.</p>
          <p>
            Need to make a change? Please contact The Tripman directly. Online cancellations are currently disabled.
          </p>
          
            <p>Thank you for choosing The Tripman!</p>
  <p>Best regards,<br>The Tripman Team</p>
        </div>
      `,
      attachments: [
        {
          filename: "booking.ics",
          content: icsContent,
        },
      ],
    });

    console.log(`✅ Booking confirmation sent to ${booking.email}`);
  } catch (error) {
    console.error("❌ Failed to send booking confirmation:", error);
    throw error;
  }
}

export async function sendAdminNotification(booking: BookingWithEventType) {
  if (!resend) {
    console.log("Resend not configured, skipping admin notification");
    return;
  }

  try {
    await resend.emails.send({
      from: "The Tripman <notifications@thetripman.com>",
      to: process.env.ADMIN_EMAIL!,
      subject: `New Booking: ${booking.eventType.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">New Booking Received</h1>
          <p>A new booking has been made with The Tripman:</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${booking.eventType.name}</h3>
            <p><strong>Customer:</strong> ${booking.fullName}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone || "Not provided"}</p>
            <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(booking.startsAt).toLocaleTimeString()} - ${new Date(booking.endsAt).toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${booking.eventType.durationMin} minutes</p>
            ${booking.pickup ? `<p><strong>Pickup Location:</strong> ${booking.pickup}</p>` : ""}
            ${booking.peopleCount ? `<p><strong>Number of People:</strong> ${booking.peopleCount}</p>` : ""}
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ""}
            ${booking.eventType.priceCents ? `<p><strong>Price:</strong> $${(booking.eventType.priceCents / 100).toFixed(2)}</p>` : ""}
          </div>
          
          <p>Booking ID: ${booking.id}</p>
          <p>Status: ${booking.status}</p>
        </div>
      `,
    });

    console.log(`✅ Admin notification sent for booking ${booking.id}`);
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
    // Don't throw error for admin notifications to avoid breaking the booking flow
  }
}

export async function sendCancellationNotification(
  booking: BookingWithEventType,
) {
  if (!resend) {
    console.log("Resend not configured, skipping cancellation notification");
    return;
  }

  try {
    await resend.emails.send({
      from: "The Tripman <notifications@thetripman.com>",
      to: booking.email,
      subject: `Booking Cancelled: ${booking.eventType.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Booking Cancelled</h1>
          <p>Hi ${booking.fullName},</p>
          <p>Your booking with The Tripman has been cancelled:</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${booking.eventType.name}</h3>
            <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(booking.startsAt).toLocaleTimeString()} - ${new Date(booking.endsAt).toLocaleTimeString()}</p>
          </div>
          
          <p>If you have any questions, please contact us.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>The Tripman Team</p>
        </div>
      `,
    });

    console.log(`✅ Cancellation notification sent to ${booking.email}`);
  } catch (error) {
    console.error("❌ Failed to send cancellation notification:", error);
    throw error;
  }
}

export async function sendPaymentConfirmation(
  booking: BookingWithEventType,
  paymentIntent: Stripe.PaymentIntent,
) {
  if (!resend) {
    console.log("Resend not configured, skipping payment confirmation");
    return;
  }

  try {
    await resend.emails.send({
      from: "The Tripman <payments@thetripman.com>",
      to: booking.email,
      subject: `Payment Confirmed: ${booking.eventType.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Payment Confirmed!</h1>
          <p>Hi ${booking.fullName},</p>
          <p>Your payment has been successfully processed. Here are the details:</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Amount:</strong> $${(paymentIntent.amount / 100).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${paymentIntent.payment_method_types?.[0] || "Card"}</p>
            <p><strong>Transaction ID:</strong> ${paymentIntent.id}</p>
            <p><strong>Status:</strong> ${paymentIntent.status}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Service:</strong> ${booking.eventType.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(booking.startsAt).toLocaleTimeString()} - ${new Date(booking.endsAt).toLocaleTimeString()}</p>
            ${booking.pickup ? `<p><strong>Pickup Location:</strong> ${booking.pickup}</p>` : ""}
          </div>
          
          <p>Your booking is now confirmed and paid for. We'll see you soon!</p>
          <p>If you have any questions or need to make a change, please contact The Tripman directly. Online cancellations are currently disabled.</p>
          
          <p>Thank you for choosing The Tripman!</p>
          <p>Best regards,<br>The Tripman Team</p>
        </div>
      `,
    });

    console.log(`✅ Payment confirmation sent to ${booking.email}`);
  } catch (error) {
    console.error("❌ Failed to send payment confirmation:", error);
    throw error;
  }
}

export async function sendRideStatusUpdate(
  booking: BookingWithEventType,
  status: string,
  driverInfo?: {
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
  },
) {
  if (!resend) {
    console.log("Resend not configured, skipping ride status update");
    return;
  }

  const statusMessages = {
    ASSIGNED: "Your driver has been assigned and will contact you soon.",
    DRIVER_EN_ROUTE: "Your driver is on the way to your pickup location.",
    ARRIVED: "Your driver has arrived at the pickup location.",
    IN_PROGRESS: "Your ride is currently in progress.",
    COMPLETED: "Your ride has been completed. Thank you!",
    CANCELLED: "Your ride has been cancelled.",
  };

  const statusMessage =
    statusMessages[status as keyof typeof statusMessages] ||
    "Your ride status has been updated.";

  try {
    await resend.emails.send({
      from: "The Tripman <tracking@thetripman.com>",
      to: booking.email,
      subject: `Ride Update: ${status.replace("_", " ")}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Ride Status Update</h1>
          <p>Hi ${booking.fullName},</p>
          <p>${statusMessage}</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Ride Details</h3>
            <p><strong>Service:</strong> ${booking.eventType.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(booking.startsAt).toLocaleTimeString()} - ${new Date(booking.endsAt).toLocaleTimeString()}</p>
            ${booking.pickup ? `<p><strong>Pickup Location:</strong> ${booking.pickup}</p>` : ""}
            <p><strong>Status:</strong> ${status.replace("_", " ")}</p>
          </div>
          
          ${
            driverInfo?.driverName
              ? `
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Driver Information</h3>
              <p><strong>Driver:</strong> ${driverInfo.driverName}</p>
              ${driverInfo.driverPhone ? `<p><strong>Phone:</strong> ${driverInfo.driverPhone}</p>` : ""}
              ${driverInfo.vehicleInfo ? `<p><strong>Vehicle:</strong> ${driverInfo.vehicleInfo}</p>` : ""}
            </div>
          `
              : ""
          }
          
          <p>You can track your ride in real-time by visiting your booking confirmation page.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Thank you for choosing The Tripman!</p>
          <p>Best regards,<br>The Tripman Team</p>
        </div>
      `,
    });

    console.log(`✅ Ride status update sent to ${booking.email}`);
  } catch (error) {
    console.error("❌ Failed to send ride status update:", error);
    throw error;
  }
}
