'use client'

import { useState } from 'react'
import { BookingEmbed } from './BookingEmbed'
import { BookingCalendar } from './BookingCalendar'
import { BookingForm } from './BookingForm'

interface EventType {
  id: string
  slug: string
  name: string
  description: string | null
  durationMin: number
  priceCents: number | null
  isActive: boolean
}

interface SchedulerSwitchProps {
  selectedEvent: EventType | null
}

export function SchedulerSwitch({ selectedEvent }: SchedulerSwitchProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: Date; endsAt: Date } | null>(null)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingData, setBookingData] = useState<Record<string, string | number | boolean> | null>(null)

  const schedulerMode = process.env.NEXT_PUBLIC_SCHEDULER_MODE || 'embed'

  if (!selectedEvent) {
    return (
      <section id="scheduler" className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Select an Event Type
          </h2>
          <p className="text-lg text-gray-600">
            Please choose an event type above to continue with your booking.
          </p>
        </div>
      </section>
    )
  }

  if (bookingComplete && bookingData) {
    return (
      <section id="scheduler" className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-2xl mx-auto text-center">
                      <div className="bg-white border border-green-200 rounded-lg p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Confirmed!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Your {selectedEvent.name} has been successfully booked. You&apos;ll receive a confirmation email shortly.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Event:</strong> {selectedEvent.name}</p>
                  <p><strong>Customer:</strong> {bookingData.fullName}</p>
                  <p><strong>Email:</strong> {bookingData.email}</p>
                  {bookingData.phone && <p><strong>Phone:</strong> {bookingData.phone}</p>}
                  {bookingData.pickup && <p><strong>Pickup:</strong> {bookingData.pickup}</p>}
                  {bookingData.peopleCount && <p><strong>People:</strong> {bookingData.peopleCount}</p>}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
  SUMMARY:${selectedEvent.name} with The Tripman
DTSTART:${bookingData.startsAt}
DTEND:${bookingData.endsAt}
  DESCRIPTION:Your booking with The Tripman
END:VEVENT
END:VCALENDAR`
                    
                    const blob = new Blob([icsContent], { type: 'text/calendar' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'booking.ics'
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add to Calendar
                </button>
                
                <button
                  onClick={() => {
                    const message = `Hi! I have a booking with The Tripman for ${selectedEvent.name}. Can you help me with any questions?`
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Contact via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="scheduler" className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Schedule Your {selectedEvent.name}
          </h2>
          <p className="text-lg text-gray-600">
            Choose your preferred date and time for your booking.
          </p>
        </div>

        {schedulerMode === 'embed' ? (
          <BookingEmbed 
            eventTypeSlug={selectedEvent.slug}
            onBookingComplete={(data) => {
              setBookingData(data)
              setBookingComplete(true)
            }}
          />
        ) : (
          <div className="space-y-8">
            <BookingCalendar
              eventType={selectedEvent}
              onSlotSelect={setSelectedSlot}
            />
            
            {selectedSlot && (
              <BookingForm
                eventType={selectedEvent}
                selectedSlot={selectedSlot}
                onBookingComplete={(data) => {
                  setBookingData(data)
                  setBookingComplete(true)
                }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
