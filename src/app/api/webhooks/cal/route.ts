import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendBookingConfirmation, sendAdminNotification, sendCancellationNotification } from '@/lib/email'

// Webhook payload types
interface WebhookPayload {
  event: string
  event_type?: { slug: string }
  eventType?: { slug: string }
  event_type_slug?: string
  invitee?: {
    id: string
    name: string
    email: string
    phone?: string
    start_time: string
    end_time: string
    timezone: string
    questions_and_answers?: string
  }
  attendee?: {
    name: string
    email: string
    phone?: string
  }
  booking?: {
    id: string
    start_time: string
    end_time: string
    timezone: string
    notes?: string
  }
}

// Verify webhook signature (basic implementation)
function verifyWebhookSignature(request: NextRequest): boolean {
  const signature = request.headers.get('x-cal-signature') || 
                   request.headers.get('x-calendly-signature')
  const secret = process.env.CAL_WEBHOOK_SECRET

  if (!signature || !secret) {
    return false
  }

  // This is a simplified verification - in production, use proper crypto verification
  return signature.includes(secret)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify webhook signature
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload: WebhookPayload = JSON.parse(body)
    const eventType = payload.event_type || payload.eventType

    // Handle different webhook events
    switch (payload.event) {
      case 'booking.created':
      case 'invitee.created':
        return await handleBookingCreated(payload, eventType)
      
      case 'booking.canceled':
      case 'invitee.canceled':
        return await handleBookingCanceled(payload)
      
      case 'booking.rescheduled':
      case 'invitee.rescheduled':
        return await handleBookingRescheduled(payload)
      
      default:
        return NextResponse.json(
          { message: 'Event not handled' },
          { status: 200 }
        )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleBookingCreated(payload: WebhookPayload, eventType: WebhookPayload['event_type'] | WebhookPayload['eventType']) {
  try {
    // Extract booking data from webhook payload
    const bookingData = {
      eventTypeSlug: eventType?.slug || payload.event_type_slug || '',
      fullName: payload.invitee?.name || payload.attendee?.name || '',
      email: payload.invitee?.email || payload.attendee?.email || '',
      phone: payload.invitee?.phone || payload.attendee?.phone || '',
      startsAt: payload.invitee?.start_time || payload.booking?.start_time || '',
      endsAt: payload.invitee?.end_time || payload.booking?.end_time || '',
      timezone: payload.invitee?.timezone || payload.booking?.timezone || 'America/Toronto',
      notes: payload.invitee?.questions_and_answers || payload.booking?.notes || '',
    }

    // Find the event type
    const eventTypeRecord = await db.eventType.findUnique({
      where: { slug: bookingData.eventTypeSlug },
    })

    if (!eventTypeRecord) {
      console.error('Event type not found:', bookingData.eventTypeSlug)
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Create or update booking
    const booking = await db.booking.upsert({
      where: {
        // Use a unique identifier from the webhook
        id: payload.booking?.id || payload.invitee?.id || `webhook-${Date.now()}`,
      },
      update: {
        fullName: bookingData.fullName,
        email: bookingData.email,
        phone: bookingData.phone,
        startsAt: new Date(bookingData.startsAt),
        endsAt: new Date(bookingData.endsAt),
        timezone: bookingData.timezone,
        notes: bookingData.notes,
        status: 'CONFIRMED',
      },
      create: {
        eventTypeId: eventTypeRecord.id,
        fullName: bookingData.fullName,
        email: bookingData.email,
        phone: bookingData.phone,
        startsAt: new Date(bookingData.startsAt),
        endsAt: new Date(bookingData.endsAt),
        timezone: bookingData.timezone,
        notes: bookingData.notes,
        status: 'CONFIRMED',
      },
      include: {
        eventType: true,
      },
    })

    // Send confirmation emails
    try {
      await sendBookingConfirmation(booking)
      await sendAdminNotification(booking)
    } catch (error) {
      console.error('Failed to send confirmation emails:', error)
    }

    return NextResponse.json({
      message: 'Booking processed successfully',
      bookingId: booking.id,
    })
  } catch (error) {
    console.error('Error processing booking creation:', error)
    return NextResponse.json(
      { error: 'Failed to process booking' },
      { status: 500 }
    )
  }
}

async function handleBookingCanceled(payload: WebhookPayload) {
  try {
    const bookingId = payload.booking?.id || payload.invitee?.id
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID not found' },
        { status: 400 }
      )
    }

    // Update booking status to canceled
    const booking = await db.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
      include: { eventType: true },
    })

    // Send cancellation notification
    try {
      await sendCancellationNotification(booking)
    } catch (error) {
      console.error('Failed to send cancellation notification:', error)
    }

    return NextResponse.json({
      message: 'Booking canceled successfully',
    })
  } catch (error) {
    console.error('Error processing booking cancellation:', error)
    return NextResponse.json(
      { error: 'Failed to process cancellation' },
      { status: 500 }
    )
  }
}

async function handleBookingRescheduled(payload: WebhookPayload) {
  try {
    const bookingId = payload.booking?.id || payload.invitee?.id
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID not found' },
        { status: 400 }
      )
    }

    // Update booking with new times
    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        startsAt: new Date(payload.invitee?.start_time || payload.booking?.start_time || ''),
        endsAt: new Date(payload.invitee?.end_time || payload.booking?.end_time || ''),
        timezone: payload.invitee?.timezone || payload.booking?.timezone || 'America/Toronto',
      },
      include: { eventType: true },
    })

    // Send reschedule notification
    try {
      await sendBookingConfirmation(booking)
    } catch (error) {
      console.error('Failed to send reschedule notification:', error)
    }

    return NextResponse.json({
      message: 'Booking rescheduled successfully',
    })
  } catch (error) {
    console.error('Error processing booking reschedule:', error)
    return NextResponse.json(
      { error: 'Failed to process reschedule' },
      { status: 500 }
    )
  }
}
