"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RideTracking } from "@/components/RideTracking";
import { PaymentForm } from "@/components/PaymentForm";
import { getTripmanPriceForPeople } from "@/lib/tripman-packages";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  CreditCard,
  AlertTriangle,
  Navigation,
} from "lucide-react";

interface BookingDetails {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  pickup: string | null;
  peopleCount: number | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amountPaid: number | null;
  createdAt: string;
  updatedAt: string;
  eventType: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    durationMin: number;
    priceCents: number | null;
  };
  ride: {
    id: string;
  } | null;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const holdMinutes = Number(
    process.env.NEXT_PUBLIC_PAYMENT_HOLD_MINUTES || 15,
  );

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!emailVerified) return;

        const url = new URL(
          `/api/booking/${bookingId}`,
          window.location.origin,
        );
        url.searchParams.set("email", accessEmail);

        const response = await fetch(url.toString());

        if (!response.ok) {
          if (response.status === 404) {
            setError("Booking not found");
            return;
          }
          if (response.status === 401 || response.status === 403) {
            setError("Please enter the email used for this booking.");
            return;
          }
          throw new Error("Failed to fetch booking");
        }

        const data = await response.json();
        setBooking(data);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, emailVerified, accessEmail]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Pending", color: "bg-yellow-500" },
      CONFIRMED: { label: "Confirmed", color: "bg-green-500" },
      CANCELED: { label: "Cancelled", color: "bg-red-500" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Payment Pending", color: "bg-yellow-500" },
      COMPLETED: { label: "Paid", color: "bg-green-500" },
      FAILED: { label: "Payment Failed", color: "bg-red-500" },
      REFUNDED: { label: "Refunded", color: "bg-blue-500" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  // Customer self-service cancellations are disabled for launch.

  const isPaymentHoldExpired = () => {
    if (!booking) return false;
    if (booking.status !== "PENDING") return false;
    const createdAt = new Date(booking.createdAt);
    return Date.now() > createdAt.getTime() + holdMinutes * 60 * 1000;
  };

  if (loading) {
    if (!emailVerified) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>View your booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                For privacy, please verify the email used for this booking.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setEmailVerified(true);
                }}
                disabled={!accessEmail.trim()}
              >
                Continue
              </Button>
              {error && <div className="text-sm text-red-600">{error}</div>}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600">
            {error || "The booking you are looking for does not exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600 mt-2">Booking ID: {booking.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {booking.eventType.name}
                    </h3>
                    {booking.eventType.description && (
                      <p className="text-gray-600">
                        {booking.eventType.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(booking.startsAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Time:</span>
                      <span>
                        {formatTime(booking.startsAt)} -{" "}
                        {formatTime(booking.endsAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Duration:</span>
                      <span>{booking.eventType.durationMin} minutes</span>
                    </div>

                    {booking.eventType.priceCents && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Price:</span>
                        <span>
                          ${(booking.eventType.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{booking.fullName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span>{booking.email}</span>
                  </div>

                  {booking.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span>{booking.phone}</span>
                    </div>
                  )}

                  {booking.pickup && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Pickup:</span>
                      <span>{booking.pickup}</span>
                    </div>
                  )}

                  {booking.peopleCount && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">People:</span>
                      <span>{booking.peopleCount}</span>
                    </div>
                  )}

                  {booking.notes && (
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="text-gray-600 mt-1">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Tracking */}
            {booking.ride && (
              <RideTracking bookingId={booking.id} email={accessEmail} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(booking.status)}</div>
                </div>

                <div>
                  <span className="font-medium">Payment:</span>
                  <div className="mt-1">
                    {getPaymentStatusBadge(booking.paymentStatus)}
                  </div>
                </div>

                {booking.amountPaid && (
                  <div>
                    <span className="font-medium">Amount Paid:</span>
                    <span className="ml-2 font-semibold">
                      ${(booking.amountPaid / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pay Now */}
            {booking.status === "PENDING" &&
              booking.paymentStatus !== "COMPLETED" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pay Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isPaymentHoldExpired() ? (
                      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                        This booking hold has expired. Please make a new
                        booking.
                      </div>
                    ) : (
                      <PaymentForm
                        bookingId={booking.id}
                        amount={
                          getTripmanPriceForPeople(
                            booking.eventType.slug,
                            booking.peopleCount,
                          ) ??
                          booking.eventType.priceCents ??
                          0
                        }
                        currency="cad"
                        onPaymentSuccess={() => {
                          // Webhook will confirm; refresh to show updated status.
                          window.location.reload();
                        }}
                        onPaymentError={(msg) => alert(msg)}
                      />
                    )}
                    <p className="text-xs text-gray-500">
                      If you refresh the page, you can still complete payment
                      here (as long as the hold hasn&apos;t expired).
                    </p>
                  </CardContent>
                </Card>
              )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Changes/cancellations are not available online right now.
                  Please contact The Tripman directly for help.
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    If you have any questions or need assistance, please contact
                    us:
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-gray-600">
                      {process.env.NEXT_PUBLIC_PHONE_NUMBER ||
                        "+1 (647) 459-4188"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a
                      href="mailto:thetripman01@gmail.com"
                      className="text-green-600 hover:underline"
                    >
                      thetripman01@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
