"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { trackPixel } from "@/lib/meta-pixel";
import { currencySymbol, type SupportedCurrency } from "@/lib/tripman-packages";

// Lazy-init Stripe so a missing publishable key doesn't crash module load.
let stripePromiseCache: Promise<Stripe | null> | null = null;
function getStripePromise(): Promise<Stripe | null> | null {
  if (stripePromiseCache) return stripePromiseCache;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  stripePromiseCache = loadStripe(key);
  return stripePromiseCache;
}

interface PaymentFormProps {
  bookingId: string;
  // Displayed amount + currency for the Pay button. These are SERVER-AUTHORITATIVE
  // upstream (Stripe re-validates), here they only affect what the user sees.
  amount: number;
  currency: SupportedCurrency;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

function PaymentFormContent({
  bookingId,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // After redirect (3DS, etc), bring the customer back to their booking page.
          return_url: `${window.location.origin}/booking/${bookingId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        onPaymentError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Meta Pixel: payment succeeded — fire the Purchase conversion
        // with the actual amount + currency Stripe captured (NOT a value
        // we trust the client to assemble — we read it off the intent
        // Stripe just confirmed).
        trackPixel("Purchase", {
          value: (paymentIntent.amount ?? amount) / 100,
          currency: (paymentIntent.currency ?? currency).toUpperCase(),
          content_category: "tripman-ride",
        });
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-cyan-800 mb-2">
          <CreditCard className="w-5 h-5" />
          <span className="font-semibold">Secure Payment</span>
        </div>
        <p className="text-cyan-700 text-sm">
          Your payment information is encrypted and secure. We use Stripe for
          payment processing.
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <Button
        type="submit"
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {currencySymbol(currency)}
            {(amount / 100).toFixed(2)} {currency.toUpperCase()}
            {currency === "cad"
              ? " (incl. 13% HST)"
              : currency === "eur"
                ? " (incl. 13% VAT)"
                : " (incl. 13% tax)"}
          </>
        )}
      </Button>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const { bookingId, onPaymentError } = props;
  const [clientSecret, setClientSecret] = useState<string>("");
  const [initError, setInitError] = useState<string>("");
  const stripePromise = getStripePromise();

  useEffect(() => {
    if (!stripePromise) {
      const message =
        "Online payment is not configured yet. Please contact us to complete your booking.";
      setInitError(message);
      onPaymentError(message);
      return;
    }
    // Create payment intent for Elements
    const createPaymentIntent = async () => {
      try {
        setInitError("");
        const response = await fetch("/api/payment/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          const message =
            payload?.error ||
            (response.status === 410
              ? "This booking hold has expired. Please book again."
              : "Failed to initialize payment");
          setInitError(message);
          onPaymentError(message);
          return;
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        const message = "Failed to initialize payment";
        setInitError(message);
        onPaymentError(message);
      }
    };

    createPaymentIntent();
  }, [bookingId, onPaymentError, stripePromise]);

  if (initError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {initError}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Initializing payment...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#0891b2",
              },
            },
          }}
        >
          <PaymentFormContent
            bookingId={props.bookingId}
            amount={props.amount}
            currency={props.currency}
            onPaymentSuccess={props.onPaymentSuccess}
            onPaymentError={props.onPaymentError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
