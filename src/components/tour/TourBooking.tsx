"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { BookingForm } from "@/components/BookingForm";
import { PaymentForm } from "@/components/PaymentForm";
import { getTripmanQuoteForBooking } from "@/lib/tripman-packages";
import { trackCalendarView } from "@/lib/analytics";

export interface TourEventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

export interface TourCity {
  city: string;
  country: string;
  timezone: string | null;
  /** Upcoming tour days for this city, as YYYY-MM-DD. */
  days: string[];
}

type SlotStatus = "available" | "booked" | "pending" | "unavailable";
interface Slot {
  time: string;
  datetime: string;
  status: SlotStatus;
}

// Same greyed treatment the main calendar uses for non-bookable times, so a
// booked slot reads identically here (red) and everywhere else.
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
    title: "Someone is completing payment for this time. It may free up soon.",
  },
  unavailable: {
    wrap: "border-gray-200 bg-gray-50",
    text: "text-gray-400",
    badge: "bg-gray-100 text-gray-500",
    label: "Unavailable",
    title: "Not available for booking.",
  },
};

/** "Sun, Jul 13" from a YYYY-MM-DD (parsed at local noon → TZ-stable). */
function dayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

interface TourBookingProps {
  eventType: TourEventType;
  cities: TourCity[];
}

export function TourBooking({ eventType, cities }: TourBookingProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [timeZone, setTimeZone] = useState("America/Toronto");
  const [tzLabel, setTzLabel] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    startsAt: Date;
    endsAt: Date;
    timezone: string;
  } | null>(null);

  // Payment flow (mirrors SchedulerSwitch on the main site).
  const [bookingComplete, setBookingComplete] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [bookingData, setBookingData] = useState<Record<
    string,
    string | number | boolean
  > | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const timesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackCalendarView();
  }, []);

  useEffect(() => {
    if (selectedSlot && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedSlot]);

  const hasAnyDay = useMemo(
    () => cities.some((c) => c.days.length > 0),
    [cities],
  );

  const fetchSlots = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/availability?date=${dateStr}&eventType=${eventType.slug}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
        if (data.timezone) setTimeZone(data.timezone);
        if (data.timezoneLabel) setTzLabel(data.timezoneLabel);
        if (typeof data.cooldownMinutes === "number")
          setCooldownMinutes(data.cooldownMinutes);
      }
    } catch (err) {
      console.error("Failed to load times:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedDatetime(null);
    setSelectedSlot(null);
    fetchSlots(dateStr);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        timesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      ),
    );
  };

  const handleSlotSelect = (datetime: string) => {
    setSelectedDatetime(datetime);
    const startsAt = new Date(datetime);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + eventType.durationMin);
    setSelectedSlot({ startsAt, endsAt, timezone: timeZone });
  };

  const formatRange = (datetime: string) => {
    const start = new Date(datetime);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + eventType.durationMin);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  };

  // ---- Success / payment view ---------------------------------------------
  if (bookingComplete && bookingData) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-cyan-200 bg-white p-8 shadow-xl text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-600">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {awaitingPayment
              ? "Almost there — one last step"
              : "You're booked!"}
          </h2>
          <p className="mb-6 text-gray-600">
            {awaitingPayment
              ? "Your slot is reserved. Complete payment below to confirm it."
              : "We'll see you soon — a confirmation email is on its way."}
          </p>

          <div className="mb-6 rounded-xl border bg-gray-50 p-4 text-left text-sm text-gray-600">
            <p>
              <strong>Experience:</strong> {eventType.name}
            </p>
            <p>
              <strong>Name:</strong> {bookingData.fullName}
            </p>
            <p>
              <strong>Email:</strong> {bookingData.email}
            </p>
            {bookingData.pickup && (
              <p>
                <strong>Pickup:</strong> {bookingData.pickup}
              </p>
            )}
          </div>

          {awaitingPayment && bookingId && (
            <div className="text-left">
              <PaymentForm
                bookingId={bookingId}
                {...(() => {
                  const people =
                    bookingData.peopleCount != null
                      ? parseInt(String(bookingData.peopleCount), 10)
                      : null;
                  const country =
                    bookingData.pickupCountry != null
                      ? String(bookingData.pickupCountry)
                      : null;
                  const quote = getTripmanQuoteForBooking(
                    eventType.slug,
                    people,
                    country,
                  );
                  return quote
                    ? { amount: quote.totalCents, currency: quote.currency }
                    : {
                        amount: eventType.priceCents ?? 0,
                        currency: "cad" as const,
                      };
                })()}
                onPaymentSuccess={() => setAwaitingPayment(false)}
                onPaymentError={(msg) => toast.error(msg)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Empty state (tour has wrapped) -------------------------------------
  if (!hasAnyDay) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        <p className="font-semibold">No upcoming dates right now.</p>
        <p className="mt-1 text-sm">
          This tour stop has wrapped — follow The Tripman for the next round of
          dates.
        </p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.status === "available").length;

  // ---- Booking flow --------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step 1 — pick a date */}
      <div className="rounded-2xl border border-cyan-200/80 bg-white p-6 shadow-lg animate-fade-in">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
            1
          </span>
          <h3 className="font-semibold text-gray-900">Pick a tour date</h3>
        </div>

        <div className="space-y-5">
          {cities.map((c) =>
            c.days.length === 0 ? null : (
              <div key={`${c.country}-${c.city}`}>
                {/* Always show the city so customers know exactly where the
                    ride is — even single-city countries like Belgium. */}
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                  {c.city}
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.days.map((d) => {
                    const active = selectedDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDatePick(d)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-md"
                            : "border-cyan-200 bg-white text-gray-800 hover:border-cyan-400 hover:bg-cyan-50"
                        }`}
                      >
                        {dayLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Step 2 — pick a time */}
      {selectedDate && (
        <div
          ref={timesRef}
          className="scroll-mt-6 rounded-2xl border border-cyan-200/80 bg-white p-6 shadow-lg animate-fade-in"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
                2
              </span>
              <h3 className="font-semibold text-gray-900">Choose a time</h3>
            </div>
            {tzLabel && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {tzLabel}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
              <span className="ml-2 text-sm text-gray-600">Loading times…</span>
            </div>
          ) : (
            <>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  if (slot.status === "available") {
                    const isSel = selectedDatetime === slot.datetime;
                    return (
                      <button
                        key={slot.datetime}
                        type="button"
                        onClick={() => handleSlotSelect(slot.datetime)}
                        className={`w-full rounded-xl border px-4 py-3 text-left font-semibold transition-all duration-200 ${
                          isSel
                            ? "border-cyan-600 bg-cyan-50 text-gray-900 shadow-md ring-2 ring-cyan-200"
                            : "border-gray-200 text-gray-900 hover:border-cyan-300 hover:bg-cyan-50/50"
                        }`}
                      >
                        {formatRange(slot.datetime)}
                      </button>
                    );
                  }
                  const s = STATUS_STYLES[slot.status];
                  return (
                    <div
                      key={slot.datetime}
                      aria-disabled="true"
                      title={s.title}
                      className={`flex w-full cursor-not-allowed select-none items-center justify-between rounded-xl border px-4 py-3 ${s.wrap}`}
                    >
                      <span className={`font-medium ${s.text}`}>
                        {formatRange(slot.datetime)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.badge}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}

                {slots.length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                    No times available for this date.
                  </div>
                )}
                {slots.length > 0 && availableCount === 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
                    Every time is taken for this date — try another day above.
                  </div>
                )}
              </div>

              {slots.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    Available
                  </span>
                  {slots.some((s) => s.status === "booked") && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      Booked
                    </span>
                  )}
                  {slots.some((s) => s.status === "pending") && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      On hold
                    </span>
                  )}
                  {cooldownMinutes > 0 && (
                    <span className="w-full text-gray-400">
                      We keep a {cooldownMinutes}-minute gap between rides.
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3 — details + payment */}
      {selectedSlot && (
        <div ref={formRef} className="scroll-mt-6 animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
              3
            </span>
            <h3 className="font-semibold text-gray-900">Your details</h3>
          </div>
          <BookingForm
            eventType={eventType}
            selectedSlot={selectedSlot}
            onBookingComplete={(data) => {
              setBookingData(data);
              setBookingId(String(data.id ?? "") || null);
              setAwaitingPayment(true);
              setBookingComplete(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
