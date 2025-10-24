import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    // Get booking with ride and location data
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: true,
        ride: {
          include: {
            locations: {
              orderBy: { timestamp: 'desc' },
              take: 1, // Get latest location
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

    if (!booking.ride) {
      return NextResponse.json({
        status: 'not_started',
        message: 'Ride tracking has not started yet',
      })
    }

    const latestLocation = booking.ride.locations[0]
    
    return NextResponse.json({
      rideId: booking.ride.id,
      status: booking.ride.status,
      driverName: booking.ride.driverName,
      driverPhone: booking.ride.driverPhone,
      vehicleInfo: booking.ride.vehicleInfo,
      startTime: booking.ride.startTime,
      endTime: booking.ride.endTime,
      currentLocation: latestLocation ? {
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        address: latestLocation.address,
        timestamp: latestLocation.timestamp,
        accuracy: latestLocation.accuracy,
        speed: latestLocation.speed,
        heading: latestLocation.heading,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching ride tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ride tracking' },
      { status: 500 }
    )
  }
}
