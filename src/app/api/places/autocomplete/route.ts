import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const ALLOWED_AREAS = [
  "Toronto",
  "Mississauga",
  "North York",
  "Scarborough",
  "Etobicoke",
] as const;

export async function GET(request: NextRequest) {
  // This proxies to Nominatim under OUR IP/User-Agent — throttle it so a
  // scraper can't burn their usage policy (1 req/s) on our behalf.
  const limited = rateLimit(getClientIp(request), {
    key: "places-autocomplete",
    limit: 30,
    windowMs: 5 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json([], { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 3) {
    return NextResponse.json([]);
  }

  // Nominatim (OpenStreetMap) suggestions.
  // Best-effort suggestions restricted to Toronto/GTA service areas.
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");
  url.searchParams.set("countrycodes", "ca");
  // Rough GTA bounding box to avoid far results (west,north,east,south).
  url.searchParams.set("viewbox", "-79.90,43.90,-79.00,43.45");
  url.searchParams.set("bounded", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TheTripManBooking/1.0 (autocomplete)",
        Accept: "application/json",
      },
      // Keep it reasonably fresh, but not too aggressive.
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as Array<{
      display_name: string;
      place_id: number;
      address?: Record<string, string | undefined>;
    }>;

    const isAllowed = (x: (typeof data)[number]) => {
      const hay =
        `${x.display_name} ${Object.values(x.address || {}).join(" ")}`.toLowerCase();
      return ALLOWED_AREAS.some((a) => hay.includes(a.toLowerCase()));
    };

    return NextResponse.json(
      data
        .filter(isAllowed)
        .slice(0, 5)
        .map((x) => ({ id: String(x.place_id), label: x.display_name })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
