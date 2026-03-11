"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { SchedulerSwitch } from "@/components/SchedulerSwitch";
import { BecomePassenger } from "@/components/BecomePassenger";
import { Stats } from "@/components/Stats";
import { InstagramVideo } from "@/components/InstagramVideo";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { initializeAnalytics, trackPageView } from "@/lib/analytics";

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

export default function HomePage() {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    // Initialize analytics
    initializeAnalytics();
    trackPageView(window.location.pathname);
  }, []);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const response = await fetch("/api/event-types");
        if (response.ok) {
          const data = (await response.json()) as EventType[];
          setEventTypes(data);
        }
      } catch (error) {
        console.error("Failed to fetch event types:", error);
      }
    };

    fetchEventTypes();
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#become-passenger"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
      >
        Skip to main content
      </a>
      <LoadingScreen />
      <Header />
      <Hero />
      <div id="about">
        <About />
      </div>
      <BecomePassenger
        eventTypes={eventTypes}
        onSelectEvent={(eventType) => setSelectedEvent(eventType)}
      />
      <div id="events">
        <SchedulerSwitch selectedEvent={selectedEvent} />
      </div>
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
    </div>
  );
}
