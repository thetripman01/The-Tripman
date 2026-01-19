import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "The Tripman - Premium Transportation & Experience Services",
  description:
    "From birthday surprises to airport pickups, we make every journey special. Book your premium ride experience with The Tripman today.",
  keywords:
    "transportation, ride service, birthday surprise, airport pickup, city tour, luxury ride, Toronto",
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
    title: "The Tripman - Premium Transportation & Experience Services",
    description:
      "From birthday surprises to airport pickups, we make every journey special. Book your premium ride experience with The Tripman today.",
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
    title: "The Tripman - Premium Transportation & Experience Services",
    description:
      "From birthday surprises to airport pickups, we make every journey special. Book your premium ride experience with The Tripman today.",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
