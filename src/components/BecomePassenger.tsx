"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
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
      toast.error("We couldn't open the booking form.", {
        description:
          "Please refresh the page or contact us if the issue persists.",
      });
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
      <div className="max-w-3xl mx-auto">
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

        <div className="grid grid-cols-1 gap-6">
          {/* The Tripman Experience — single flat rate */}
          <Card
            className="bg-white border-2 border-cyan-500 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full flex flex-col focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2"
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
                <li>
                  Being featured in our videos isn&apos;t guaranteed — it
                  depends on the energy of the night and a bit of luck.
                </li>
              </ul>
              <div className="mt-6 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 text-center text-gray-900 font-semibold">
                $99 CAD + HST · 1–4 people
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                Video feature not guaranteed. Based on the vibe and luck.
              </p>
              <span className="inline-flex items-center justify-center w-full mt-6 bg-cyan-600 hover:bg-cyan-700 font-semibold transition-colors duration-200 rounded-md py-2 px-4 text-white text-sm">
                Book The Tripman Experience
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
