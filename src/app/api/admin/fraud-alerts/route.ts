import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult
    }

    // For now, we'll simulate fraud alerts based on recent bookings
    // In a real system, you'd have a separate fraud_alerts table
    const recentBookings = await db.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        // Only show bookings that might be suspicious
        OR: [
          { paymentStatus: 'FAILED' },
          { status: 'CANCELED' },
          { amountPaid: { gt: 10000 } }, // High value bookings
        ],
      },
      include: {
        eventType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Simulate fraud alerts for demonstration
    const fraudAlerts = recentBookings.map((booking, index) => ({
      id: `fraud-${booking.id}`,
      bookingId: booking.id,
      riskScore: Math.floor(Math.random() * 80) + 20, // Random score 20-100
      reasons: [
        booking.paymentStatus === 'FAILED' ? 'Payment failed' : null,
        booking.status === 'CANCELED' ? 'Booking cancelled' : null,
        booking.amountPaid && booking.amountPaid > 10000 ? 'High-value booking' : null,
        'Multiple bookings from same email',
        'Suspicious email pattern',
      ].filter(Boolean) as string[],
      recommendations: [
        'Review customer history',
        'Verify payment method',
        'Contact customer for verification',
      ],
      status: 'PENDING' as const,
      createdAt: booking.createdAt.toISOString(),
      booking: {
        fullName: booking.fullName,
        email: booking.email,
        eventType: {
          name: booking.eventType.name,
        },
        amountPaid: booking.amountPaid,
      },
    }))

    return NextResponse.json(fraudAlerts)
  } catch (error) {
    console.error('Error fetching fraud alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fraud alerts' },
      { status: 500 }
    )
  }
}
