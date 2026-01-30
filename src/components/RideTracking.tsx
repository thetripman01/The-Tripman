"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Phone,
  Car,
  Navigation,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface RideData {
  rideId: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  startTime?: string;
  endTime?: string;
  currentLocation?: Location;
}

interface RideTrackingProps {
  bookingId: string;
  email?: string;
}

const statusConfig = {
  ASSIGNED: {
    label: "Driver Assigned",
    color: "bg-blue-500",
    icon: CheckCircle,
    message: "Your driver has been assigned and will contact you soon.",
  },
  DRIVER_EN_ROUTE: {
    label: "Driver En Route",
    color: "bg-yellow-500",
    icon: Navigation,
    message: "Your driver is on the way to your pickup location.",
  },
  ARRIVED: {
    label: "Driver Arrived",
    color: "bg-green-500",
    icon: MapPin,
    message: "Your driver has arrived at the pickup location.",
  },
  IN_PROGRESS: {
    label: "Ride in Progress",
    color: "bg-purple-500",
    icon: Car,
    message: "Your ride is currently in progress.",
  },
  COMPLETED: {
    label: "Ride Completed",
    color: "bg-green-600",
    icon: CheckCircle,
    message: "Your ride has been completed. Thank you!",
  },
  CANCELLED: {
    label: "Ride Cancelled",
    color: "bg-red-500",
    icon: AlertCircle,
    message: "Your ride has been cancelled.",
  },
};

export function RideTracking({ bookingId, email }: RideTrackingProps) {
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRideData = async () => {
      try {
        const url = new URL(
          `/api/tracking/${bookingId}`,
          window.location.origin,
        );
        if (email) url.searchParams.set("email", email);

        const response = await fetch(url.toString());

        if (!response.ok) {
          if (response.status === 404) {
            setError("Booking not found");
            return;
          }
          if (response.status === 401 || response.status === 403) {
            setError("Please verify your email to view tracking.");
            return;
          }
          throw new Error("Failed to fetch ride data");
        }

        const data = await response.json();

        if (data.status === "not_started") {
          setError("Ride tracking has not started yet");
          return;
        }

        setRideData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching ride data:", err);
        setError("Failed to load ride tracking");
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRideData, 30000);

    return () => clearInterval(interval);
  }, [bookingId, email]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2">Loading ride tracking...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rideData) {
    return null;
  }

  const statusInfo =
    statusConfig[rideData.status as keyof typeof statusConfig] ||
    statusConfig.ASSIGNED;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" />
            Ride Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
            <span className="text-sm text-gray-600">
              {rideData.currentLocation &&
                new Date(
                  rideData.currentLocation.timestamp,
                ).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-gray-700">{statusInfo.message}</p>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {rideData.driverName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Driver:</strong> {rideData.driverName}
              </p>
              {rideData.driverPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a
                    href={`tel:${rideData.driverPhone}`}
                    className="text-green-600 hover:underline"
                  >
                    {rideData.driverPhone}
                  </a>
                </p>
              )}
              {rideData.vehicleInfo && (
                <p>
                  <strong>Vehicle:</strong> {rideData.vehicleInfo}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Location */}
      {rideData.currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rideData.currentLocation.address && (
                <p>
                  <strong>Address:</strong> {rideData.currentLocation.address}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <strong>Coordinates:</strong>{" "}
                {rideData.currentLocation.latitude.toFixed(6)},{" "}
                {rideData.currentLocation.longitude.toFixed(6)}
              </p>
              {rideData.currentLocation.speed && (
                <p className="text-sm text-gray-600">
                  <strong>Speed:</strong>{" "}
                  {Math.round(rideData.currentLocation.speed * 2.237)} mph
                </p>
              )}
              <p className="text-sm text-gray-600">
                <strong>Last Updated:</strong>{" "}
                {new Date(rideData.currentLocation.timestamp).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rideData.startTime && (
              <p>
                <strong>Started:</strong>{" "}
                {new Date(rideData.startTime).toLocaleString()}
              </p>
            )}
            {rideData.endTime && (
              <p>
                <strong>Completed:</strong>{" "}
                {new Date(rideData.endTime).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
