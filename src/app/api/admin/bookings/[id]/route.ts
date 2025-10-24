import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { deleteGoogleCalendarEvent } from '@/lib/calendar'
import { sendCancellationNotification } from '@/lib/email'

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult
    }

    const body = await request.json()
    const { status } = updateBookingSchema.parse(body)
    const { id } = await params

    // Get the booking
    const booking = await db.booking.findUnique({
      where: { id },
      include: { eventType: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update the booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status },
      include: { eventType: true },
    })

    // Handle Google Calendar integration
    if (status === 'CANCELED' && booking.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(booking.googleEventId)
      } catch (error) {
        console.error('Failed to delete Google Calendar event:', error)
      }
    }

    // Send cancellation notification if booking is canceled
    if (status === 'CANCELED') {
      try {
        await sendCancellationNotification(updatedBooking)
      } catch (error) {
        console.error('Failed to send cancellation notification:', error)
      }
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
