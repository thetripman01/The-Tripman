import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { canonicalCountryKey, countryDisplayName } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];

  // Per-country tour landing pages (/Belgium, /Germany …) — country level only
  // to avoid duplicate content with the city URLs, which still work via direct
  // ad links. Best-effort: never let a DB hiccup break the sitemap.
  try {
    const tourLocs = await db.serviceLocation.findMany({
      where: {
        isActive: true,
        OR: [
          { availableFrom: { not: null } },
          { availableUntil: { not: null } },
        ],
      },
      select: { country: true },
    });

    const seen = new Set<string>();
    for (const loc of tourLocs) {
      const key = canonicalCountryKey(loc.country);
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        url: `${baseUrl}/${encodeURIComponent(countryDisplayName(loc.country))}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to load tour locations", error);
  }

  return entries;
}
