"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
  CalendarPlus,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  MapPin,
  Shield,
  Settings,
} from "lucide-react";
import { FraudAlert } from "@/components/FraudAlert";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import { toBusinessCalendarDay } from "@/lib/timezone";
import { inferTimezone } from "@/lib/geo";
import {
  formatBookingDate,
  formatBookingTime,
  formatBookingTimeRange,
  toBookingWallClock,
} from "@/lib/format-datetime";
import { googleCalendarEventUrl } from "@/lib/google-calendar";

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
  pickupCountry: string | null;
  pickupCity: string | null;
  pickupAddress: string | null;
  peopleCount: number | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  paymentStatus?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amountPaid?: number | null;
  subtotalCents?: number | null;
  taxCents?: number | null;
  taxRate?: number | null;
  currency?: string | null;
  paymentIntentId?: string | null;
  createdAt: string;
  isExpiredHold?: boolean;
  eventType: {
    name: string;
    durationMin: number;
    priceCents: number | null;
    slug?: string;
  };
}

interface AvailabilityBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

interface AvailabilityRule {
  id: string;
  timezone: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdAt: string;
}

interface ServiceLocation {
  id: string;
  country: string;
  city: string;
  isActive: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  isDefault: boolean;
  exclusive: boolean;
  // Explicit IANA timezone override; null => auto-derived from country/city.
  timezone: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// Format helpers for <input type="date"> / <input type="time">. Module-scope
// so they don't need to land in useCallback deps.
const pad2 = (n: number) => String(n).padStart(2, "0");
const localTimeValue = (d: Date) =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const localDateValue = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  // Default the Bookings filter to a rolling 30-day window starting today
  // so admin sees the next month at a glance without picking dates first.
  // Admin can still override the inputs manually to look further ahead /
  // backward.
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    return {
      status: "all",
      eventType: "all",
      dateFrom: ymd(today),
      dateTo: ymd(in30Days),
    };
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<
    "bookings" | "calendar" | "fraud" | "settings"
  >("bookings");
  const [cancelReason, setCancelReason] = useState("");
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [showCanceledBookings, setShowCanceledBookings] = useState(false);
  const [showExpiredPending, setShowExpiredPending] = useState(false);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [ruleForm, setRuleForm] = useState({
    mode: "available" as "available" | "unavailable",
    startDate: "",
    endDate: "",
    startTime: "19:00",
    endTime: "03:00",
    timezone: "America/Toronto",
    note: "",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  // Service locations (admin-managed pickup countries/cities)
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>(
    [],
  );
  const [locationForm, setLocationForm] = useState({
    country: "Canada",
    city: "",
    isActive: true,
    availableFrom: "",
    availableUntil: "",
    isDefault: false,
    exclusive: false,
    // Blank => auto-derive timezone from country/city (lib/geo.ts).
    timezone: "",
    note: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);
  // ID of the row currently being inline-edited (null = no row in edit mode).
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  // Buffer for the row being edited (changes here don't touch the live list
  // until the user clicks Save).
  const [editLocationForm, setEditLocationForm] = useState({
    isActive: true,
    availableFrom: "",
    availableUntil: "",
    isDefault: false,
    exclusive: false,
    timezone: "",
    note: "",
  });
  const [savingEditLocation, setSavingEditLocation] = useState(false);

  // Booking edit (date/time/location) for an admin user reviewing a booking.
  // Null = not in edit mode. We track the booking id so the form is bound
  // to the right row even if the user closes/reopens the modal.
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editBookingForm, setEditBookingForm] = useState({
    dateLocal: "", // YYYY-MM-DD in browser local TZ (we re-interpret as business TZ on save)
    startTimeLocal: "", // HH:MM
    endTimeLocal: "", // HH:MM
    pickupCountry: "",
    pickupCity: "",
    pickupAddress: "",
  });
  const [savingBookingEdit, setSavingBookingEdit] = useState(false);
  // Service locations dropdown options for the edit form (date-scoped).
  const [editBookingLocations, setEditBookingLocations] = useState<
    { country: string; city: string }[]
  >([]);

  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  // Headline counts for the dashboard header (confirmed bookings only).
  const [stats, setStats] = useState<{
    total: number;
    thisMonth: number;
    upcoming: number;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (res.ok) {
        setStats(
          (await res.json()) as {
            total: number;
            thisMonth: number;
            upcoming: number;
          },
        );
      }
    } catch (e) {
      console.error("Failed to fetch booking stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const days = useMemo(
    () => [
      { v: 0, label: "Sun" },
      { v: 1, label: "Mon" },
      { v: 2, label: "Tue" },
      { v: 3, label: "Wed" },
      { v: 4, label: "Thu" },
      { v: 5, label: "Fri" },
      { v: 6, label: "Sat" },
    ],
    [],
  );

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.eventType && filters.eventType !== "all")
        params.append("eventType", filters.eventType);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (showPastBookings) params.append("includePast", "1");
      if (showCanceledBookings) params.append("includeCanceled", "1");
      if (showExpiredPending) params.append("includeExpiredPending", "1");

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
  }, [
    filters.status,
    filters.eventType,
    filters.dateFrom,
    filters.dateTo,
    showPastBookings,
    showCanceledBookings,
    showExpiredPending,
  ]);

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

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/availability-rules", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as AvailabilityRule[];
        setRules(data);
      }
    } catch (e) {
      console.error("Failed to fetch availability rules:", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") fetchRules();
  }, [activeTab, fetchRules]);

  const fetchServiceLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/service-locations", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as ServiceLocation[];
        setServiceLocations(data);
      }
    } catch (e) {
      console.error("Failed to fetch service locations:", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") fetchServiceLocations();
  }, [activeTab, fetchServiceLocations]);

  const createServiceLocation = useCallback(async () => {
    if (!locationForm.country.trim() || !locationForm.city.trim()) {
      toast.error("Country and city are required.");
      return;
    }
    if (
      locationForm.availableFrom &&
      locationForm.availableUntil &&
      locationForm.availableUntil < locationForm.availableFrom
    ) {
      toast.error("End date must be on or after start date.");
      return;
    }
    setSavingLocation(true);
    try {
      const res = await fetch("/api/admin/service-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          country: locationForm.country.trim(),
          city: locationForm.city.trim(),
          isActive: locationForm.isActive,
          availableFrom: locationForm.availableFrom || undefined,
          availableUntil: locationForm.availableUntil || undefined,
          isDefault: locationForm.isDefault,
          exclusive: locationForm.exclusive,
          timezone: locationForm.timezone.trim() || undefined,
          note: locationForm.note.trim() || undefined,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        toast.error(payload.error || "Failed to create location.");
        return;
      }
      toast.success("Location added.");
      setLocationForm({
        country: "Canada",
        city: "",
        isActive: true,
        availableFrom: "",
        availableUntil: "",
        isDefault: false,
        exclusive: false,
        timezone: "",
        note: "",
      });
      fetchServiceLocations();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create location.");
    } finally {
      setSavingLocation(false);
    }
  }, [locationForm, fetchServiceLocations]);

  const toggleLocationActive = useCallback(
    async (loc: ServiceLocation) => {
      try {
        const res = await fetch(`/api/admin/service-locations/${loc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !loc.isActive }),
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(payload.error || "Failed to update location.");
          return;
        }
        fetchServiceLocations();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update location.");
      }
    },
    [fetchServiceLocations],
  );

  const startEditLocation = useCallback((loc: ServiceLocation) => {
    setEditingLocationId(loc.id);
    setEditLocationForm({
      isActive: loc.isActive,
      // CRITICAL: stored timestamps are end-of-day BUSINESS TZ (e.g. Jun 15
      // EDT 23:59:59 = Jun 16 03:59:59 UTC). Slicing the UTC ISO would
      // show "Jun 16" — wrong by one day. Convert back to business-TZ
      // calendar day so the date input pre-fills with what admin entered.
      availableFrom: loc.availableFrom
        ? toBusinessCalendarDay(loc.availableFrom)
        : "",
      availableUntil: loc.availableUntil
        ? toBusinessCalendarDay(loc.availableUntil)
        : "",
      isDefault: loc.isDefault,
      exclusive: loc.exclusive,
      timezone: loc.timezone ?? "",
      note: loc.note ?? "",
    });
  }, []);

  const cancelEditLocation = useCallback(() => {
    setEditingLocationId(null);
  }, []);

  const saveEditLocation = useCallback(
    async (locId: string) => {
      if (
        editLocationForm.availableFrom &&
        editLocationForm.availableUntil &&
        editLocationForm.availableUntil < editLocationForm.availableFrom
      ) {
        toast.error("End date must be on or after start date.");
        return;
      }
      setSavingEditLocation(true);
      try {
        const res = await fetch(`/api/admin/service-locations/${locId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            isActive: editLocationForm.isActive,
            availableFrom: editLocationForm.availableFrom || null,
            availableUntil: editLocationForm.availableUntil || null,
            isDefault: editLocationForm.isDefault,
            exclusive: editLocationForm.exclusive,
            timezone: editLocationForm.timezone.trim() || null,
            note: editLocationForm.note.trim() || null,
          }),
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          toast.error(payload.error || "Failed to update location.");
          return;
        }
        toast.success("Location updated.");
        setEditingLocationId(null);
        fetchServiceLocations();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update location.");
      } finally {
        setSavingEditLocation(false);
      }
    },
    [editLocationForm, fetchServiceLocations],
  );

  const deleteServiceLocation = useCallback(
    async (loc: ServiceLocation) => {
      const ok = window.confirm(
        `Delete ${loc.city}, ${loc.country}? This cannot be undone.`,
      );
      if (!ok) return;
      try {
        const res = await fetch(`/api/admin/service-locations/${loc.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(payload.error || "Failed to delete location.");
          return;
        }
        toast.success("Location deleted.");
        fetchServiceLocations();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete location.");
      }
    },
    [fetchServiceLocations],
  );

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/account", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await res.json()) as { admin?: { email?: string } | null };
      setAccountEmail(data.admin?.email || null);
    } catch (e) {
      console.error("Failed to fetch admin account:", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "settings") fetchAccount();
  }, [activeTab, fetchAccount]);

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
        fetchStats();
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        toast.error(payload.error || "Failed to delete booking");
        return;
      }
      toast.success(payload.message || "Booking deleted");
      setSelectedBooking(null);
      fetchBookings();
      fetchStats();
    } catch (e) {
      console.error("Failed to delete booking:", e);
      toast.error("Failed to delete booking");
    }
  };

  // ----- Booking edit (date/time/location) -----

  const fetchLocationsForBookingEdit = useCallback(
    async (dateLocal: string) => {
      if (!dateLocal) {
        setEditBookingLocations([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/service-locations?date=${encodeURIComponent(dateLocal)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setEditBookingLocations([]);
          return;
        }
        const data = (await res.json()) as {
          country: string;
          city: string;
        }[];
        setEditBookingLocations(data);
      } catch (e) {
        console.error("Failed to load service locations for edit:", e);
        setEditBookingLocations([]);
      }
    },
    [],
  );

  const startEditBooking = useCallback(
    (b: Booking) => {
      setEditingBookingId(b.id);
      const startDate = new Date(b.startsAt);
      const endDate = new Date(b.endsAt);
      const dateLocal = localDateValue(startDate);
      setEditBookingForm({
        dateLocal,
        startTimeLocal: localTimeValue(startDate),
        endTimeLocal: localTimeValue(endDate),
        pickupCountry: b.pickupCountry ?? "",
        pickupCity: b.pickupCity ?? "",
        pickupAddress: b.pickupAddress ?? b.pickup ?? "",
      });
      fetchLocationsForBookingEdit(dateLocal);
    },
    [fetchLocationsForBookingEdit],
  );

  const cancelEditBooking = useCallback(() => {
    setEditingBookingId(null);
  }, []);

  const saveEditBooking = useCallback(
    async (b: Booking) => {
      const {
        dateLocal,
        startTimeLocal,
        endTimeLocal,
        pickupCountry,
        pickupCity,
        pickupAddress,
      } = editBookingForm;

      // Did the time change at all?
      const originalDateLocal = localDateValue(new Date(b.startsAt));
      const originalStart = localTimeValue(new Date(b.startsAt));
      const originalEnd = localTimeValue(new Date(b.endsAt));
      const timeChanged =
        dateLocal !== originalDateLocal ||
        startTimeLocal !== originalStart ||
        endTimeLocal !== originalEnd;

      // Did the location change?
      const originalCountry = b.pickupCountry ?? "";
      const originalCity = b.pickupCity ?? "";
      const originalAddress = b.pickupAddress ?? b.pickup ?? "";
      const locationChanged =
        pickupCountry.trim() !== originalCountry.trim() ||
        pickupCity.trim() !== originalCity.trim() ||
        pickupAddress.trim() !== originalAddress.trim();

      if (!timeChanged && !locationChanged) {
        toast("Nothing to update.");
        return;
      }

      // Validate basic format of new time before sending.
      const body: Record<string, string> = {};
      if (timeChanged) {
        if (!dateLocal || !startTimeLocal || !endTimeLocal) {
          toast.error("Date and start/end times are required.");
          return;
        }
        // Construct local Date objects, then send ISO. Server interprets
        // the ISO timestamp as a UTC instant; comparisons elsewhere use
        // business-TZ-aware logic.
        const startDate = new Date(`${dateLocal}T${startTimeLocal}:00`);
        const endDate = new Date(`${dateLocal}T${endTimeLocal}:00`);
        if (
          Number.isNaN(startDate.getTime()) ||
          Number.isNaN(endDate.getTime())
        ) {
          toast.error("Invalid date or time.");
          return;
        }
        if (endDate.getTime() <= startDate.getTime()) {
          // Probably an overnight slot — treat end as next day.
          endDate.setDate(endDate.getDate() + 1);
          if (endDate.getTime() <= startDate.getTime()) {
            toast.error("End time must be after start time.");
            return;
          }
        }
        body.startsAt = startDate.toISOString();
        body.endsAt = endDate.toISOString();
      }
      if (locationChanged) {
        if (
          !pickupCountry.trim() ||
          !pickupCity.trim() ||
          pickupAddress.trim().length < 3
        ) {
          toast.error(
            "Country, city, and a valid street address are all required.",
          );
          return;
        }
        body.pickupCountry = pickupCountry.trim();
        body.pickupCity = pickupCity.trim();
        body.pickupAddress = pickupAddress.trim();
      }

      setSavingBookingEdit(true);
      try {
        const res = await fetch(`/api/admin/bookings/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          toast.error(payload.error || "Failed to update booking.");
          return;
        }
        toast.success("Booking updated.");
        setEditingBookingId(null);
        setSelectedBooking(null);
        fetchBookings();
      } catch (e) {
        console.error("Failed to update booking:", e);
        toast.error("Failed to update booking.");
      } finally {
        setSavingBookingEdit(false);
      }
    },
    [editBookingForm, fetchBookings],
  );

  // Reload city list whenever the edit-form date changes.
  useEffect(() => {
    if (editingBookingId && editBookingForm.dateLocal) {
      fetchLocationsForBookingEdit(editBookingForm.dateLocal);
    }
  }, [
    editingBookingId,
    editBookingForm.dateLocal,
    fetchLocationsForBookingEdit,
  ]);

  const cancelBookingNoRefund = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: cancelReason || "Cancelled by admin",
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
        toast.error(data?.message || data?.error || "Failed to cancel booking");
        return;
      }

      toast.success(data?.message || "Booking cancelled");
      setSelectedBooking(null);
      setCancelReason("");
      fetchBookings();
      fetchStats();
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  // Booking date/time are rendered in the BOOKING's own timezone (tour city or
  // Toronto) — not the admin's device — so a tour booking shows e.g. Amsterdam
  // time with its zone label, matching what the customer booked. Time ranges
  // use formatBookingTimeRange directly at the call sites. See
  // lib/format-datetime.ts.
  const formatDateLong = (dateString: string, zone?: string | null) =>
    formatBookingDate(dateString, zone);

  // One-click "add to my Google Calendar": opens Google's pre-filled event
  // screen in a new tab (template URL — no OAuth involved). The event lands
  // in whatever Google account the admin is signed into.
  const openInGoogleCalendar = (b: Booking) => {
    const location = [
      b.pickupAddress ?? b.pickup,
      b.pickupCity,
      b.pickupCountry,
    ]
      .filter(Boolean)
      .join(", ");
    const details = [
      `Customer: ${b.fullName}`,
      `Email: ${b.email}`,
      b.phone ? `Phone: ${b.phone}` : "",
      b.peopleCount ? `People: ${b.peopleCount}` : "",
      b.notes ? `Notes: ${b.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(
      googleCalendarEventUrl({
        title: `${b.eventType.name} — ${b.fullName}`,
        start: b.startsAt,
        end: b.endsAt,
        timezone: b.timezone,
        details,
        location,
      }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-cyan-100 text-cyan-800">Confirmed</Badge>;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage bookings and view analytics</p>
          </div>
          {stats && (
            <div
              className="grid grid-cols-3 gap-3"
              title="Confirmed bookings only — pending holds and cancellations excluded."
            >
              {[
                { label: "Total bookings", value: stats.total },
                { label: "This month", value: stats.thisMonth },
                { label: "Upcoming", value: stats.upcoming },
              ].map((s) => (
                <div
                  key={s.label}
                  className="min-w-[104px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm"
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bookings"
                    ? "border-cyan-500 text-cyan-600"
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
                    ? "border-cyan-500 text-cyan-600"
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
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "settings"
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
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

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <p className="text-sm text-gray-600">
                Change admin email/password securely (requires current
                password).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-600">Current admin email</div>
                <div className="font-semibold text-gray-900">
                  {accountEmail || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current password *
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to save changes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New email (optional)
                  </label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@thetripman.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New password (optional)
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={savingAccount}
                  onClick={async () => {
                    if (!currentPassword) {
                      toast.error("Current password is required.");
                      return;
                    }
                    if (!newEmail && !newPassword) {
                      toast.error("Enter a new email and/or new password.");
                      return;
                    }
                    setSavingAccount(true);
                    try {
                      const res = await fetch("/api/admin/account", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          currentPassword,
                          newEmail: newEmail || undefined,
                          newPassword: newPassword || undefined,
                        }),
                      });
                      const data = (await res.json().catch(() => null)) as {
                        ok?: boolean;
                        error?: string;
                        admin?: { email?: string };
                      } | null;
                      if (res.status === 401) {
                        toast.error(
                          data?.error || "Current password is incorrect.",
                        );
                        return;
                      }
                      if (!res.ok) {
                        toast.error(
                          data?.error || "Failed to update admin credentials.",
                        );
                        return;
                      }
                      toast.success("Admin credentials updated.");
                      setCurrentPassword("");
                      setNewEmail("");
                      setNewPassword("");
                      setAccountEmail(data?.admin?.email || accountEmail);
                    } catch (e) {
                      console.error(e);
                      toast.error("Failed to update admin credentials.");
                    } finally {
                      setSavingAccount(false);
                    }
                  }}
                >
                  {savingAccount ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  variant="outline"
                  disabled={savingAccount}
                  onClick={() => {
                    setCurrentPassword("");
                    setNewEmail("");
                    setNewPassword("");
                  }}
                >
                  Clear
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Note: Vercel env vars <code>ADMIN_EMAIL</code>/
                <code>ADMIN_PASSWORD</code> are used for seeding. After you
                change credentials here, you don’t need to change those unless
                you plan to re-seed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="space-y-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Rules (Recurring Schedule)</CardTitle>
                <p className="text-sm text-gray-600">
                  Set patterns like “Weekdays in February, 5pm → 3am”. Then use
                  blocks below for one-off exceptions.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mode
                    </label>
                    <Select
                      value={ruleForm.mode}
                      onValueChange={(v) =>
                        setRuleForm((p) => ({
                          ...p,
                          mode: v as "available" | "unavailable",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start date (optional)
                    </label>
                    <Input
                      type="date"
                      value={ruleForm.startDate}
                      onChange={(e) =>
                        setRuleForm((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End date (optional)
                    </label>
                    <Input
                      type="date"
                      value={ruleForm.endDate}
                      onChange={(e) =>
                        setRuleForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start time
                    </label>
                    <Input
                      type="time"
                      value={ruleForm.startTime}
                      onChange={(e) =>
                        setRuleForm((p) => ({
                          ...p,
                          startTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End time
                    </label>
                    <Input
                      type="time"
                      value={ruleForm.endTime}
                      onChange={(e) =>
                        setRuleForm((p) => ({ ...p, endTime: e.target.value }))
                      }
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <Button
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                      onClick={async () => {
                        if (ruleForm.daysOfWeek.length === 0) {
                          toast.error("Select at least one weekday.");
                          return;
                        }
                        try {
                          const res = await fetch(
                            "/api/admin/availability-rules",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({
                                timezone: ruleForm.timezone,
                                daysOfWeek: ruleForm.daysOfWeek,
                                startTime: ruleForm.startTime,
                                endTime: ruleForm.endTime,
                                isAvailable: ruleForm.mode === "available",
                                startDate: ruleForm.startDate || undefined,
                                endDate: ruleForm.endDate || undefined,
                                note: ruleForm.note || undefined,
                              }),
                            },
                          );
                          if (res.status === 401) {
                            window.location.href = "/admin/login";
                            return;
                          }
                          if (!res.ok) {
                            toast.error("Failed to create rule.");
                            return;
                          }
                          toast.success("Rule saved.");
                          fetchRules();
                        } catch (e) {
                          console.error(e);
                          toast.error("Failed to create rule.");
                        }
                      }}
                    >
                      Save Rule
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekdays
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {days.map((d) => {
                        const active = ruleForm.daysOfWeek.includes(d.v);
                        return (
                          <button
                            key={d.v}
                            type="button"
                            onClick={() => {
                              setRuleForm((p) => ({
                                ...p,
                                daysOfWeek: active
                                  ? p.daysOfWeek.filter((x) => x !== d.v)
                                  : [...p.daysOfWeek, d.v].sort(),
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              active
                                ? "bg-cyan-600 text-white border-cyan-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-cyan-400"
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <Input
                      value={ruleForm.timezone}
                      onChange={(e) =>
                        setRuleForm((p) => ({ ...p, timezone: e.target.value }))
                      }
                      placeholder="America/Toronto"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      (We can fully enforce timezone in availability in the next
                      iteration.)
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Existing Rules
                  </h3>
                  {rules.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No rules yet. If you add “Available” rules, they become
                      the source of truth.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-lg p-3"
                        >
                          <div className="text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                r.isAvailable
                                  ? "bg-cyan-100 text-cyan-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {r.isAvailable ? "Available" : "Unavailable"}
                            </span>
                            <span className="font-medium">
                              {r.startTime} → {r.endTime}
                            </span>{" "}
                            <span className="text-gray-500">
                              (
                              {r.daysOfWeek
                                .slice()
                                .sort()
                                .map((d) => days.find((x) => x.v === d)?.label)
                                .filter(Boolean)
                                .join(", ")}
                              )
                            </span>
                            {(r.startDate || r.endDate) && (
                              <span className="text-gray-500">
                                {" "}
                                • {r.startDate
                                  ? r.startDate.slice(0, 10)
                                  : "…"}{" "}
                                → {r.endDate ? r.endDate.slice(0, 10) : "…"}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const ok = window.confirm("Delete this rule?");
                              if (!ok) return;
                              try {
                                const res = await fetch(
                                  `/api/admin/availability-rules/${r.id}`,
                                  { method: "DELETE", credentials: "include" },
                                );
                                if (res.status === 401) {
                                  window.location.href = "/admin/login";
                                  return;
                                }
                                if (!res.ok) {
                                  toast.error("Failed to delete rule.");
                                  return;
                                }
                                toast.success("Rule deleted.");
                                fetchRules();
                              } catch (e) {
                                console.error(e);
                                toast.error("Failed to delete rule.");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Locations (Pickup Areas)</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage the countries and cities customers can choose for
                  pickup. Leave the date range empty for permanently-serviced
                  cities (e.g. GTA). Set a date range for tour windows (e.g.
                  Ottawa Jul 12–14) — the city becomes bookable only for those
                  dates.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new location */}
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    Add a new location
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <Input
                        value={locationForm.country}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            country: e.target.value,
                          }))
                        }
                        placeholder="Canada"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <Input
                        value={locationForm.city}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Toronto"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available from
                      </label>
                      <Input
                        type="date"
                        value={locationForm.availableFrom}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            availableFrom: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available until
                      </label>
                      <Input
                        type="date"
                        value={locationForm.availableUntil}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            availableUntil: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <Button
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        disabled={savingLocation}
                        onClick={createServiceLocation}
                      >
                        {savingLocation ? "Saving…" : "Add Location"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={locationForm.isActive}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            isActive: e.target.checked,
                          }))
                        }
                        className="accent-cyan-600 w-4 h-4"
                      />
                      Active (bookable)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={locationForm.isDefault}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            isDefault: e.target.checked,
                          }))
                        }
                        className="accent-cyan-600 w-4 h-4"
                      />
                      Default city for this country
                    </label>
                    <label
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      title="During this city's date window, ALL other (non-exclusive) cities are hidden. Use for tours."
                    >
                      <input
                        type="checkbox"
                        checked={locationForm.exclusive}
                        onChange={(e) =>
                          setLocationForm((p) => ({
                            ...p,
                            exclusive: e.target.checked,
                          }))
                        }
                        className="accent-purple-600 w-4 h-4"
                      />
                      Exclusive (tour mode)
                    </label>
                    <Input
                      value={locationForm.note}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          note: e.target.value,
                        }))
                      }
                      placeholder="Internal note (optional)"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone (optional)
                    </label>
                    <Input
                      value={locationForm.timezone}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          timezone: e.target.value,
                        }))
                      }
                      placeholder={`Auto: ${inferTimezone(
                        locationForm.country,
                        locationForm.city,
                      )}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to auto-detect from country/city (
                      <strong>
                        {inferTimezone(locationForm.country, locationForm.city)}
                      </strong>
                      ). On exclusive tour dates, the booking calendar shows
                      slot times in this city&apos;s timezone. Override with an
                      IANA name like <code>Europe/Brussels</code>.
                    </p>
                  </div>
                  {locationForm.exclusive && (
                    <p className="mt-2 text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-md p-2">
                      <strong>Tour mode:</strong> While this city&apos;s date
                      window is active, only exclusive cities will be bookable —
                      every other city is hidden until the window ends.
                    </p>
                  )}
                </div>

                {/* Existing locations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Existing Locations
                  </h3>
                  {serviceLocations.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No locations yet. Add at least one (e.g. Canada / Toronto)
                      so customers can book.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {serviceLocations.map((loc) => {
                        const isEditing = editingLocationId === loc.id;
                        return (
                          <div
                            key={loc.id}
                            className={`border rounded-xl p-4 transition-colors ${
                              isEditing
                                ? "border-cyan-300 bg-cyan-50/40"
                                : loc.isActive
                                  ? "border-gray-200 bg-white"
                                  : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            {/* Header row: badges + name + actions */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      loc.isActive
                                        ? "bg-cyan-100 text-cyan-800"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {loc.isActive ? "Active" : "Disabled"}
                                  </span>
                                  {loc.isDefault && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                      Default
                                    </span>
                                  )}
                                  {(loc.availableFrom ||
                                    loc.availableUntil) && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Date window
                                    </span>
                                  )}
                                  {loc.exclusive && (
                                    <span
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"
                                      title="During this city's date window, all non-exclusive cities are hidden."
                                    >
                                      Exclusive
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {loc.country} — {loc.city}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  Timezone:{" "}
                                  <span className="text-gray-700">
                                    {loc.timezone ??
                                      inferTimezone(loc.country, loc.city)}
                                  </span>
                                  {!loc.timezone && " (auto)"}
                                </div>
                                {(loc.availableFrom ||
                                  loc.availableUntil ||
                                  loc.note) && (
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                    {(loc.availableFrom ||
                                      loc.availableUntil) && (
                                      <span>
                                        Window:{" "}
                                        <strong className="text-gray-800">
                                          {loc.availableFrom
                                            ? toBusinessCalendarDay(
                                                loc.availableFrom,
                                              )
                                            : "always"}
                                        </strong>{" "}
                                        →{" "}
                                        <strong className="text-gray-800">
                                          {loc.availableUntil
                                            ? toBusinessCalendarDay(
                                                loc.availableUntil,
                                              )
                                            : "always"}
                                        </strong>
                                      </span>
                                    )}
                                    {loc.note && (
                                      <span className="truncate">
                                        Note:{" "}
                                        <span className="text-gray-700">
                                          {loc.note}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                {!isEditing && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditLocation(loc)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={
                                        loc.isActive
                                          ? "text-amber-700 border-amber-300 hover:bg-amber-50"
                                          : "text-cyan-700 border-cyan-300 hover:bg-cyan-50"
                                      }
                                      onClick={() => toggleLocationActive(loc)}
                                    >
                                      {loc.isActive ? "Disable" : "Enable"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-700 border-red-300 hover:bg-red-50"
                                      onClick={() => deleteServiceLocation(loc)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Inline edit panel */}
                            {isEditing && (
                              <div className="mt-4 pt-4 border-t border-cyan-200 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Available from
                                    </label>
                                    <Input
                                      type="date"
                                      value={editLocationForm.availableFrom}
                                      onChange={(e) =>
                                        setEditLocationForm((p) => ({
                                          ...p,
                                          availableFrom: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Available until
                                    </label>
                                    <Input
                                      type="date"
                                      value={editLocationForm.availableUntil}
                                      onChange={(e) =>
                                        setEditLocationForm((p) => ({
                                          ...p,
                                          availableUntil: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={editLocationForm.isActive}
                                      onChange={(e) =>
                                        setEditLocationForm((p) => ({
                                          ...p,
                                          isActive: e.target.checked,
                                        }))
                                      }
                                      className="accent-cyan-600 w-4 h-4"
                                    />
                                    Active (bookable)
                                  </label>
                                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={editLocationForm.isDefault}
                                      onChange={(e) =>
                                        setEditLocationForm((p) => ({
                                          ...p,
                                          isDefault: e.target.checked,
                                        }))
                                      }
                                      className="accent-cyan-600 w-4 h-4"
                                    />
                                    Default for {loc.country}
                                  </label>
                                  <label
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                                    title="During this city's date window, ALL other (non-exclusive) cities are hidden. Use for tours."
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editLocationForm.exclusive}
                                      onChange={(e) =>
                                        setEditLocationForm((p) => ({
                                          ...p,
                                          exclusive: e.target.checked,
                                        }))
                                      }
                                      className="accent-purple-600 w-4 h-4"
                                    />
                                    Exclusive (tour mode)
                                  </label>
                                  <Input
                                    value={editLocationForm.note}
                                    onChange={(e) =>
                                      setEditLocationForm((p) => ({
                                        ...p,
                                        note: e.target.value,
                                      }))
                                    }
                                    placeholder="Internal note (optional)"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Timezone (optional)
                                  </label>
                                  <Input
                                    value={editLocationForm.timezone}
                                    onChange={(e) =>
                                      setEditLocationForm((p) => ({
                                        ...p,
                                        timezone: e.target.value,
                                      }))
                                    }
                                    placeholder={`Auto: ${inferTimezone(
                                      loc.country,
                                      loc.city,
                                    )}`}
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Blank = auto (
                                    {inferTimezone(loc.country, loc.city)}).
                                    Override with an IANA name like{" "}
                                    <code>Europe/Brussels</code>.
                                  </p>
                                </div>
                                {editLocationForm.exclusive && (
                                  <p className="text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-md p-2">
                                    <strong>Tour mode:</strong> While this
                                    city&apos;s date window is active, only
                                    exclusive cities will be bookable — every
                                    other city is hidden until the window ends.
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditLocation}
                                    disabled={savingEditLocation}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                    disabled={savingEditLocation}
                                    onClick={() => saveEditLocation(loc.id)}
                                  >
                                    {savingEditLocation
                                      ? "Saving…"
                                      : "Save changes"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calendar (Bookings + One-off Blocks)</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to create an unavailable block. You’ll be asked to
                  confirm, and you can Undo right after.
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-xl overflow-hidden">
                  <FullCalendar
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    height="auto"
                    nowIndicator
                    selectable
                    selectMirror
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "timeGridDay,timeGridWeek",
                    }}
                    eventDidMount={(info) => {
                      // Show full details on hover (useful when the event is small).
                      const p = info.event.extendedProps as {
                        kind?: string;
                        customer?: string;
                        ride?: string;
                        dateLabel?: string;
                        timeRange?: string;
                      };
                      if (p.kind === "booking") {
                        info.el.setAttribute(
                          "title",
                          `${p.customer} — ${p.ride}\n${p.dateLabel}\n${p.timeRange}`,
                        );
                        return;
                      }
                      const start = info.event.start
                        ? info.event.start.toLocaleString()
                        : "";
                      const end = info.event.end
                        ? info.event.end.toLocaleString()
                        : "";
                      info.el.setAttribute(
                        "title",
                        `${info.event.title}\n${start}${end ? " → " + end : ""}`,
                      );
                    }}
                    eventContent={(arg) => {
                      const p = arg.event.extendedProps as {
                        kind?: string;
                        customer?: string;
                        ride?: string;
                        timeShort?: string;
                      };
                      if (p.kind === "booking") {
                        return (
                          <div className="tm-cal-event">
                            <div className="tm-cal-event-time">
                              {p.timeShort}
                            </div>
                            <div className="tm-cal-event-name">
                              {p.customer}
                            </div>
                            <div className="tm-cal-event-ride">{p.ride}</div>
                          </div>
                        );
                      }
                      // Blocks: same wrapper so long reasons wrap instead of
                      // getting clipped mid-word.
                      return (
                        <div className="tm-cal-event">
                          <div className="tm-cal-event-name">
                            {arg.event.title}
                          </div>
                        </div>
                      );
                    }}
                    editable
                    eventStartEditable
                    eventDurationEditable
                    select={async (info) => {
                      const ok = window.confirm(
                        `Create UNAVAILABLE block?\n\n${info.start.toLocaleString()} → ${info.end.toLocaleString()}`,
                      );
                      info.view.calendar.unselect();
                      if (!ok) return;
                      const reason = window.prompt("Reason (optional):") ?? "";
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
                        if (res.status === 409) {
                          const data = (await res.json().catch(() => null)) as {
                            error?: string;
                          } | null;
                          toast.error(
                            data?.error || "Overlaps existing bookings.",
                          );
                          return;
                        }
                        if (!res.ok) {
                          toast.error("Failed to create block.");
                          return;
                        }
                        const created = (await res.json()) as AvailabilityBlock;
                        toast.success("Unavailable block created.", {
                          action: {
                            label: "Undo",
                            onClick: async () => {
                              await fetch(
                                `/api/admin/availability-blocks/${created.id}`,
                                { method: "DELETE", credentials: "include" },
                              );
                              const view = info.view;
                              fetchBlocks(
                                view.activeStart.toISOString(),
                                view.activeEnd.toISOString(),
                              );
                            },
                          },
                        });
                        const view = info.view;
                        fetchBlocks(
                          view.activeStart.toISOString(),
                          view.activeEnd.toISOString(),
                        );
                      } catch (e) {
                        console.error(e);
                        toast.error("Failed to create block.");
                      }
                    }}
                    datesSet={(arg) => {
                      // Fetch one extra day on each side of the visible
                      // range: events render at their own-timezone
                      // wall-clock position, which can fall on a different
                      // calendar day than the UTC instant the API filters
                      // on (e.g. 1am Sunday in Amsterdam is still Saturday
                      // evening in UTC).
                      const from = new Date(arg.start);
                      from.setDate(from.getDate() - 1);
                      const to = new Date(arg.end);
                      to.setDate(to.getDate() + 1);
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: localDateValue(from),
                        dateTo: localDateValue(to),
                      }));
                      fetchBlocks(from.toISOString(), to.toISOString());
                    }}
                    events={[
                      ...bookings.map((b) => ({
                        id: b.id,
                        title: `${b.eventType.name} • ${b.fullName}`,
                        // Wall-clock in the BOOKING's timezone, not an
                        // instant: an 8pm Amsterdam ride sits on the 8pm
                        // row of the grid regardless of the admin's device
                        // timezone. Matches what the customer booked and
                        // what the Bookings tab shows.
                        start: toBookingWallClock(b.startsAt, b.timezone),
                        end: toBookingWallClock(b.endsAt, b.timezone),
                        editable: false,
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
                        extendedProps: {
                          kind: "booking",
                          customer: b.fullName,
                          ride: b.eventType.name,
                          city: b.pickupCity ?? "",
                          timeShort: formatBookingTime(b.startsAt, b.timezone),
                          timeRange: formatBookingTimeRange(
                            b.startsAt,
                            b.endsAt,
                            b.timezone,
                          ),
                          dateLabel: formatBookingDate(b.startsAt, b.timezone),
                        },
                      })),
                      ...blocks.map((blk) => ({
                        id: `blk-${blk.id}`,
                        title: blk.reason
                          ? `Unavailable: ${blk.reason}`
                          : "Unavailable",
                        start: blk.startsAt,
                        end: blk.endsAt,
                        editable: true,
                        backgroundColor: "rgba(239, 68, 68, 0.18)",
                        borderColor: "rgba(239, 68, 68, 0.35)",
                        textColor: "#991b1b",
                        extendedProps: { kind: "block" },
                      })),
                    ]}
                    eventDrop={async (arg) => {
                      const id = arg.event.id;
                      if (!id.startsWith("blk-")) return;
                      const blockId = id.replace("blk-", "");
                      try {
                        const res = await fetch(
                          `/api/admin/availability-blocks/${blockId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              startsAt: arg.event.start?.toISOString(),
                              endsAt: arg.event.end?.toISOString(),
                            }),
                          },
                        );
                        if (res.status === 409) {
                          const data = (await res.json().catch(() => null)) as {
                            error?: string;
                          } | null;
                          toast.error(
                            data?.error || "Overlaps existing bookings.",
                          );
                          arg.revert();
                          return;
                        }
                        if (!res.ok) throw new Error("patch failed");
                        toast.success("Block updated.");
                      } catch {
                        toast.error("Failed to update block.");
                        arg.revert();
                      }
                    }}
                    eventResize={async (arg) => {
                      const id = arg.event.id;
                      if (!id.startsWith("blk-")) return;
                      const blockId = id.replace("blk-", "");
                      try {
                        const res = await fetch(
                          `/api/admin/availability-blocks/${blockId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              startsAt: arg.event.start?.toISOString(),
                              endsAt: arg.event.end?.toISOString(),
                            }),
                          },
                        );
                        if (res.status === 409) {
                          const data = (await res.json().catch(() => null)) as {
                            error?: string;
                          } | null;
                          toast.error(
                            data?.error || "Overlaps existing bookings.",
                          );
                          arg.revert();
                          return;
                        }
                        if (!res.ok) throw new Error("patch failed");
                        toast.success("Block updated.");
                      } catch {
                        toast.error("Failed to update block.");
                        arg.revert();
                      }
                    }}
                    eventClick={async (clickInfo) => {
                      const id = clickInfo.event.id;
                      // Booking event → open the same Booking Details modal
                      // the Bookings tab uses. We look up the full booking
                      // from state (which is already loaded) so admin can
                      // see / cancel / edit without leaving the calendar.
                      if (!id.startsWith("blk-")) {
                        const booking = bookings.find((b) => b.id === id);
                        if (booking) {
                          setSelectedBooking(booking);
                          return;
                        }
                        // Booking not in current state (e.g. range changed
                        // since last fetch) — fall through silently.
                        return;
                      }
                      const blockId = id.replace("blk-", "");
                      const ok = window.confirm(
                        "Delete this unavailable block?",
                      );
                      if (!ok) return;
                      try {
                        const res = await fetch(
                          `/api/admin/availability-blocks/${blockId}`,
                          { method: "DELETE", credentials: "include" },
                        );
                        if (res.status === 401) {
                          window.location.href = "/admin/login";
                          return;
                        }
                        if (!res.ok) {
                          toast.error("Failed to delete block.");
                          return;
                        }
                        toast.success("Block deleted.");
                        const cal = clickInfo.view.calendar;
                        fetchBlocks(
                          cal.view.activeStart.toISOString(),
                          cal.view.activeEnd.toISOString(),
                        );
                      } catch (e) {
                        console.error(e);
                        toast.error("Failed to delete block.");
                      }
                    }}
                  />
                </div>

                {blocks.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Unavailable blocks (quick delete)
                    </h3>
                    <div className="space-y-2">
                      {blocks
                        .slice()
                        .reverse()
                        .slice(0, 12)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
                          >
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {b.reason || "Unavailable"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(b.startsAt).toLocaleString()} →{" "}
                                {new Date(b.endsAt).toLocaleString()}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={async () => {
                                const ok = window.confirm(
                                  "Delete this unavailable block?",
                                );
                                if (!ok) return;
                                const res = await fetch(
                                  `/api/admin/availability-blocks/${b.id}`,
                                  { method: "DELETE", credentials: "include" },
                                );
                                if (!res.ok) {
                                  toast.error("Failed to delete block.");
                                  return;
                                }
                                toast.success("Block deleted.");
                                // Refresh using the currently visible range inferred from filters
                                const from = filters.dateFrom
                                  ? new Date(filters.dateFrom).toISOString()
                                  : new Date().toISOString();
                                const to = filters.dateTo
                                  ? new Date(
                                      filters.dateTo + "T23:59:59.999Z",
                                    ).toISOString()
                                  : new Date().toISOString();
                                fetchBlocks(from, to);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-4">
                  <span>Filters</span>
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showPastBookings}
                        onChange={(e) => setShowPastBookings(e.target.checked)}
                        className="accent-cyan-600"
                      />
                      Show past bookings
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showCanceledBookings}
                        onChange={(e) =>
                          setShowCanceledBookings(e.target.checked)
                        }
                        className="accent-cyan-600"
                      />
                      Show canceled
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showExpiredPending}
                        onChange={(e) =>
                          setShowExpiredPending(e.target.checked)
                        }
                        className="accent-cyan-600"
                      />
                      Show expired pending
                    </label>
                  </div>
                </CardTitle>
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
                          title="Add to Google Calendar"
                          onClick={() => openInGoogleCalendar(booking)}
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </Button>
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
                              disabled={
                                booking.isExpiredHold ||
                                (booking.paymentStatus &&
                                  booking.paymentStatus !== "COMPLETED")
                              }
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {formatDateLong(booking.startsAt, booking.timezone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>
                          {formatBookingTimeRange(
                            booking.startsAt,
                            booking.endsAt,
                            booking.timezone,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {booking.pickupCity ??
                            booking.pickupAddress ??
                            booking.pickup ??
                            "—"}
                          {booking.pickupCountry &&
                          booking.pickupCountry !== "Canada"
                            ? ` (${booking.pickupCountry})`
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{booking.email}</span>
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
          </>
        )}

        {/* Booking Details Modal — rendered outside the tab conditionals so
            clicking a booking on the Calendar tab opens it too, not just the
            Bookings list. */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                      <label className="font-semibold">Number of People</label>
                      <p>{selectedBooking.peopleCount}</p>
                    </div>
                  )}
                  {(selectedBooking.pickupAddress ||
                    selectedBooking.pickup) && (
                    <div className="col-span-2">
                      <label className="font-semibold">Pickup Location</label>
                      {selectedBooking.pickupAddress ? (
                        <p>
                          {selectedBooking.pickupAddress}
                          {selectedBooking.pickupCity
                            ? `, ${selectedBooking.pickupCity}`
                            : ""}
                          {selectedBooking.pickupCountry
                            ? `, ${selectedBooking.pickupCountry}`
                            : ""}
                        </p>
                      ) : (
                        <p>{selectedBooking.pickup}</p>
                      )}
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
                    <p>
                      {formatDateLong(
                        selectedBooking.startsAt,
                        selectedBooking.timezone,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold">Time</label>
                    <p>
                      {formatBookingTimeRange(
                        selectedBooking.startsAt,
                        selectedBooking.endsAt,
                        selectedBooking.timezone,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold">Duration</label>
                    <p>{selectedBooking.eventType.durationMin} minutes</p>
                  </div>
                  {(selectedBooking.subtotalCents != null ||
                    selectedBooking.amountPaid != null ||
                    selectedBooking.eventType.priceCents != null) && (
                    <div className="col-span-2">
                      <label className="font-semibold">Price breakdown</label>
                      {selectedBooking.subtotalCents != null &&
                      selectedBooking.taxCents != null &&
                      selectedBooking.taxRate != null ? (
                        <div className="mt-1 text-sm text-gray-700 space-y-0.5">
                          <p>
                            <span className="text-gray-600">Subtotal:</span> $
                            {(selectedBooking.subtotalCents / 100).toFixed(2)}{" "}
                            {(selectedBooking.currency ?? "cad").toUpperCase()}
                          </p>
                          <p>
                            <span className="text-gray-600">
                              {(selectedBooking.currency ?? "cad") === "usd"
                                ? "Sales tax"
                                : "HST"}{" "}
                              ({(selectedBooking.taxRate * 100).toFixed(0)}
                              %):
                            </span>{" "}
                            ${(selectedBooking.taxCents / 100).toFixed(2)}{" "}
                            {(selectedBooking.currency ?? "cad").toUpperCase()}
                          </p>
                          <p className="font-semibold text-gray-900">
                            Total: $
                            {(
                              (selectedBooking.amountPaid ??
                                selectedBooking.subtotalCents +
                                  selectedBooking.taxCents) / 100
                            ).toFixed(2)}{" "}
                            {(selectedBooking.currency ?? "cad").toUpperCase()}
                          </p>
                        </div>
                      ) : (
                        <p>
                          $
                          {(
                            (selectedBooking.amountPaid ??
                              selectedBooking.eventType.priceCents ??
                              0) / 100
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit booking: date/time + pickup location */}
                {selectedBooking.status !== "CANCELED" && (
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">
                        Edit booking
                      </div>
                      {editingBookingId === selectedBooking.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditBooking}
                          disabled={savingBookingEdit}
                        >
                          Cancel edit
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditBooking(selectedBooking)}
                        >
                          Edit date / location
                        </Button>
                      )}
                    </div>

                    {editingBookingId === selectedBooking.id && (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                          Changing the date frees the old slot automatically —
                          another customer can book it. The customer is not
                          auto-notified; let them know separately.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <Input
                              type="date"
                              value={editBookingForm.dateLocal}
                              onChange={(e) =>
                                setEditBookingForm((p) => ({
                                  ...p,
                                  dateLocal: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Start time
                            </label>
                            <Input
                              type="time"
                              value={editBookingForm.startTimeLocal}
                              onChange={(e) =>
                                setEditBookingForm((p) => ({
                                  ...p,
                                  startTimeLocal: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End time
                            </label>
                            <Input
                              type="time"
                              value={editBookingForm.endTimeLocal}
                              onChange={(e) =>
                                setEditBookingForm((p) => ({
                                  ...p,
                                  endTimeLocal: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Pickup country
                            </label>
                            <Select
                              value={editBookingForm.pickupCountry}
                              onValueChange={(v) =>
                                setEditBookingForm((p) => ({
                                  ...p,
                                  pickupCountry: v,
                                  pickupCity: "",
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(
                                  new Set(
                                    editBookingLocations.map((l) => l.country),
                                  ),
                                ).map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Pickup city
                            </label>
                            <Select
                              value={editBookingForm.pickupCity}
                              onValueChange={(v) =>
                                setEditBookingForm((p) => ({
                                  ...p,
                                  pickupCity: v,
                                }))
                              }
                              disabled={!editBookingForm.pickupCountry}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent>
                                {editBookingLocations
                                  .filter(
                                    (l) =>
                                      l.country ===
                                      editBookingForm.pickupCountry,
                                  )
                                  .map((l) => (
                                    <SelectItem key={l.city} value={l.city}>
                                      {l.city}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pickup street address
                          </label>
                          <Input
                            value={editBookingForm.pickupAddress}
                            onChange={(e) =>
                              setEditBookingForm((p) => ({
                                ...p,
                                pickupAddress: e.target.value,
                              }))
                            }
                            placeholder="e.g. 75 Laurelcrest Street"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            disabled={savingBookingEdit}
                            onClick={() => saveEditBooking(selectedBooking)}
                          >
                            {savingBookingEdit ? "Saving…" : "Save changes"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin actions: cancel (no refunds) */}
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

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => cancelBookingNoRefund(selectedBooking.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Booking (No Refund)
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedBooking.status === "PENDING" && (
                    <>
                      <Button
                        onClick={() =>
                          updateBookingStatus(selectedBooking.id, "CONFIRMED")
                        }
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
                        disabled={
                          selectedBooking.isExpiredHold ||
                          (selectedBooking.paymentStatus &&
                            selectedBooking.paymentStatus !== "COMPLETED")
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </Button>
                    </>
                  )}
                  {(selectedBooking.status === "CANCELED" ||
                    selectedBooking.isExpiredHold) && (
                    <Button
                      variant="destructive"
                      onClick={() => deleteBooking(selectedBooking.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => openInGoogleCalendar(selectedBooking)}
                    className="flex-1"
                    title="Opens Google Calendar with this booking pre-filled"
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Google Calendar
                  </Button>
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
      </div>
    </div>
  );
}
