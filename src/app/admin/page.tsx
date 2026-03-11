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
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
  Settings,
} from "lucide-react";
import { FraudAlert } from "@/components/FraudAlert";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

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

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
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
    } catch (e) {
      console.error("Failed to delete booking:", e);
      toast.error("Failed to delete booking");
    }
  };

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
    } catch {
      toast.error("Failed to cancel booking");
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
                      const from = arg.startStr.slice(0, 10);
                      const to = arg.endStr.slice(0, 10);
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: from,
                        dateTo: to,
                      }));
                      fetchBlocks(
                        arg.start.toISOString(),
                        arg.end.toISOString(),
                      );
                    }}
                    events={[
                      ...bookings.map((b) => ({
                        id: b.id,
                        title: `${b.eventType.name} • ${b.fullName}`,
                        start: b.startsAt,
                        end: b.endsAt,
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
                      if (!id.startsWith("blk-")) return;
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
                          onClick={() =>
                            cancelBookingNoRefund(selectedBooking.id)
                          }
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
                              updateBookingStatus(
                                selectedBooking.id,
                                "CONFIRMED",
                              )
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
