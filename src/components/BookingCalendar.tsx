'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import { trackCalendarView } from '@/lib/analytics'

interface EventType {
  id: string
  slug: string
  name: string
  description: string | null
  durationMin: number
  priceCents: number | null
  isActive: boolean
}

interface BookingCalendarProps {
  eventType: EventType
  onSlotSelect: (slot: { startsAt: Date; endsAt: Date }) => void
}

export function BookingCalendar({ eventType, onSlotSelect }: BookingCalendarProps) {
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; datetime: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  useEffect(() => {
    trackCalendarView()
  }, [])

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/availability?date=${date.toISOString().split('T')[0]}&eventType=${eventType.slug}`
      )
      if (response.ok) {
        const slots = await response.json()
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (selectInfo: { start: Date }) => {
    const date = new Date(selectInfo.start)
    setSelectedDate(date)
    setSelectedTime(null)
    fetchAvailableSlots(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    const [hours, minutes] = time.split(':').map(Number)
    const startsAt = new Date(selectedDate!)
    startsAt.setHours(hours, minutes, 0, 0)
    
    const endsAt = new Date(startsAt)
    endsAt.setMinutes(endsAt.getMinutes() + eventType.durationMin)
    
    onSlotSelect({ startsAt, endsAt })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const isSlotAvailable = (time: string) => {
    return availableSlots.some(slot => slot.time === time)
  }

  const isSlotInPast = (time: string) => {
    if (!selectedDate) return false
    const [hours, minutes] = time.split(':').map(Number)
    const slotTime = new Date(selectedDate)
    slotTime.setHours(hours, minutes, 0, 0)
    return slotTime < new Date()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <h3 className="font-semibold mb-4">Choose a Date</h3>
              <div className="border rounded-lg overflow-hidden">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  selectable={true}
                  select={handleDateSelect}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                  }}
                  height="auto"
                  selectConstraint={{
                    start: new Date().toISOString().split('T')[0],
                  }}
                  dayMaxEvents={true}
                />
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Available Times
              </h3>
              
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500">
                  Select a date to see available times
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2">Loading available times...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-4">
                    Available times for {selectedDate.toLocaleDateString()}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 9 // Start at 9 AM
                      const minute = (i % 2) * 30
                      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                      
                      const isAvailable = isSlotAvailable(time)
                      const isPast = isSlotInPast(time)
                      const isSelected = selectedTime === time
                      
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          disabled={!isAvailable || isPast}
                          onClick={() => handleTimeSelect(time)}
                          className="h-10 text-sm"
                        >
                          {formatTime(time)}
                        </Button>
                      )
                    })}
                  </div>
                  
                  {availableSlots.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No available times for this date
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTime && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">
                Selected Time
              </h3>
              <p className="text-blue-700">
                {selectedDate?.toLocaleDateString()} at {formatTime(selectedTime)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Duration: {eventType.durationMin} minutes
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
