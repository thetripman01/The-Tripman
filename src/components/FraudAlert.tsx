"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Eye, CheckCircle, XCircle } from "lucide-react";

interface FraudAlert {
  id: string;
  bookingId: string;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
  status: "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED";
  createdAt: string;
  booking: {
    fullName: string;
    email: string;
    eventType: {
      name: string;
    };
    amountPaid: number | null;
  };
}

export function FraudAlert() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const fetchFraudAlerts = async () => {
    try {
      const response = await fetch("/api/admin/fraud-alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch fraud alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchFraudAlerts();
      }
    } catch (error) {
      console.error("Failed to update alert status:", error);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 20) return { label: "LOW", color: "bg-cyan-500" };
    if (score < 50) return { label: "MEDIUM", color: "bg-yellow-500" };
    if (score < 80) return { label: "HIGH", color: "bg-orange-500" };
    return { label: "CRITICAL", color: "bg-red-500" };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Pending Review", color: "bg-yellow-500" },
      REVIEWED: { label: "Under Review", color: "bg-blue-500" },
      APPROVED: { label: "Approved", color: "bg-cyan-500" },
      REJECTED: { label: "Rejected", color: "bg-red-500" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-2">Loading fraud alerts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All Clear!
            </h3>
            <p className="text-gray-600">
              No fraud alerts detected in the system.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Fraud Detection Alerts
          <Badge className="bg-red-500 text-white">
            {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => {
            const riskLevel = getRiskLevel(alert.riskScore);

            return (
              <div key={alert.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{alert.booking.fullName}</h4>
                    <Badge className={`${riskLevel.color} text-white`}>
                      {riskLevel.label} ({alert.riskScore})
                    </Badge>
                    {getStatusBadge(alert.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Service:</strong> {alert.booking.eventType.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {alert.booking.email}
                    </p>
                    {alert.booking.amountPaid && (
                      <p className="text-sm text-gray-600">
                        <strong>Amount:</strong> $
                        {(alert.booking.amountPaid / 100).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">
                      Risk Factors:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alert.reasons.slice(0, 3).map((reason, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                      {alert.reasons.length > 3 && (
                        <li className="text-gray-500">
                          +{alert.reasons.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {alert.recommendations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Recommendations:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alert.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAlertStatus(alert.id, "REVIEWED")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateAlertStatus(alert.id, "REJECTED")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateAlertStatus(alert.id, "APPROVED")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}

                {alert.status === "REVIEWED" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateAlertStatus(alert.id, "REJECTED")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateAlertStatus(alert.id, "APPROVED")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
