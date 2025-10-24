'use client'

import { useState, useEffect } from 'react'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { EventCards } from '@/components/EventCards'
import { SchedulerSwitch } from '@/components/SchedulerSwitch'
import { Services } from '@/components/Services'
import { Stats } from '@/components/Stats'
import { InstagramVideo } from '@/components/InstagramVideo'
import { Testimonials } from '@/components/Testimonials'
import { FAQ } from '@/components/FAQ'
import { Contact } from '@/components/Contact'
import { CTA } from '@/components/CTA'
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
      <div id="services">
        <Services />
      </div>
      <Stats />
      <InstagramVideo />
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <div id="contact">
        <Contact />
      </div>
      <CTA />
      <Footer />
      <FloatingActionButton />
      <Toaster />
    </div>
  )
}
