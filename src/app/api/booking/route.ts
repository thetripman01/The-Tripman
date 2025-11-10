import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'
import { createGoogleCalendarEvent } from '@/lib/calendar'
import { checkForFraud, logFraudAttempt } from '@/lib/fraud-detection'

const bookingSchema = z.object({
  eventTypeId: z.string(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  pickup: z.string().optional(),
  peopleCount: z.string().optional(),
  notes: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Get event type
    const eventType = await db.eventType.findUnique({
      where: { id: validatedData.eventTypeId },
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Fraud detection check
    const fraudResult = await checkForFraud({
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      eventTypeId: validatedData.eventTypeId,
      startsAt: new Date(validatedData.startsAt),
      endsAt: new Date(validatedData.endsAt),
      amountPaid: eventType.priceCents ?? undefined,
    })

    // Log fraud attempt if detected
    if (fraudResult.isFraudulent || fraudResult.riskScore >= 30) {
      await logFraudAttempt('pending', fraudResult, {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        eventTypeId: validatedData.eventTypeId,
        startsAt: new Date(validatedData.startsAt),
        endsAt: new Date(validatedData.endsAt),
        amountPaid: eventType.priceCents ?? undefined,
      })
    }

    // Block high-risk bookings
    if (fraudResult.isFraudulent) {
      return NextResponse.json(
        { 
          error: 'Booking cannot be processed at this time',
          message: 'Please contact customer service for assistance',
          fraudDetected: true,
        },
        { status: 400 }
      )
    }

    // Check for booking conflicts
    const conflictingBooking = await db.booking.findFirst({
      where: {
        eventTypeId: validatedData.eventTypeId,
        startsAt: {
          lt: new Date(validatedData.endsAt),
        },
        endsAt: {
          gt: new Date(validatedData.startsAt),
        },
        status: {
          not: 'CANCELED',
        },
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        eventTypeId: validatedData.eventTypeId,
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        pickup: validatedData.pickup,
        peopleCount: validatedData.peopleCount ? parseInt(validatedData.peopleCount) : null,
        notes: validatedData.notes,
        startsAt: new Date(validatedData.startsAt),
        endsAt: new Date(validatedData.endsAt),
        timezone: validatedData.timezone,
        status: 'CONFIRMED',
      },
      include: {
        eventType: true,
      },
    })

    // Create Google Calendar event if in custom mode
    let googleEventId: string | null = null
    if (process.env.SCHEDULER_MODE === 'custom') {
      try {
        const eventId = await createGoogleCalendarEvent(booking)
        googleEventId = eventId || null
        
        // Update booking with Google event ID
        await db.booking.update({
          where: { id: booking.id },
          data: { googleEventId },
        })
      } catch (error) {
        console.error('Failed to create Google Calendar event:', error)
        // Continue without Google Calendar integration
      }
    }

    // Send confirmation emails
    try {
      await sendBookingConfirmation(booking)
      await sendAdminNotification(booking)
    } catch (error) {
      console.error('Failed to send confirmation emails:', error)
      // Don't fail the booking if emails fail
    }

    return NextResponse.json({
      id: booking.id,
      message: 'Booking created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
