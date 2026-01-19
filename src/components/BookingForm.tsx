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
import { trackBookingSuccess } from "@/lib/analytics";
import { formatUsd, getTripmanPriceForPeople } from "@/lib/tripman-packages";

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
  pickup: z.string().optional(),
  peopleCount: z.string().optional(),
  notes: z.string().optional(),
  terms: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingForm({
  eventType,
  selectedSlot,
  onBookingComplete,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezone, setTimezone] = useState("");

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
      pickup: "",
      peopleCount: "",
      notes: "",
      terms: false,
    },
  });

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
      if (eventType.slug !== "tripman-promo-ride" && computedPrice == null) {
        throw new Error(
          "Please select a valid group size (1–7 people) for this package.",
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
        const error = await response.json();
        throw new Error(error.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(
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
            {eventType.slug === "tripman-promo-ride" ? (
              <p>
                <strong>Price:</strong> Custom (you’ll be contacted)
              </p>
            ) : (
              <p>
                <strong>Estimated Price:</strong>{" "}
                {(() => {
                  const people = form.watch("peopleCount")
                    ? parseInt(form.watch("peopleCount") as string, 10)
                    : null;
                  const cents = getTripmanPriceForPeople(
                    eventType.slug,
                    people,
                  );
                  return cents ? formatUsd(cents) : "Select group size";
                })()}
              </p>
            )}
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
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
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

            <FormField
              control={form.control}
              name="pickup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pickup Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter pickup address or location"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
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
