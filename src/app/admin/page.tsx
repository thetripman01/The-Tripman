"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
} from "lucide-react";
import { FraudAlert } from "@/components/FraudAlert";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface EventType {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface Booking {
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
  paymentStatus?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amountPaid?: number | null;
  paymentIntentId?: string | null;
  createdAt: string;
  eventType: {
    name: string;
    durationMin: number;
    priceCents: number | null;
  };
}

interface AvailabilityBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    eventType: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "calendar" | "fraud">(
    "bookings",
  );
  const [cancelReason, setCancelReason] = useState("");
  const [refundRequested, setRefundRequested] = useState(false);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.eventType && filters.eventType !== "all")
        params.append("eventType", filters.eventType);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/admin/bookings?${params}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error("Failed to fetch bookings:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.eventType, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchBlocks = useCallback(async (fromISO: string, toISO: string) => {
    try {
      const params = new URLSearchParams();
      params.set("from", fromISO);
      params.set("to", toISO);
      const res = await fetch(`/api/admin/availability-blocks?${params}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as AvailabilityBlock[];
        setBlocks(data);
      }
    } catch (e) {
      console.error("Failed to fetch availability blocks:", e);
    }
  }, []);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const res = await fetch("/api/event-types");
        if (res.ok) {
          const data = (await res.json()) as EventType[];
          setEventTypes(data.filter((e) => e.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch event types:", error);
      }
    };

    fetchEventTypes();
  }, []);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (response.ok) {
        fetchBookings();
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  const cancelBookingWithOptionalRefund = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: cancelReason || "Cancelled by admin",
          refundRequested,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        alert(data?.message || data?.error || "Failed to cancel booking");
        return;
      }

      alert(data?.message || "Booking cancelled");
      setSelectedBooking(null);
      setCancelReason("");
      setRefundRequested(false);
      fetchBookings();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "CANCELED":
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage bookings and view analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bookings"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Bookings
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "calendar"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Calendar
              </button>
              <button
                onClick={() => setActiveTab("fraud")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "fraud"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Fraud Detection
              </button>
            </nav>
          </div>
        </div>

        {/* Fraud Detection Tab */}
        {activeTab === "fraud" && (
          <div className="mb-6">
            <FraudAlert />
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
              <p className="text-sm text-gray-600">
                Click & drag to create an unavailable block. Click a block to
                delete it.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <FullCalendar
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  height="auto"
                  nowIndicator
                  selectable
                  selectMirror
                  select={async (info) => {
                    const reason =
                      window.prompt(
                        "Reason (optional) for unavailable time:",
                      ) ?? "";
                    try {
                      const res = await fetch(
                        "/api/admin/availability-blocks",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            startsAt: info.start.toISOString(),
                            endsAt: info.end.toISOString(),
                            reason: reason || undefined,
                          }),
                        },
                      );
                      if (res.status === 401) {
                        window.location.href = "/admin/login";
                        return;
                      }
                      if (!res.ok) {
                        alert("Failed to create block");
                        return;
                      }
                      const view = info.view;
                      fetchBlocks(
                        view.activeStart.toISOString(),
                        view.activeEnd.toISOString(),
                      );
                    } catch (e) {
                      console.error(e);
                      alert("Failed to create block");
                    }
                  }}
                  datesSet={(arg) => {
                    // Also refetch bookings for the visible range to keep calendar accurate.
                    const from = arg.startStr.slice(0, 10);
                    const to = arg.endStr.slice(0, 10);
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: from,
                      dateTo: to,
                    }));
                    fetchBlocks(arg.start.toISOString(), arg.end.toISOString());
                  }}
                  events={[
                    // Bookings
                    ...bookings.map((b) => ({
                      id: b.id,
                      title: `${b.eventType.name} • ${b.fullName}`,
                      start: b.startsAt,
                      end: b.endsAt,
                      backgroundColor:
                        b.status === "CANCELED"
                          ? "#ef4444"
                          : b.status === "CONFIRMED"
                            ? "#16a34a"
                            : "#f59e0b",
                      borderColor:
                        b.status === "CANCELED"
                          ? "#ef4444"
                          : b.status === "CONFIRMED"
                            ? "#16a34a"
                            : "#f59e0b",
                    })),
                    // Blocks (as background)
                    ...blocks.map((blk) => ({
                      id: `blk-${blk.id}`,
                      title: blk.reason
                        ? `Unavailable: ${blk.reason}`
                        : "Unavailable",
                      start: blk.startsAt,
                      end: blk.endsAt,
                      display: "background" as const,
                      backgroundColor: "rgba(239, 68, 68, 0.25)",
                    })),
                  ]}
                  eventClick={async (clickInfo) => {
                    const id = clickInfo.event.id;
                    if (!id.startsWith("blk-")) return;
                    const blockId = id.replace("blk-", "");
                    const ok = window.confirm("Delete this unavailable block?");
                    if (!ok) return;
                    try {
                      const res = await fetch(
                        `/api/admin/availability-blocks/${blockId}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        },
                      );
                      if (res.status === 401) {
                        window.location.href = "/admin/login";
                        return;
                      }
                      if (!res.ok) {
                        alert("Failed to delete block");
                        return;
                      }
                      const cal = clickInfo.view.calendar;
                      fetchBlocks(
                        cal.view.activeStart.toISOString(),
                        cal.view.activeEnd.toISOString(),
                      );
                    } catch (e) {
                      console.error(e);
                      alert("Failed to delete block");
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.eventType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, eventType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Event Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Event Types</SelectItem>
                      {eventTypes.map((et) => (
                        <SelectItem key={et.id} value={et.slug}>
                          {et.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="From Date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }))
                    }
                  />

                  <Input
                    type="date"
                    placeholder="To Date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.eventType.name}
                          </h3>
                          <p className="text-gray-600">{booking.fullName}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {booking.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateBookingStatus(booking.id, "CONFIRMED")
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.startsAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(booking.startsAt)} -{" "}
                          {formatTime(booking.endsAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{booking.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {bookings.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">
                      No bookings found matching your filters.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Booking Details</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBooking(null)}
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold">Event Type</label>
                        <p>{selectedBooking.eventType.name}</p>
                      </div>
                      <div>
                        <label className="font-semibold">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedBooking.status)}
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold">Customer Name</label>
                        <p>{selectedBooking.fullName}</p>
                      </div>
                      <div>
                        <label className="font-semibold">Email</label>
                        <p>{selectedBooking.email}</p>
                      </div>
                      {selectedBooking.phone && (
                        <div>
                          <label className="font-semibold">Phone</label>
                          <p>{selectedBooking.phone}</p>
                        </div>
                      )}
                      {selectedBooking.peopleCount && (
                        <div>
                          <label className="font-semibold">
                            Number of People
                          </label>
                          <p>{selectedBooking.peopleCount}</p>
                        </div>
                      )}
                      {selectedBooking.pickup && (
                        <div className="col-span-2">
                          <label className="font-semibold">
                            Pickup Location
                          </label>
                          <p>{selectedBooking.pickup}</p>
                        </div>
                      )}
                      {selectedBooking.notes && (
                        <div className="col-span-2">
                          <label className="font-semibold">Notes</label>
                          <p>{selectedBooking.notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="font-semibold">Date</label>
                        <p>{formatDate(selectedBooking.startsAt)}</p>
                      </div>
                      <div>
                        <label className="font-semibold">Time</label>
                        <p>
                          {formatTime(selectedBooking.startsAt)} -{" "}
                          {formatTime(selectedBooking.endsAt)}
                        </p>
                      </div>
                      <div>
                        <label className="font-semibold">Duration</label>
                        <p>{selectedBooking.eventType.durationMin} minutes</p>
                      </div>
                      {selectedBooking.eventType.priceCents && (
                        <div>
                          <label className="font-semibold">Price</label>
                          <p>
                            $
                            {(
                              selectedBooking.eventType.priceCents / 100
                            ).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Admin actions: cancel + optional refund */}
                    {selectedBooking.status !== "CANCELED" && (
                      <div className="rounded-lg border bg-white p-4 space-y-3">
                        <div className="font-semibold text-gray-900">
                          Admin Actions
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Cancellation reason (optional)
                          </label>
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Reason shown in internal notes / emails"
                          />
                        </div>

                        {selectedBooking.paymentStatus === "COMPLETED" && (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={refundRequested}
                              onChange={(e) =>
                                setRefundRequested(e.target.checked)
                              }
                            />
                            Request refund (if applicable)
                          </label>
                        )}

                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() =>
                            cancelBookingWithOptionalRefund(selectedBooking.id)
                          }
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Booking{" "}
                          {refundRequested ? "& Request Refund" : ""}
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      {selectedBooking.status === "PENDING" && (
                        <>
                          <Button
                            onClick={() =>
                              updateBookingStatus(
                                selectedBooking.id,
                                "CONFIRMED",
                              )
                            }
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Booking
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBooking(null)}
                        className="flex-1"
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
