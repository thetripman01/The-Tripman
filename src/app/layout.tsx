import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

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
      <head>
        {/*
          Meta Pixel base code. Loads after interactive so it never blocks
          first paint / LCP. The pixel handles its own `PageView` event on
          init; custom events are fired from client components via
          src/lib/meta-pixel.ts → trackPixel().
        */}
        <Script id="meta-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* Server-rendered fallback for browsers with JS disabled. The
              <img> tag is required by Meta's snippet — it's a 1×1
              tracking pixel, NOT a content image, so next/image's
              optimization pipeline doesn't apply. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
