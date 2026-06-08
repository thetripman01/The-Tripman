"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Globe, Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import { trackCalendarView } from "@/lib/analytics";
import { toBusinessCalendarDay } from "@/lib/timezone";

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

interface ScheduleEntry {
  id: string;
  country: string;
  city: string;
  availableFrom: string | null;
  availableUntil: string | null;
}

/**
 * Visually-distinct palette assigned to tour cities in the order they
 * appear in the schedule. Five tours visible at once is more than we'll
 * ever realistically run — if we exceed it the assignment wraps.
 *
 * Picked from Tailwind's 300/500/700 lines so background + text contrast
 * pass WCAG AA without manual tweaking per color.
 */
const TOUR_COLORS = [
  { bg: "#fdba74", border: "#f97316", dot: "#f97316", text: "#7c2d12" }, // orange
  { bg: "#86efac", border: "#22c55e", dot: "#22c55e", text: "#14532d" }, // green
  { bg: "#f0abfc", border: "#d946ef", dot: "#d946ef", text: "#701a75" }, // fuchsia
  { bg: "#93c5fd", border: "#3b82f6", dot: "#3b82f6", text: "#1e3a8a" }, // blue
  { bg: "#fde047", border: "#eab308", dot: "#eab308", text: "#713f12" }, // yellow
];

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
  const timesRef = useRef<HTMLDivElement>(null);
  // Wraps the FullCalendar so the recolor effect below can scope DOM
  // queries to *our* calendar instance only (no risk of bleeding into
  // any other calendar on the page).
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackCalendarView();
  }, []);

  // ---- Tour-city schedule (for color-coding the calendar) ----
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    // Fire once on mount. Endpoint is cached 2 minutes at the edge so
    // hitting it on every booking flow has negligible cost.
    let cancelled = false;
    fetch("/api/service-locations/schedule")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ScheduleEntry[]) => {
        if (!cancelled) setSchedule(data);
      })
      .catch(() => {
        /* Calendar still works without colors; swallow. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build a map from YYYY-MM-DD → { city, color } so the day cell renderer
  // is O(1) instead of scanning the whole schedule per cell.
  const dayColorMap = useMemo(() => {
    const map = new Map<
      string,
      { city: string; color: (typeof TOUR_COLORS)[number] }
    >();
    schedule.forEach((entry, idx) => {
      const color = TOUR_COLORS[idx % TOUR_COLORS.length];
      const from = entry.availableFrom
        ? toBusinessCalendarDay(entry.availableFrom)
        : null;
      const until = entry.availableUntil
        ? toBusinessCalendarDay(entry.availableUntil)
        : null;
      if (!from || !until) return; // half-open windows aren't paintable on a finite month grid
      // Walk every day in the range (inclusive) and assign the color.
      // Ranges are typically 3–7 days so this is cheap.
      const cur = new Date(from + "T12:00:00Z"); // midday UTC anchor
      const last = new Date(until + "T12:00:00Z");
      while (cur.getTime() <= last.getTime()) {
        const key = cur.toISOString().slice(0, 10);
        map.set(key, { city: entry.city, color });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    });
    return map;
  }, [schedule]);

  // Legend entries, deduped, in calendar-display order.
  const legend = useMemo(() => {
    return schedule.map((entry, idx) => ({
      city: entry.city,
      country: entry.country,
      color: TOUR_COLORS[idx % TOUR_COLORS.length],
    }));
  }, [schedule]);

  // Bumped by FullCalendar's `datesSet` callback (mount + month nav) so
  // the recolor effect below re-runs even when the dayColorMap reference
  // is unchanged. Without this, navigating months would clear colors on
  // the next render.
  const [repaintTick, setRepaintTick] = useState(0);

  // Paint day cells from `dayColorMap`. Runs on:
  //   - dayColorMap change (schedule fetch resolves, admin updates a tour)
  //   - repaintTick bump (FullCalendar re-renders cells for a new month)
  // We read FullCalendar's native `data-date` attribute (always YYYY-MM-DD
  // in the calendar's own timezone semantics) instead of building a key
  // from `arg.date.toISOString()` — that approach broke for users east
  // of UTC where the ISO slice fell on the wrong calendar day.
  useEffect(() => {
    const root = calendarRef.current;
    if (!root) return;
    const cells = root.querySelectorAll<HTMLElement>(".fc-daygrid-day");
    cells.forEach((cell) => {
      const ymd = cell.getAttribute("data-date");
      const frame =
        cell.querySelector<HTMLElement>(".fc-daygrid-day-frame") ?? cell;
      if (!ymd) {
        frame.style.backgroundColor = "";
        frame.style.color = "";
        cell.removeAttribute("title");
        return;
      }
      const hit = dayColorMap.get(ymd);
      if (!hit) {
        // Clear any stale paint (in case schedule changed and this day
        // is no longer in a tour window).
        frame.style.backgroundColor = "";
        frame.style.color = "";
        cell.removeAttribute("title");
        return;
      }
      frame.style.backgroundColor = hit.color.bg;
      frame.style.color = hit.color.text;
      cell.setAttribute("title", hit.city);
    });
  }, [dayColorMap, repaintTick]);

  useEffect(() => {
    if (selectedDate && timesRef.current) {
      timesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

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
    // Scroll to times section after a short delay (for layout to update)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        timesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
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
    <Card className="border-cyan-200/80 shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px]">
          {/* Left: details + timezone */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white">
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
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-cyan-700" />
              <span className="font-semibold text-gray-900">Select a date</span>
            </div>
            <div
              ref={calendarRef}
              className="border border-cyan-100 rounded-xl overflow-hidden shadow-sm"
            >
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
                // datesSet fires whenever the visible range changes (month
                // nav, initial mount, view changes). We use it as a signal
                // to (re)paint cells via the useEffect below, since
                // dayCellDidMount captures the closure once and won't fire
                // again when `dayColorMap` populates after async fetch.
                datesSet={() => {
                  // Bump the repaint version so the effect re-runs even if
                  // dayColorMap reference is stable.
                  setRepaintTick((t) => t + 1);
                }}
              />
            </div>

            {/* Legend: which color = which tour city. Only renders when
                there are upcoming tours; for a plain GTA-only month it
                stays hidden so we don't waste vertical space. */}
            {legend.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {legend.map((entry) => (
                  <div
                    key={`${entry.country}-${entry.city}`}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border"
                      style={{
                        backgroundColor: entry.color.dot,
                        borderColor: entry.color.border,
                      }}
                      aria-hidden
                    />
                    <span className="text-gray-700">
                      {entry.city}
                      {entry.country && entry.country.toLowerCase() !== "canada"
                        ? ` (${entry.country})`
                        : ""}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 bg-white"
                    aria-hidden
                  />
                  <span className="text-gray-700">Toronto / GTA</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: time list - scroll target when date selected */}
          <div ref={timesRef} className="p-6 bg-white scroll-mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700" />
                <span className="font-semibold text-gray-900">Times</span>
              </div>
              <div className="inline-flex rounded-xl border border-cyan-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTimeFormat("12h")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    timeFormat === "12h"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-600 hover:bg-cyan-50"
                  }`}
                >
                  12h
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat("24h")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    timeFormat === "24h"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-600 hover:bg-cyan-50"
                  }`}
                >
                  24h
                </button>
              </div>
            </div>

            {!selectedDate ? (
              <div className="text-sm text-gray-500 rounded-xl border-2 border-dashed border-cyan-100 p-8 text-center bg-cyan-50/30">
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
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-50 shadow-md ring-2 ring-cyan-200"
                            : "border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50"
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          {formatRange(slot.datetime)}
                        </div>
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
