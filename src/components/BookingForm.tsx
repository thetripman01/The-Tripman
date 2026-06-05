"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { trackBookingSuccess } from "@/lib/analytics";
import {
  formatQuoteSubtotal,
  formatQuoteTax,
  formatQuoteTotal,
  getTripmanPriceForPeople,
  getTripmanQuoteForBooking,
} from "@/lib/tripman-packages";
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

interface BookingFormProps {
  eventType: EventType;
  selectedSlot: { startsAt: Date; endsAt: Date };
  onBookingComplete: (data: Record<string, string | number | boolean>) => void;
}

const bookingSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  pickupCountry: z.string().min(1, "Country is required"),
  pickupCity: z.string().min(1, "City is required"),
  pickupAddress: z
    .string()
    .min(3, "Pickup address is required")
    .max(200, "Address is too long"),
  peopleCount: z.string().optional(),
  notes: z.string().optional(),
  terms: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface ServiceLocationOption {
  id: string;
  country: string;
  city: string;
  isDefault: boolean;
}

export function BookingForm({
  eventType,
  selectedSlot,
  onBookingComplete,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezone, setTimezone] = useState("");

  // Service location selectors are populated from /api/service-locations,
  // filtered to what's bookable on the selected ride date. This prevents
  // typos and lets admin geofence the service area in real time.
  const [locations, setLocations] = useState<ServiceLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Get user's timezone
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      pickupCountry: "",
      pickupCity: "",
      pickupAddress: "",
      peopleCount: "",
      notes: "",
      terms: false,
    },
  });

  // Fetch available locations for the selected booking date.
  useEffect(() => {
    let cancelled = false;
    const fetchLocations = async () => {
      try {
        setLocationsLoading(true);
        setLocationsError(null);

        // Send the BUSINESS-TZ calendar day, not UTC, so a slot at 11pm EDT
        // on Jun 11 doesn't get treated as Jun 12 (which would incorrectly
        // unlock the next day's tour-window cities). See lib/timezone.ts.
        const dateParam = toBusinessCalendarDay(selectedSlot.startsAt);
        const res = await fetch(`/api/service-locations?date=${dateParam}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to load service locations");
        }
        const data = (await res.json()) as ServiceLocationOption[];
        if (cancelled) return;

        setLocations(data);

        // Auto-select sensible defaults: prefer the country/city flagged
        // isDefault; fall back to Canada/Toronto if present; otherwise
        // first option. Only apply if user hasn't already chosen.
        const currentCountry = form.getValues("pickupCountry");
        const currentCity = form.getValues("pickupCity");
        if (!currentCountry && data.length > 0) {
          const defaultRow =
            data.find(
              (l) => l.isDefault && l.country.toLowerCase() === "canada",
            ) ??
            data.find((l) => l.isDefault) ??
            data.find(
              (l) =>
                l.country.toLowerCase() === "canada" &&
                l.city.toLowerCase() === "toronto",
            ) ??
            data[0];
          form.setValue("pickupCountry", defaultRow.country);
          if (!currentCity) form.setValue("pickupCity", defaultRow.city);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch service locations:", err);
        setLocationsError(
          "Could not load service areas. Please refresh or contact us.",
        );
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    };
    fetchLocations();
    return () => {
      cancelled = true;
    };
    // selectedSlot.startsAt drives which date's availability we fetch.
    // Intentionally omit `form` (stable instance) to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot.startsAt]);

  // Derive country/city options from the fetched locations.
  const countries = Array.from(new Set(locations.map((l) => l.country))).sort();
  const selectedCountry = form.watch("pickupCountry");
  const citiesForCountry = locations
    .filter((l) => l.country === selectedCountry)
    .map((l) => l.city);

  // When the country changes, ensure the city stays consistent.
  useEffect(() => {
    if (!selectedCountry) return;
    const currentCity = form.getValues("pickupCity");
    if (currentCity && !citiesForCountry.includes(currentCity)) {
      // Pick first available city for the new country.
      form.setValue("pickupCity", citiesForCountry[0] ?? "");
    } else if (!currentCity && citiesForCountry.length > 0) {
      form.setValue("pickupCity", citiesForCountry[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, locations]);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      const peopleCountNum = data.peopleCount
        ? parseInt(data.peopleCount, 10)
        : null;
      const computedPrice = getTripmanPriceForPeople(
        eventType.slug,
        peopleCountNum,
      );
      if (computedPrice == null) {
        throw new Error(
          "Please select a valid group size (1–4 people) for this package.",
        );
      }

      // Defense in depth: confirm the chosen country/city is still in the
      // list we fetched. The server re-validates against the DB regardless,
      // but this catches a stale-tab race before submitting.
      const stillValid = locations.some(
        (l) => l.country === data.pickupCountry && l.city === data.pickupCity,
      );
      if (!stillValid) {
        throw new Error(
          "Selected pickup city is no longer available for this date. Please re-select.",
        );
      }

      const bookingData = {
        ...data,
        eventTypeId: eventType.id,
        startsAt: selectedSlot.startsAt.toISOString(),
        endsAt: selectedSlot.endsAt.toISOString(),
        timezone,
      };

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        trackBookingSuccess(eventType.slug, result.id);
        onBookingComplete({
          ...data,
          startsAt: selectedSlot.startsAt.toISOString(),
          endsAt: selectedSlot.endsAt.toISOString(),
          id: result.id,
        });
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string; error?: string }).message ||
            (error as { message?: string; error?: string }).error ||
            "Failed to create booking",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Complete Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Event:</strong> {eventType.name}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedSlot.startsAt.toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(selectedSlot.startsAt)} -{" "}
              {formatTime(selectedSlot.endsAt)}
            </p>
            <p>
              <strong>Duration:</strong> {eventType.durationMin} minutes
            </p>
            {(() => {
              const people = form.watch("peopleCount")
                ? parseInt(form.watch("peopleCount") as string, 10)
                : null;
              // Pricing varies by pickup country: Canada = 99 CAD + HST,
              // USA = 110 USD + sales tax. Both at 13%.
              const country = form.watch("pickupCountry");
              const quote = getTripmanQuoteForBooking(
                eventType.slug,
                people,
                country,
              );
              if (!quote) {
                return (
                  <p>
                    <strong>Price:</strong> Select group size
                  </p>
                );
              }
              return (
                <div className="mt-1 border-t border-gray-200 pt-2 space-y-0.5">
                  <p>
                    <span className="text-gray-600">Subtotal:</span>{" "}
                    {formatQuoteSubtotal(quote)}
                  </p>
                  <p>
                    <span className="text-gray-600">Tax:</span>{" "}
                    {formatQuoteTax(quote)}
                  </p>
                  <p className="font-semibold text-gray-900">
                    Total: {formatQuoteTotal(quote)}
                  </p>
                </div>
              );
            })()}
            <p className="text-xs text-gray-500 mt-1">
              Video feature is not guaranteed — based on the energy and a bit of
              luck.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peopleCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of People
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of people" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "person" : "people"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pickup location: structured Country + City selectors plus a
                free-text street address. The selectors are filtered by the
                ride date so customers can only pick currently-serviced cities. */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                <MapPin className="w-4 h-4 text-cyan-600" aria-hidden />
                Pickup Location *
              </div>

              {locationsError ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                >
                  {locationsError}
                </div>
              ) : locationsLoading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  Loading available service areas…
                </div>
              ) : locations.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  We&apos;re not currently servicing any pickup areas for this
                  date. Please pick a different date or{" "}
                  <a href="#contact" className="underline font-medium">
                    contact us
                  </a>
                  .
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pickupCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pickupCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={citiesForCountry.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {citiesForCountry.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street address *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 75 Laurelcrest Street"
                            autoComplete="street-address"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          The address inside the selected city where we should
                          pick you up.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Special Requests or Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests or additional information..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy"
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </a>
                      *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold"
              disabled={
                isSubmitting ||
                locationsLoading ||
                locations.length === 0 ||
                Boolean(locationsError)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
