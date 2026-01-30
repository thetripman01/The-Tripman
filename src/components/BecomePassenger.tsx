"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Video, TrendingUp } from "lucide-react";
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
    for (const e of props.eventTypes) map.set(e.slug, e);
    return map;
  }, [props.eventTypes]);

  const selectAndScroll = (slug: string) => {
    const eventType = bySlug.get(slug);
    if (!eventType) {
      toast.error("Booking is temporarily unavailable.", {
        description: "Please contact us and we’ll help you book manually.",
      });
      const contact = document.getElementById("contact");
      contact?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    props.onSelectEvent(eventType);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Scroll to the booking area (more predictable than the scheduler anchor).
        const bookingArea = document.getElementById("events");
        if (bookingArea) bookingArea.scrollIntoView({ behavior: "smooth" });
      });
    });
  };

  return (
    <section id="become-passenger" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Become a Passenger
          </h2>
          <div className="max-w-3xl mx-auto text-gray-700 space-y-4">
            <p>
              You&apos;ve seen the videos. You&apos;ve watched strangers turn
              into performers, hype machines, best friends, and sometimes
              therapy clients in the backseat.
            </p>
            <p>Now it&apos;s your turn.</p>
          </div>
          <p className="mt-8 text-lg font-semibold text-gray-900">
            The Choice Is Yours!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tripman Experience */}
          <Card
            className="bg-white border border-green-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col"
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
                <div className="w-10 h-10 rounded-full bg-green-600/10 ring-1 ring-green-600/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  The Tripman Experience
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  • One full hour of pure chaos, music, and unforgettable
                  energy.
                </li>
                <li>• Choose your song, bring your people, set your vibe.</li>
                <li>
                  • Pick-up and drop-off at the same location (so you can party
                  without the stress).
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic mt-5">
                No promises your video will be posted — we only post what
                genuinely hits. If the vibe is fire, it might just make the
                feed.
              </p>
              <div className="mt-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between text-sm text-gray-900 font-semibold">
                <span>1-4 People: $200</span>
                <span>4-7 People: $400</span>
              </div>
              <Button
                className="w-full mt-6 bg-green-600 hover:bg-green-700 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  selectAndScroll("tripman-experience");
                }}
              >
                Book The Tripman Experience
              </Button>
            </CardContent>
          </Card>

          {/* Tripman Experience + */}
          <Card
            className="bg-white border-2 border-green-500 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col"
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
                <div className="w-10 h-10 rounded-full bg-green-600/10 ring-1 ring-green-600/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  The Tripman Experience +
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Everything included in The Tripman Experience.</li>
                <li>
                  • Full recording of your entire ride — every laugh, every
                  song, every moment, saved as a memory you can keep forever.
                </li>
                <li>
                  • Guaranteed feature: Your ride will be polished, edited, and
                  posted on The Tripman accounts.
                </li>
              </ul>
              <div className="mt-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between text-sm text-gray-900 font-semibold">
                <span>1-4 People: $500</span>
                <span>4-7 People: $700</span>
              </div>
              <Button
                className="w-full mt-6 bg-green-600 hover:bg-green-700 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  selectAndScroll("tripman-experience-plus");
                }}
              >
                Book The Tripman Experience +
              </Button>
            </CardContent>
          </Card>

          {/* Promo Ride */}
          <Card
            className="bg-white border border-green-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col"
            onClick={() => selectAndScroll("tripman-promo-ride")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectAndScroll("tripman-promo-ride");
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/10 ring-1 ring-green-600/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  The Tripman <em>Promo</em> Ride
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  • One full hour dedicated to showcasing your business,
                  product, or personal brand in the most unique format online:
                  Tripman Car Karaoke.
                </li>
                <li>
                  • Instant organic reach to millions of viewers across multiple
                  platforms — no paid boosts, no gimmicks.
                </li>
                <li>
                  • A creative, high-energy environment where your brand becomes
                  part of an unforgettable moment.
                </li>
              </ul>
              <p className="text-sm text-gray-700 mt-5">
                Prices are determined after a short discovery process conducted
                by Afes Digital, The Tripman&apos;s representative agency.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                For inquiries:{" "}
                <a
                  className="text-green-700 hover:underline"
                  href="mailto:media@afesdigital.com"
                  onClick={(e) => e.stopPropagation()}
                >
                  media@afesdigital.com
                </a>
              </p>
              <Button
                className="w-full mt-6 bg-green-600 hover:bg-green-700 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = "mailto:media@afesdigital.com";
                }}
              >
                Contact for Inquiries
              </Button>
            </CardContent>
          </Card>
        </div>

        {props.eventTypes.length === 0 && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-600">
              Booking is temporarily unavailable. Please contact us and we’ll
              help you book.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
