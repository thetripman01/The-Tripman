import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        ride: {
          include: {
            locations: {
              orderBy: { timestamp: 'desc' },
              take: 10, // Get last 10 locations
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Format response with all booking details
    return NextResponse.json({
      id: booking.id,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      pickup: booking.pickup,
      peopleCount: booking.peopleCount,
      notes: booking.notes,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      timezone: booking.timezone,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amountPaid: booking.amountPaid,
      paymentIntentId: booking.paymentIntentId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      eventType: {
        id: booking.eventType.id,
        name: booking.eventType.name,
        description: booking.eventType.description,
        durationMin: booking.eventType.durationMin,
        priceCents: booking.eventType.priceCents,
      },
      ride: booking.ride ? {
        id: booking.ride.id,
        driverName: booking.ride.driverName,
        driverPhone: booking.ride.driverPhone,
        vehicleInfo: booking.ride.vehicleInfo,
        status: booking.ride.status,
        startTime: booking.ride.startTime,
        endTime: booking.ride.endTime,
        locations: booking.ride.locations,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
