"use client";

import { useEffect, useRef, useState } from "react";
import { BookingEmbed } from "./BookingEmbed";
import { BookingCalendar } from "./BookingCalendar";
import { BookingForm } from "./BookingForm";
import { toast } from "sonner";
import { PaymentForm } from "./PaymentForm";
import { getTripmanQuoteForBooking } from "@/lib/tripman-packages";

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

interface SchedulerSwitchProps {
  selectedEvent: EventType | null;
}

export function SchedulerSwitch({ selectedEvent }: SchedulerSwitchProps) {
  const [selectedSlot, setSelectedSlot] = useState<{
    startsAt: Date;
    endsAt: Date;
    // Operating timezone the slot was shown in (tour city or Toronto).
    timezone: string;
  } | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [bookingData, setBookingData] = useState<Record<
    string,
    string | number | boolean
  > | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const bookingFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (awaitingPayment) {
      // Auto-jump to payment so the user doesn't miss the next step.
      paymentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [awaitingPayment]);

  useEffect(() => {
    if (selectedSlot && bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedSlot]);

  // Default to custom (DB-driven) scheduler so production doesn't silently fall back
  // to embed mode when env vars are missing.
  const schedulerMode = process.env.NEXT_PUBLIC_SCHEDULER_MODE || "custom";

  if (!selectedEvent) {
    // Keep an anchor in the DOM for smooth scrolling, without showing an empty/duplicated section.
    return <div id="scheduler" />;
  }

  if (bookingComplete && bookingData) {
    return (
      <section
        id="scheduler"
        className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100"
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white border border-cyan-200 rounded-lg p-8 shadow-lg">
            <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {awaitingPayment ? "Payment Required" : "Booking Confirmed!"}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {awaitingPayment
                ? "Your booking is reserved, but it will only be confirmed after payment."
                : `Your ${selectedEvent.name} has been successfully booked. You’ll receive a confirmation email shortly.`}
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Booking Details
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Event:</strong> {selectedEvent.name}
                  </p>
                  <p>
                    <strong>Customer:</strong> {bookingData.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {bookingData.email}
                  </p>
                  {bookingData.phone && (
                    <p>
                      <strong>Phone:</strong> {bookingData.phone}
                    </p>
                  )}
                  {bookingData.pickup && (
                    <p>
                      <strong>Pickup:</strong> {bookingData.pickup}
                    </p>
                  )}
                  {bookingData.peopleCount && (
                    <p>
                      <strong>People:</strong> {bookingData.peopleCount}
                    </p>
                  )}
                </div>
              </div>

              {awaitingPayment && bookingId && (
                <div ref={paymentRef} className="text-left">
                  <PaymentForm
                    bookingId={bookingId}
                    {...(() => {
                      // The Pay button shows TOTAL = subtotal + tax. Server
                      // re-validates from booking.pickupCountry so this is
                      // display-only.
                      const people =
                        bookingData.peopleCount != null
                          ? parseInt(String(bookingData.peopleCount), 10)
                          : null;
                      const country =
                        bookingData.pickupCountry != null
                          ? String(bookingData.pickupCountry)
                          : null;
                      const quote = getTripmanQuoteForBooking(
                        selectedEvent.slug,
                        people,
                        country,
                      );
                      return quote
                        ? {
                            amount: quote.totalCents,
                            currency: quote.currency,
                          }
                        : {
                            amount: selectedEvent.priceCents ?? 0,
                            currency: "cad" as const,
                          };
                    })()}
                    onPaymentSuccess={(pi) => {
                      setPaymentIntentId(pi);
                      setAwaitingPayment(false);
                      // We rely on the Stripe webhook to mark the booking CONFIRMED and send emails.
                      // This UI is optimistic; customers will receive the confirmation email shortly.
                    }}
                    onPaymentError={(msg) => {
                      toast.error(msg);
                    }}
                  />
                  {paymentIntentId && (
                    <p className="text-xs text-gray-500 mt-3">
                      Payment processed successfully.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
  SUMMARY:${selectedEvent.name} with The Tripman
DTSTART:${bookingData.startsAt}
DTEND:${bookingData.endsAt}
  DESCRIPTION:Your booking with The Tripman
END:VEVENT
END:VCALENDAR`;

                    const blob = new Blob([icsContent], {
                      type: "text/calendar",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "booking.ics";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-cyan-600 text-white px-6 py-3 rounded-xl hover:bg-cyan-700 transition-colors duration-200"
                >
                  Add to Calendar
                </button>

                <button
                  onClick={() => {
                    const message = `Hi! I have a booking with The Tripman for ${selectedEvent.name}. Can you help me with any questions?`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, "_blank");
                  }}
                  className="flex-1 bg-cyan-600 text-white px-6 py-3 rounded-xl hover:bg-cyan-700 transition-colors duration-200"
                >
                  Contact via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="scheduler"
      className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Schedule Your {selectedEvent.name}
          </h2>
          <p className="text-lg text-gray-600">
            Choose a date & time — we’ll show only what’s actually available.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tip: If you don’t see times, check a different date (or we may be
            fully booked).
          </p>
        </div>

        {schedulerMode === "embed" ? (
          <BookingEmbed
            eventTypeSlug={selectedEvent.slug}
            onBookingComplete={(data) => {
              setBookingData(data);
              setBookingComplete(true);
            }}
          />
        ) : (
          <div className="space-y-8">
            <BookingCalendar
              eventType={selectedEvent}
              onSlotSelect={setSelectedSlot}
            />

            {selectedSlot && (
              <div ref={bookingFormRef} className="scroll-mt-8">
                <BookingForm
                  eventType={selectedEvent}
                  selectedSlot={selectedSlot}
                  onBookingComplete={(data) => {
                    setBookingData(data);
                    const id = String(data.id ?? "");
                    setBookingId(id || null);

                    // Always require payment before confirming the booking.
                    setAwaitingPayment(true);
                    setBookingComplete(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
