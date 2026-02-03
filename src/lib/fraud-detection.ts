import { db } from "@/lib/db";

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
}

export interface BookingData {
  fullName: string;
  email: string;
  phone?: string;
  eventTypeId: string;
  startsAt: Date;
  endsAt: Date;
  amountPaid?: number;
}

export async function checkForFraud(
  bookingData: BookingData,
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  try {
    // 1. Check for duplicate bookings
    const duplicateBookings = await db.booking.findMany({
      where: {
        email: bookingData.email,
        startsAt: {
          gte: new Date(bookingData.startsAt.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
          lte: new Date(bookingData.startsAt.getTime() + 24 * 60 * 60 * 1000), // 24 hours after
        },
        status: {
          not: "CANCELED",
        },
      },
    });

    if (duplicateBookings.length > 0) {
      riskScore += 30;
      reasons.push(
        `Multiple bookings found for same email within 24 hours (${duplicateBookings.length} bookings)`,
      );
      recommendations.push("Review booking history for this customer");
    }

    // 2. Check for suspicious email patterns
    const emailPatterns = [/test/i, /fake/i, /spam/i, /temp/i];

    for (const pattern of emailPatterns) {
      if (pattern.test(bookingData.email)) {
        riskScore += 20;
        reasons.push("Suspicious email pattern detected");
        recommendations.push("Verify customer identity");
        break;
      }
    }

    // 3. Check for very short notice bookings (potential fraud)
    const now = new Date();
    const hoursUntilBooking =
      (bookingData.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      riskScore += 25;
      reasons.push("Booking made with less than 2 hours notice");
      recommendations.push(
        "Require additional verification for short notice bookings",
      );
    }

    // 4. Check for high-value bookings
    if (bookingData.amountPaid && bookingData.amountPaid > 10000) {
      // $100+
      riskScore += 15;
      reasons.push("High-value booking detected");
      recommendations.push(
        "Consider additional verification for high-value bookings",
      );
    }

    // 5. Check for suspicious phone numbers
    if (bookingData.phone) {
      // Check for common fake phone numbers
      const fakePhonePatterns = [
        /^123-456-7890$/,
        /^000-000-0000$/,
        /^111-111-1111$/,
        /^555-555-5555$/,
      ];

      for (const pattern of fakePhonePatterns) {
        if (pattern.test(bookingData.phone)) {
          riskScore += 20;
          reasons.push("Suspicious phone number pattern");
          recommendations.push("Verify phone number authenticity");
          break;
        }
      }
    }

    // 6. Check for rapid successive bookings
    const recentBookings = await db.booking.findMany({
      where: {
        email: bookingData.email,
        createdAt: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentBookings.length >= 3) {
      riskScore += 35;
      reasons.push(
        `Multiple bookings created in short time (${recentBookings.length} in last hour)`,
      );
      recommendations.push(
        "Review booking patterns and consider rate limiting",
      );
    }

    // 7. Check for cancelled bookings from same email
    const cancelledBookings = await db.booking.findMany({
      where: {
        email: bookingData.email,
        status: "CANCELED",
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    if (cancelledBookings.length >= 3) {
      riskScore += 25;
      reasons.push(
        `Multiple cancelled bookings from same email (${cancelledBookings.length} in last 30 days)`,
      );
      recommendations.push("Review cancellation patterns");
    }

    // 8. Check for weekend/off-hours bookings (potential testing)
    const bookingHour = bookingData.startsAt.getHours();
    const isWeekend =
      bookingData.startsAt.getDay() === 0 ||
      bookingData.startsAt.getDay() === 6;

    if (isWeekend && (bookingHour < 8 || bookingHour > 22)) {
      riskScore += 10;
      reasons.push("Unusual booking time (weekend off-hours)");
      recommendations.push("Verify booking legitimacy");
    }

    // 9. Check for refund abuse patterns
    const refundedBookings = await db.booking.findMany({
      where: {
        email: bookingData.email,
        paymentStatus: "REFUNDED",
        createdAt: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });

    if (refundedBookings.length >= 2) {
      riskScore += 20;
      reasons.push(
        `Multiple refunded bookings (${refundedBookings.length} in last 90 days)`,
      );
      recommendations.push("Monitor for refund abuse patterns");
    }

    // 10. Check for international or suspicious domains
    const emailDomain = bookingData.email.split("@")[1]?.toLowerCase();
    const suspiciousDomains = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
    ];

    if (emailDomain && suspiciousDomains.includes(emailDomain)) {
      riskScore += 30;
      reasons.push("Suspicious email domain detected");
      recommendations.push("Require additional verification");
    }

    // Determine if booking is fraudulent.
    // Keep this conservative to avoid false positives for normal customers.
    const isFraudulent = riskScore >= 80;

    // Add general recommendations based on risk score
    if (riskScore >= 30) {
      recommendations.push("Consider manual review before confirmation");
    }

    if (riskScore >= 70) {
      recommendations.push(
        "High risk - consider blocking or requiring additional verification",
      );
    }

    return {
      isFraudulent,
      riskScore,
      reasons,
      recommendations,
    };
  } catch (error) {
    console.error("Error in fraud detection:", error);
    return {
      isFraudulent: false,
      riskScore: 0,
      reasons: ["Fraud detection system error"],
      recommendations: ["Manual review recommended"],
    };
  }
}

export async function logFraudAttempt(
  bookingId: string,
  fraudResult: FraudCheckResult,
  bookingData: BookingData,
) {
  try {
    // Log to database or external fraud detection service
    console.log("🚨 Fraud Detection Alert:", {
      bookingId,
      riskScore: fraudResult.riskScore,
      reasons: fraudResult.reasons,
      bookingData: {
        email: bookingData.email,
        fullName: bookingData.fullName,
        amount: bookingData.amountPaid,
        eventType: bookingData.eventTypeId,
      },
    });

    // In production, you might want to:
    // 1. Send alert to admin
    // 2. Log to external fraud detection service
    // 3. Store in fraud detection database
    // 4. Integrate with Stripe Radar or similar service
  } catch (error) {
    console.error("Error logging fraud attempt:", error);
  }
}

export function getFraudRiskLevel(
  riskScore: number,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (riskScore < 20) return "LOW";
  if (riskScore < 50) return "MEDIUM";
  if (riskScore < 80) return "HIGH";
  return "CRITICAL";
}
