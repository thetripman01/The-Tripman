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
  onSlotSelect: (slot: {
    startsAt: Date;
    endsAt: Date;
    // Operating timezone the slot was displayed in (tour city or Toronto).
    // Stored on the booking so confirmations/ICS show the right local time.
    timezone: string;
  }) => void;
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
 * appear in the schedule. Ten well-separated hues so a long tour (the Europe
 * run has ~9 stops) gives every city its own colour before the assignment
 * has to wrap.
 *
 * Picked from Tailwind's 300 (bg) / 500 (dot+border) / 800-900 (text) lines
 * so background + text contrast pass WCAG AA without manual tweaking.
 */
const TOUR_COLORS = [
  { bg: "#fda4af", border: "#f43f5e", dot: "#f43f5e", text: "#9f1239" }, // rose
  { bg: "#fdba74", border: "#f97316", dot: "#f97316", text: "#7c2d12" }, // orange
  { bg: "#fcd34d", border: "#f59e0b", dot: "#f59e0b", text: "#78350f" }, // amber
  { bg: "#bef264", border: "#84cc16", dot: "#84cc16", text: "#365314" }, // lime
  { bg: "#6ee7b7", border: "#10b981", dot: "#10b981", text: "#065f46" }, // emerald
  { bg: "#5eead4", border: "#14b8a6", dot: "#14b8a6", text: "#115e59" }, // teal
  { bg: "#7dd3fc", border: "#0ea5e9", dot: "#0ea5e9", text: "#075985" }, // sky
  { bg: "#a5b4fc", border: "#6366f1", dot: "#6366f1", text: "#3730a3" }, // indigo
  { bg: "#c4b5fd", border: "#8b5cf6", dot: "#8b5cf6", text: "#5b21b6" }, // violet
  { bg: "#f9a8d4", border: "#ec4899", dot: "#ec4899", text: "#9d174d" }, // pink
];

type SlotStatus = "available" | "booked" | "pending" | "unavailable";

interface Slot {
  time: string;
  datetime: string;
  status: SlotStatus;
}

// Visual treatment for the non-bookable (informational) slot states. Shown
// greyed so customers can SEE why a time is closed instead of it vanishing.
const STATUS_STYLES: Record<
  Exclude<SlotStatus, "available">,
  { wrap: string; text: string; badge: string; label: string; title: string }
> = {
  booked: {
    wrap: "border-rose-200 bg-rose-50",
    text: "text-rose-400",
    badge: "bg-rose-100 text-rose-700",
    label: "Booked",
    title: "This time is already booked.",
  },
  pending: {
    wrap: "border-amber-200 bg-amber-50",
    text: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "On hold",
    title:
      "Someone is completing payment for this time. It may free up shortly.",
  },
  unavailable: {
    wrap: "border-gray-200 bg-gray-50",
    text: "text-gray-400",
    badge: "bg-gray-100 text-gray-500",
    label: "Unavailable",
    title: "Not available for booking.",
  },
};

/**
 * Format a Date as YYYY-MM-DD from its LOCAL calendar components. Never use
 * `toISOString()` for a calendar day — that's UTC and rolls the day BACK for
 * users east of UTC (a customer in Amsterdam, UTC+2, picking Aug 2 at local
 * midnight becomes Aug 1 in UTC). The booking calendar uses FullCalendar's
 * own TZ-safe `arg.dateStr` for clicks; this helper covers the few places we
 * still derive a day from a Date object.
 */
function localYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BookingCalendar({
  eventType,
  onSlotSelect,
}: BookingCalendarProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  // Cooldown gap (minutes) the server keeps between rides — shown as a note.
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  // Operating timezone for the slots currently shown. Defaults to Toronto and
  // is updated from each /api/availability response — on a tour date the
  // server returns the tour city's timezone (e.g. Europe/Brussels) so the
  // times below render in the correct local time instead of Toronto's.
  const [timeZone, setTimeZone] = useState<string>("America/Toronto");
  const [tzLabel, setTzLabel] = useState<string>("Toronto (ET) — Canada");
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

  const fetchAvailableSlots = async (dateStr: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/availability?date=${dateStr}&eventType=${eventType.slug}`,
      );
      if (response.ok) {
        const data = await response.json();
        // Response shape: { timezone, timezoneLabel, cooldownMinutes, slots }.
        // Tolerate a legacy bare-array shape (stale edge cache after deploy) by
        // treating every entry as available.
        if (Array.isArray(data)) {
          setSlots(
            data.map((s: { time: string; datetime: string }) => ({
              ...s,
              status: "available" as const,
            })),
          );
        } else {
          setSlots(data.slots ?? []);
          if (data.timezone) setTimeZone(data.timezone);
          if (data.timezoneLabel) setTzLabel(data.timezoneLabel);
          if (typeof data.cooldownMinutes === "number")
            setCooldownMinutes(data.cooldownMinutes);
        }
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePick = (dateStr: string) => {
    // Days before today aren't bookable — ignore the click instead of
    // flashing an empty "no times" panel. Past cells are dimmed via
    // .fc-day-past so they already read as inactive.
    if (dateStr < localYmd(new Date())) return;
    // dateStr is FullCalendar's timezone-safe "YYYY-MM-DD" (arg.dateStr).
    // Build the display Date at LOCAL noon — never UTC midnight, which rolls
    // the day back for users east of UTC (the bug where a customer in
    // Amsterdam picking Aug 2 was sent to Aug 1 / the wrong tour city).
    setSelectedDate(new Date(`${dateStr}T12:00:00`));
    setSelectedDatetime(null);
    fetchAvailableSlots(dateStr);
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
    onSlotSelect({ startsAt, endsAt, timezone: timeZone });
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
                Times below are shown in this city&apos;s local time. On tour
                dates this automatically switches to the tour city&apos;s time
                zone.
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
                dateClick={(arg) => handleDatePick(arg.dateStr)}
                headerToolbar={{
                  left: "",
                  center: "title",
                  right: "prev,next",
                }}
                height="auto"
                fixedWeekCount={false}
                showNonCurrentDates={false}
                dayMaxEvents={true}
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
                  {slots.map((slot) => {
                    if (slot.status === "available") {
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
                    }
                    // Booked / on-hold / unavailable: shown for transparency but
                    // not selectable.
                    const s = STATUS_STYLES[slot.status];
                    return (
                      <div
                        key={slot.datetime}
                        aria-disabled="true"
                        title={s.title}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border cursor-not-allowed select-none ${s.wrap}`}
                      >
                        <span className={`font-medium ${s.text}`}>
                          {formatRange(slot.datetime)}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}

                  {slots.length === 0 && (
                    <div className="text-sm text-gray-500 rounded-xl border border-dashed p-6 text-center">
                      No times available for this date.
                    </div>
                  )}
                  {slots.length > 0 &&
                    !slots.some((s) => s.status === "available") && (
                      <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                        Every time is taken for this date — please try another
                        day.
                      </div>
                    )}
                </div>

                {/* Legend: explains the greyed, non-selectable states so
                    customers know WHY a time is closed. */}
                {slots.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      Available
                    </span>
                    {slots.some((s) => s.status === "booked") && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        Booked
                      </span>
                    )}
                    {slots.some((s) => s.status === "pending") && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        On hold
                      </span>
                    )}
                    {slots.some((s) => s.status === "unavailable") && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                        Unavailable
                      </span>
                    )}
                    {cooldownMinutes > 0 && (
                      <span className="w-full text-gray-400">
                        We keep a {cooldownMinutes}-minute gap between rides so
                        every guest gets the full experience.
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
