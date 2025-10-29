import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { sendCancellationNotification } from '@/lib/email'

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
  refundRequested: z.boolean().default(false),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reason, refundRequested } = cancelBookingSchema.parse(body)

    // Get booking details
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

    // Check if booking can be cancelled
    const now = new Date()
    const bookingStart = new Date(booking.startsAt)
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Check cancellation policy
    const cancelPolicyHours = parseInt(process.env.CANCEL_POLICY_HOURS || '12')
    
    if (hoursUntilBooking < cancelPolicyHours) {
      return NextResponse.json(
        { 
          error: 'Booking cannot be cancelled',
          message: `Bookings must be cancelled at least ${cancelPolicyHours} hours in advance`
        },
        { status: 400 }
      )
    }

    // Check if already cancelled
    if (booking.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    // Process refund if requested and payment was made
    let refundAmount = 0
    if (refundRequested && booking.paymentIntentId && booking.paymentStatus === 'COMPLETED') {
      try {
        // Calculate refund amount based on cancellation policy
        let refundPercentage = 1.0 // Full refund by default
        
        if (hoursUntilBooking < 24) {
          refundPercentage = 0.5 // 50% refund if less than 24 hours
        }
        if (hoursUntilBooking < 2) {
          refundPercentage = 0.0 // No refund if less than 2 hours
        }

        const refundAmountCents = Math.floor((booking.amountPaid || 0) * refundPercentage)
        
        if (refundAmountCents > 0) {
          await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
            amount: refundAmountCents,
            reason: 'requested_by_customer',
            metadata: {
              bookingId: booking.id,
              cancellationReason: reason || 'Customer requested',
            },
          })
          
          refundAmount = refundAmountCents
        }
      } catch (error) {
        console.error('Failed to process refund:', error)
        // Continue with cancellation even if refund fails
      }
    }

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: 'CANCELED',
        paymentStatus: refundAmount > 0 ? 'REFUNDED' : booking.paymentStatus,
        notes: booking.notes ? 
          `${booking.notes}\n\nCANCELLED: ${reason || 'Customer requested'}` : 
          `CANCELLED: ${reason || 'Customer requested'}`,
      },
      include: { eventType: true },
    })

    // Send cancellation notification
    try {
      await sendCancellationNotification(updatedBooking)
    } catch (error) {
      console.error('Failed to send cancellation notification:', error)
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      refundAmount: refundAmount / 100, // Convert cents to dollars
      message: refundAmount > 0 ? 
        `Booking cancelled. Refund of $${(refundAmount / 100).toFixed(2)} will be processed.` :
        'Booking cancelled successfully.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid cancellation data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
