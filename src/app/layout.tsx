import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "The Tripman Experience",
  description:
    "Ever watched a Tripman video and thought “Damn… I wish that was me”? Now it can be. Book your Tripman Experience.",
  keywords: "The Tripman, Tripman Experience, car karaoke, Toronto, booking",
  authors: [{ name: "The Tripman" }],
  creator: "The Tripman",
  publisher: "The Tripman",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The Tripman Experience",
    description:
      "Book your Tripman Experience. Car karaoke, party lights, unforgettable vibes. Toronto & GTA.",
    url: "/",
    siteName: "The Tripman",
    images: [
      {
        url: "/api/og?title=The%20TripMan&description=Premium%20Transportation%20%26%20Experience%20Services",
        width: 1200,
        height: 630,
        alt: "The Tripman - Premium Transportation Services",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tripman Experience",
    description:
      "Book your Tripman Experience. Car karaoke, party lights, unforgettable vibes. Toronto & GTA.",
    images: [
      "/api/og?title=The%20Tripman&description=Premium%20Transportation%20%26%20Experience%20Services",
    ],
    creator: "@tripmansite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
