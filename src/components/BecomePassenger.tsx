"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Video } from "lucide-react";
import { toast } from "sonner";

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

const BOOKABLE_SLUGS = ["tripman-experience", "tripman-experience-plus"];

export function BecomePassenger(props: {
  eventTypes: EventType[];
  onSelectEvent: (eventType: EventType) => void;
}) {
  const bySlug = useMemo(() => {
    const map = new Map<string, EventType>();
    for (const e of props.eventTypes) map.set(e.slug, map.get(e.slug) ?? e);
    return map;
  }, [props.eventTypes]);

  const selectAndScroll = (slug: string) => {
    const eventType = bySlug.get(slug);
    if (!eventType) {
      toast.error("Booking is temporarily unavailable.", {
        description: "Please contact us and we'll help you book manually.",
      });
      const contact = document.getElementById("contact");
      contact?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    props.onSelectEvent(eventType);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bookingArea = document.getElementById("events");
        if (bookingArea) bookingArea.scrollIntoView({ behavior: "smooth" });
      });
    });
  };

  return (
    <section
      id="become-passenger"
      className="py-24 px-4 bg-white scroll-mt-20"
      aria-labelledby="become-passenger-heading"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="become-passenger-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Become a Passenger
          </h2>
          <p className="max-w-2xl mx-auto text-gray-700 text-lg leading-relaxed">
            You&apos;ve seen the videos. Now it&apos;s your turn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tripman Experience - 70 CAD */}
          <Card
            className="bg-white border border-cyan-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full flex flex-col focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2"
            onClick={() => selectAndScroll("tripman-experience")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectAndScroll("tripman-experience");
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600/10 ring-1 ring-cyan-600/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-cyan-700" aria-hidden />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  The Tripman Experience
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <ul className="text-sm text-gray-700 space-y-2" role="list">
                <li>One full hour of chaos, music, and energy.</li>
                <li>Choose your songs, bring your people (1–4).</li>
                <li>Pick-up and drop-off at the same location.</li>
              </ul>
              <div className="mt-6 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 text-center text-gray-900 font-semibold">
                70 CAD — Journey & party only
              </div>
              <span className="inline-flex items-center justify-center w-full mt-6 bg-cyan-600 hover:bg-cyan-700 font-semibold transition-colors duration-200 rounded-md py-2 px-4 text-white text-sm">
                Book The Tripman Experience
              </span>
            </CardContent>
          </Card>

          {/* Tripman Experience + - 270 CAD */}
          <Card
            className="bg-white border-2 border-cyan-500 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full flex flex-col focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2"
            onClick={() => selectAndScroll("tripman-experience-plus")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectAndScroll("tripman-experience-plus");
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600/10 ring-1 ring-cyan-600/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-cyan-700" aria-hidden />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  The Tripman Experience +
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <ul className="text-sm text-gray-700 space-y-2" role="list">
                <li>Everything in The Tripman Experience.</li>
                <li>Full recording — every moment saved.</li>
                <li>Guaranteed feature: edited & posted on our accounts.</li>
              </ul>
              <div className="mt-6 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 text-center text-gray-900 font-semibold">
                270 CAD — Includes videos shot & shared
              </div>
              <span className="inline-flex items-center justify-center w-full mt-6 bg-cyan-600 hover:bg-cyan-700 font-semibold transition-colors duration-200 rounded-md py-2 px-4 text-white text-sm">
                Book The Tripman Experience +
              </span>
            </CardContent>
          </Card>
        </div>

        {props.eventTypes.filter((e) => BOOKABLE_SLUGS.includes(e.slug))
          .length === 0 && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-600">
              Booking is temporarily unavailable. Please contact us and
              we&apos;ll help you book.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
