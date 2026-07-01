import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { toBusinessCalendarDay } from "@/lib/timezone";
import { canonicalCountryKey, countryDisplayName, slugKey } from "@/lib/geo";
import {
  TourBooking,
  type TourCity,
  type TourEventType,
} from "@/components/tour/TourBooking";

// Always reflect the latest admin tour setup (cities toggled / re-dated).
export const dynamic = "force-dynamic";

interface ResolvedTour {
  kind: "country" | "city";
  displayName: string;
  cities: TourCity[];
  eventType: TourEventType | null;
}

/** Compact "Jul 13 – Jul 14" style range from a list of YYYY-MM-DD days. */
function daysSummary(days: string[]): string {
  if (days.length === 0) return "";
  const fmt = (ymd: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(`${ymd}T12:00:00`));
  const first = fmt(days[0]);
  const last = fmt(days[days.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

// Resolve the URL slug (country OR city) to its tour cities + the bookable
// event type. Cached per request so generateMetadata and the page share one
// set of queries.
const loadTour = cache(
  async (slugParam: string): Promise<ResolvedTour | null> => {
    const raw = decodeURIComponent(slugParam ?? "");

    const tourLocs = await db.serviceLocation.findMany({
      where: {
        isActive: true,
        // "Tour" cities are the ones with a date window (same rule the public
        // schedule endpoint uses). Always-on GTA cities never appear here.
        OR: [
          { availableFrom: { not: null } },
          { availableUntil: { not: null } },
        ],
      },
      orderBy: [{ availableFrom: "asc" }, { city: "asc" }],
    });

    const ck = canonicalCountryKey(raw);
    const sk = slugKey(raw);

    let matched = tourLocs.filter((l) => canonicalCountryKey(l.country) === ck);
    let kind: "country" | "city" = "country";
    if (matched.length === 0) {
      matched = tourLocs.filter((l) => slugKey(l.city) === sk);
      kind = "city";
    }
    if (matched.length === 0) return null;

    const todayKey = toBusinessCalendarDay(new Date());

    const cities: TourCity[] = matched
      .map((l) => {
        const fromKey = l.availableFrom
          ? toBusinessCalendarDay(l.availableFrom)
          : null;
        const untilKey = l.availableUntil
          ? toBusinessCalendarDay(l.availableUntil)
          : fromKey;
        if (!fromKey) return null;

        const days: string[] = [];
        const cur = new Date(`${fromKey}T12:00:00Z`);
        const last = new Date(`${untilKey ?? fromKey}T12:00:00Z`);
        while (cur.getTime() <= last.getTime()) {
          const key = cur.toISOString().slice(0, 10);
          if (key >= todayKey) days.push(key); // hide past days
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
        return {
          city: l.city,
          country: l.country,
          timezone: l.timezone,
          days,
        };
      })
      .filter((c): c is TourCity => c !== null);

    const displayName =
      kind === "country"
        ? countryDisplayName(matched[0].country)
        : matched[0].city;

    const eventType = await db.eventType.findFirst({
      where: { slug: "tripman-experience", isActive: true },
    });

    return {
      kind,
      displayName,
      cities,
      eventType: eventType
        ? {
            id: eventType.id,
            slug: eventType.slug,
            name: eventType.name,
            description: eventType.description,
            durationMin: eventType.durationMin,
            priceCents: eventType.priceCents,
            isActive: eventType.isActive,
          }
        : null,
    };
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const tour = await loadTour(country);
  if (!tour) return { title: "The Tripman" };

  const allDays = tour.cities.flatMap((c) => c.days);
  const range = daysSummary(allDays);
  const title = `The Tripman in ${tour.displayName}${range ? ` — ${range}` : ""}`;
  const description = `The Tripman is bringing car karaoke, party lights and unforgettable vibes to ${tour.displayName}. Pick a tour date and book your ride.`;

  return {
    title,
    description,
    alternates: { canonical: `/${country}` },
    openGraph: {
      title,
      description,
      url: `/${country}`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(
            `The Tripman in ${tour.displayName}`,
          )}&description=${encodeURIComponent(range || "Book your ride")}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TourCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const tour = await loadTour(country);
  if (!tour || !tour.eventType) notFound();

  const allDays = tour.cities.flatMap((c) => c.days);
  const range = daysSummary(allDays);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-white">
      {/* Minimal branded bar — no navigation back into the main site. */}
      <header className="sticky top-0 z-40 border-b border-cyan-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-cyan-200">
            <Image
              src="/tripman-main.jpg"
              alt="The Tripman"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-lg font-bold text-gray-900">The Tripman</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-14 pb-8">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
            The Tripman · European Tour
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
            The Tripman is coming to{" "}
            <span className="text-cyan-600">{tour.displayName}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-light text-gray-600">
            One hour of car karaoke, party lights and pure chaos — your city,
            your night. Grab one of the limited tour dates below.
          </p>
          {range && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
              Tour dates: {range}
            </div>
          )}
        </div>
      </section>

      {/* Booking flow */}
      <section className="px-4 pb-24">
        <TourBooking eventType={tour.eventType} cities={tour.cities} />
      </section>

      {/* Minimal footer */}
      <footer className="border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-500">
        <p>
          Questions? Email{" "}
          <a
            href="mailto:thetripman01@gmail.com"
            className="text-cyan-600 hover:underline"
          >
            thetripman01@gmail.com
          </a>
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} The Tripman. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
