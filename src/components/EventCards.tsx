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
import { getTripmanFromPriceLabel } from "@/lib/tripman-packages";

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

    // Scroll to scheduler
    const schedulerSection = document.getElementById("scheduler");
    if (schedulerSection) {
      schedulerSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section
        id="events"
        className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100"
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
        className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Experience
            </h2>
            <p className="text-lg text-gray-600">
              Select from our premium transportation services
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No event types available at the moment.
            </p>
            <p className="text-sm text-gray-500">
              Please check back later or contact us for more information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="events"
      className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Experience
          </h2>
          <p className="text-lg text-gray-600">
            Select from our premium transportation services
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {eventTypes.map((eventType) => (
            <Card
              key={eventType.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedEvent === eventType.id
                  ? "ring-2 ring-green-500 shadow-lg"
                  : "hover:scale-105"
              }`}
              onClick={() => handleEventSelect(eventType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {eventType.name}
                  </CardTitle>
                  {selectedEvent === eventType.id && (
                    <Star className="w-5 h-5 text-green-500 fill-current" />
                  )}
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

                  <div className="flex items-center text-sm font-semibold text-green-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>
                      {getTripmanFromPriceLabel(eventType.slug) ??
                        "See details"}
                    </span>
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant={
                      selectedEvent === eventType.id ? "default" : "outline"
                    }
                  >
                    {selectedEvent === eventType.id ? "Selected" : "Select"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
