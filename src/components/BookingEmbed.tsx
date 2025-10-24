'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface BookingEmbedProps {
  eventTypeSlug: string
  onBookingComplete: (data: Record<string, string | number | boolean>) => void
}

export function BookingEmbed({ eventTypeSlug, onBookingComplete }: BookingEmbedProps) {
  const embedRef = useRef<HTMLDivElement>(null)
  const calVendor = process.env.NEXT_PUBLIC_CAL_VENDOR || 'calcom'
  const calEventTypeSlug = process.env.NEXT_PUBLIC_CAL_EVENT_TYPE_SLUG || eventTypeSlug

  useEffect(() => {
    // Listen for messages from the embedded calendar
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'booking.completed') {
        onBookingComplete(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onBookingComplete])

  useEffect(() => {
    if (!embedRef.current) return

    // Clear previous content
    embedRef.current.innerHTML = ''

    if (calVendor === 'calcom') {
      // Cal.com embed
      const script = document.createElement('script')
      script.src = 'https://cal.com/embed.js'
      script.async = true
      script.onload = () => {
        if (window.Cal && embedRef.current) {
          window.Cal('init', {
            calLink: calEventTypeSlug,
            elementOrSelector: embedRef.current,
            layout: 'month_view',
            hideEventTypeDetails: false,
            showTimeZoneSelect: true,
          })
        }
      }
      document.head.appendChild(script)
    } else if (calVendor === 'calendly') {
      // Calendly embed
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      script.onload = () => {
        if (window.Calendly && embedRef.current) {
          window.Calendly.initInlineWidget({
            url: `https://calendly.com/${calEventTypeSlug}`,
            parentElement: embedRef.current,
            prefill: {},
            utm: {},
          })
        }
      }
      document.head.appendChild(script)
    }
  }, [calVendor, calEventTypeSlug])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Select Your Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[600px] flex items-center justify-center">
          <div ref={embedRef} className="w-full h-full min-h-[600px]">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading calendar...</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Type declarations for global objects
declare global {
  interface Window {
    Cal?: (command: string, options: Record<string, unknown>) => void
    Calendly?: {
      initInlineWidget: (options: Record<string, unknown>) => void
    }
  }
}
