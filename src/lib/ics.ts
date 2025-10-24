import { Booking, EventType } from '@prisma/client'

export interface BookingWithEventType extends Booking {
  eventType: EventType
}

export function generateICS(booking: BookingWithEventType): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string) => {
    return text
      .replace(/[\\;,]/g, '\\$&')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }

  const startDate = formatDate(booking.startsAt instanceof Date ? booking.startsAt : new Date(booking.startsAt))
  const endDate = formatDate(booking.endsAt instanceof Date ? booking.endsAt : new Date(booking.endsAt))
  const createdDate = formatDate(booking.createdAt instanceof Date ? booking.createdAt : new Date(booking.createdAt))
  const uid = booking.id

  const summary = escapeText(`${booking.eventType.name} with The Tripman`)
  const description = escapeText(
    `Booking Details:
Event: ${booking.eventType.name}
Customer: ${booking.fullName}
Email: ${booking.email}
${booking.phone ? `Phone: ${booking.phone}` : ''}
${booking.pickup ? `Pickup: ${booking.pickup}` : ''}
${booking.peopleCount ? `People: ${booking.peopleCount}` : ''}
${booking.notes ? `Notes: ${booking.notes}` : ''}
${booking.eventType.priceCents ? `Price: $${(booking.eventType.priceCents / 100).toFixed(2)}` : ''}`
  )

  const location = booking.pickup ? escapeText(booking.pickup) : ''

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Tripman//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${createdDate}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Your TripMan booking is in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean) // Remove empty lines
    .join('\r\n')

  return icsContent
}

export function generateICSForDownload(booking: BookingWithEventType): string {
  return generateICS(booking)
}
