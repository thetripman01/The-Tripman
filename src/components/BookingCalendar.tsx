"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Globe, Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import { trackCalendarView } from "@/lib/analytics";

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

interface BookingCalendarProps {
  eventType: EventType;
  onSlotSelect: (slot: { startsAt: Date; endsAt: Date }) => void;
}

export function BookingCalendar({
  eventType,
  onSlotSelect,
}: BookingCalendarProps) {
  const torontoTz = "America/Toronto";
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ time: string; datetime: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [timeZone] = useState<string>(torontoTz);

  useEffect(() => {
    trackCalendarView();
  }, []);

  const tzLabel = useMemo(() => "Toronto (ET) — Canada", []);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/availability?date=${date.toISOString().split("T")[0]}&eventType=${eventType.slug}`,
      );
      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePick = (date: Date) => {
    setSelectedDate(date);
    setSelectedDatetime(null);
    fetchAvailableSlots(date);
  };

  const handleDatetimeSelect = (datetime: string) => {
    setSelectedDatetime(datetime);
    const startsAt = new Date(datetime);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + eventType.durationMin);
    onSlotSelect({ startsAt, endsAt });
  };

  const formatRange = (datetime: string) => {
    const start = new Date(datetime);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + eventType.durationMin);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat === "12h",
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  };

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(selectedDate)
    : "";

  return (
    <Card className="border-cyan-200 shadow-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
          {/* Left: details + timezone */}
          <div className="p-5 border-b lg:border-b-0 lg:border-r bg-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {eventType.name}
                </div>
                <div className="text-sm text-gray-600">
                  {eventType.durationMin} min
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                <Globe className="w-4 h-4 text-cyan-700" />
                Time zone
              </div>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                {tzLabel}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Times below are shown in Toronto time.
              </p>
            </div>
          </div>

          {/* Middle: month grid */}
          <div className="p-5 border-b lg:border-b-0 lg:border-r bg-white">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-cyan-700" />
              <span className="font-semibold text-gray-900">Select a date</span>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable={false}
                dateClick={(arg) => handleDatePick(new Date(arg.date))}
                headerToolbar={{
                  left: "",
                  center: "title",
                  right: "prev,next",
                }}
                height="auto"
                fixedWeekCount={false}
                showNonCurrentDates={false}
                dayMaxEvents={true}
                selectConstraint={{
                  start: new Date().toISOString().split("T")[0],
                }}
              />
            </div>
          </div>

          {/* Right: time list */}
          <div className="p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700" />
                <span className="font-semibold text-gray-900">Times</span>
              </div>
              <div className="inline-flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTimeFormat("12h")}
                  className={`px-3 py-1.5 text-sm ${
                    timeFormat === "12h"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  12h
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat("24h")}
                  className={`px-3 py-1.5 text-sm ${
                    timeFormat === "24h"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  24h
                </button>
              </div>
            </div>

            {!selectedDate ? (
              <div className="text-sm text-gray-500 rounded-xl border border-dashed p-6 text-center">
                Pick a date to see available times.
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                <span className="ml-2 text-sm text-gray-600">
                  Loading times…
                </span>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-3">
                  {selectedDateLabel}
                </div>
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedDatetime === slot.datetime;
                    return (
                      <button
                        key={slot.datetime}
                        type="button"
                        onClick={() => handleDatetimeSelect(slot.datetime)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-50 shadow-sm"
                            : "border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50"
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          {formatRange(slot.datetime)}
                        </div>
                        <div className="text-xs text-gray-500">{timeZone}</div>
                      </button>
                    );
                  })}

                  {availableSlots.length === 0 && (
                    <div className="text-sm text-gray-500 rounded-xl border border-dashed p-6 text-center">
                      No available times for this date.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
