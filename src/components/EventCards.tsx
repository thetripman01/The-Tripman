"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Star } from "lucide-react";
import { trackEventTypeSelection } from "@/lib/analytics";
import {
  getTripmanFromPriceLabel,
  getTripmanTierBreakdownLabel,
} from "@/lib/tripman-packages";

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

interface EventCardsProps {
  onEventSelect: (eventType: EventType) => void;
}

export function EventCards({ onEventSelect }: EventCardsProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await fetch("/api/event-types");
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("Failed to fetch event types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventType: EventType) => {
    setSelectedEvent(eventType.id);
    trackEventTypeSelection(eventType.slug);
    onEventSelect(eventType);

    // Scroll to scheduler (after the selection renders)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const schedulerSection = document.getElementById("scheduler");
        if (schedulerSection) {
          schedulerSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  };

  if (loading) {
    return (
      <section
        id="events"
        className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-gray-600">
              Pick your vibe — then choose a date & time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (eventTypes.length === 0) {
    return (
      <section
        id="events"
        className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-gray-600">
              Packages are temporarily unavailable.
            </p>
          </div>
          <div className="mx-auto max-w-2xl bg-white/70 border border-cyan-200 rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-700 mb-3">
              If you&apos;re seeing this, booking packages haven&apos;t been
              configured in the database yet.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              For now, please contact us and we&apos;ll book you manually.
            </p>
            <Button
              onClick={() => {
                const contactSection = document.getElementById("contact");
                contactSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Contact to Book
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="events"
      className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Package
          </h2>
          <p className="text-lg text-gray-600">
            Pick your vibe — then choose a date & time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {eventTypes.map((eventType) => {
            const isPopular = eventType.slug === "tripman-experience-plus";
            const isSelected = selectedEvent === eventType.id;
            const priceLabel =
              getTripmanFromPriceLabel(eventType.slug) ?? "See details";
            const tierLabel = getTripmanTierBreakdownLabel(eventType.slug);

            return (
              <Card
                key={eventType.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? "ring-2 ring-cyan-600 shadow-lg"
                    : isPopular
                      ? "ring-2 ring-cyan-300 shadow-xl hover:scale-[1.03]"
                      : "hover:scale-[1.02]"
                }`}
                onClick={() => handleEventSelect(eventType)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {eventType.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isPopular && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-cyan-600 text-white px-2 py-1 rounded-full">
                          Most popular
                        </span>
                      )}
                      {isSelected && (
                        <Star className="w-5 h-5 text-cyan-600 fill-current" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {eventType.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{eventType.durationMin} minutes</span>
                    </div>

                    <div className="rounded-lg bg-white/70 border border-cyan-200 p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-cyan-700" />
                        <div className="text-xl font-extrabold text-gray-900">
                          {priceLabel}
                        </div>
                      </div>
                      {tierLabel && (
                        <div className="mt-1 text-xs text-gray-600">
                          {tierLabel}
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-4"
                      variant={isSelected || isPopular ? "default" : "outline"}
                    >
                      {isSelected ? "Selected" : "Select & pick a time"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedEvent && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Great choice! Scroll down to select your preferred date and time.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
