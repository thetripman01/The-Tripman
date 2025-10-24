import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { sendPaymentConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          // Update booking status to confirmed
          await db.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'CONFIRMED',
              // Store payment info
              paymentIntentId: paymentIntent.id,
              paymentStatus: 'COMPLETED',
            },
          })

          // Get updated booking for email
          const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { eventType: true },
          })

          if (booking) {
            // Send payment confirmation email
            await sendPaymentConfirmation(booking, paymentIntent)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          // Update booking status to failed
          await db.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'PENDING',
              paymentStatus: 'FAILED',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
