'use client'

import { useState, useEffect } from 'react'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { EventCards } from '@/components/EventCards'
import { SchedulerSwitch } from '@/components/SchedulerSwitch'
import { BecomePassenger } from '@/components/BecomePassenger'
import { Stats } from '@/components/Stats'
import { InstagramVideo } from '@/components/InstagramVideo'
import { FAQ } from '@/components/FAQ'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Toaster } from '@/components/ui/sonner'
import { initializeAnalytics, trackPageView } from '@/lib/analytics'

interface EventType {
  id: string
  slug: string
  name: string
  description: string | null
  durationMin: number
  priceCents: number | null
  isActive: boolean
}

export default function HomePage() {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)

  useEffect(() => {
    // Initialize analytics
    initializeAnalytics()
    trackPageView(window.location.pathname)
  }, [])

  return (
    <div className="min-h-screen">
      <LoadingScreen />
      <Header />
      <Hero />
      <div id="about">
        <About />
      </div>
      <div id="events">
        <EventCards onEventSelect={setSelectedEvent} />
        <SchedulerSwitch selectedEvent={selectedEvent} />
      </div>
      <BecomePassenger />
      <Stats />
      <InstagramVideo />
      <div id="faq">
        <FAQ />
      </div>
      <div id="contact">
        <Contact />
      </div>
      <Footer />
      <FloatingActionButton />
      <Toaster />
    </div>
  )
}
