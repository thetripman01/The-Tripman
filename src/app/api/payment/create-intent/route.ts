import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { db } from '@/lib/db'

const createPaymentIntentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().min(1),
  currency: z.string().default('usd'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, amount, currency } = createPaymentIntentSchema.parse(body)

    // Get booking details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { eventType: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency: currency,
      metadata: {
        bookingId: booking.id,
        eventType: booking.eventType.name,
        customerName: booking.fullName,
        customerEmail: booking.email,
      },
      description: `Payment for ${booking.eventType.name} - ${booking.fullName}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
