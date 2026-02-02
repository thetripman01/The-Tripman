import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 3) {
    return NextResponse.json([]);
  }

  // Nominatim (OpenStreetMap) suggestions.
  // This is best-effort and optional (pickup is not required).
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

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
    }>;

    return NextResponse.json(
      data.map((x) => ({ id: String(x.place_id), label: x.display_name })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
