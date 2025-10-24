import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFreeBusyTimes, generateTimeSlots } from '@/lib/calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const eventTypeSlug = searchParams.get('eventType')

    if (!date || !eventTypeSlug) {
      return NextResponse.json(
        { error: 'Date and eventType are required' },
        { status: 400 }
      )
    }

    // Get event type details
    const eventType = await db.eventType.findUnique({
      where: { slug: eventTypeSlug },
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Parse date and create time range
    const selectedDate = new Date(date)
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get Google Calendar busy times
    let busyTimes: Array<{ start: Date; end: Date }> = []
    try {
      const googleBusyTimes = await getFreeBusyTimes(startOfDay, endOfDay)
      busyTimes = googleBusyTimes.map(period => ({
        start: new Date(period.start || ''),
        end: new Date(period.end || '')
      }))
    } catch (error) {
      console.error('Failed to fetch Google Calendar busy times:', error)
      // Continue without Google Calendar data if not configured
    }

    // Get existing bookings for this date
    const existingBookings = await db.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'CANCELED',
        },
      },
    })

    // Generate all possible time slots
    const bufferMinutes = parseInt(process.env.BUFFER_MINUTES || '15')
    const allSlots = generateTimeSlots(selectedDate, eventType.durationMin, bufferMinutes)

    // Filter out unavailable slots
    const availableSlots = allSlots.filter(slot => {
      const slotEnd = new Date(slot.getTime() + eventType.durationMin * 60000)
      
      // Check if slot is in the past
      if (slot < new Date()) {
        return false
      }

      // Check minimum notice hours
      const minNoticeHours = parseInt(process.env.BOOKING_MIN_NOTICE_HOURS || '24')
      const minNoticeTime = new Date()
      minNoticeTime.setHours(minNoticeTime.getHours() + minNoticeHours)
      if (slot < minNoticeTime) {
        return false
      }

      // Check Google Calendar conflicts
      const hasGoogleConflict = busyTimes.some(busy => {
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        return (slot < busyEnd && slotEnd > busyStart)
      })

      if (hasGoogleConflict) {
        return false
      }

      // Check existing booking conflicts
      const hasBookingConflict = existingBookings.some((booking: { startsAt: Date | string; endsAt: Date | string }) => {
        const bookingStart = new Date(booking.startsAt)
        const bookingEnd = new Date(booking.endsAt)
        return (slot < bookingEnd && slotEnd > bookingStart)
      })

      if (hasBookingConflict) {
        return false
      }

      return true
    })

    // Format slots for response
    const formattedSlots = availableSlots.map(slot => ({
      time: slot.toTimeString().slice(0, 5), // HH:MM format
      datetime: slot.toISOString(),
    }))

    return NextResponse.json(formattedSlots)
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
