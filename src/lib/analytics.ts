declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID

export function initializeAnalytics() {
  if (!GA4_ID || typeof window === 'undefined') return

  // Load gtag script if not already loaded
  if (!window.gtag) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA4_ID)
  }
}

export function trackPageView(url: string) {
  if (!GA4_ID || typeof window === 'undefined' || !window.gtag) return

  try {
    window.gtag('config', GA4_ID, {
      page_path: url,
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

export function trackEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (!GA4_ID || typeof window === 'undefined' || !window.gtag) return

  try {
    window.gtag('event', eventName, parameters)
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

export function trackBookingSuccess(eventType: string, bookingId: string) {
  trackEvent('booking_success', {
    event_type: eventType,
    booking_id: bookingId,
  })
}

export function trackEventTypeSelection(eventType: string) {
  trackEvent('event_type_selected', {
    event_type: eventType,
  })
}

export function trackCalendarView() {
  trackEvent('calendar_viewed')
}
