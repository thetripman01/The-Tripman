import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const updateLocationSchema = z.object({
  rideId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateLocationSchema.parse(body)

    // Verify ride exists
    const ride = await db.ride.findUnique({
      where: { id: validatedData.rideId },
    })

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      )
    }

    // Create new location entry
    const location = await db.location.create({
      data: {
        rideId: validatedData.rideId,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        address: validatedData.address,
        accuracy: validatedData.accuracy,
        speed: validatedData.speed,
        heading: validatedData.heading,
      },
    })

    return NextResponse.json({
      success: true,
      locationId: location.id,
      timestamp: location.timestamp,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid location data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}
