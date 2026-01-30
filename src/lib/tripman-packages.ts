export const TRIPMAN_PACKAGES = [
  {
    slug: "tripman-experience",
    name: "The Tripman Experience",
    durationMin: 60,
    price: {
      baseCents: 20000, // 1–4 people
      largeCents: 40000, // 5–7 people
      maxPeople: 7,
    },
  },
  {
    slug: "tripman-experience-plus",
    name: "The Tripman Experience +",
    durationMin: 60,
    price: {
      baseCents: 50000, // 1–4 people
      largeCents: 70000, // 5–7 people
      maxPeople: 7,
    },
  },
  {
    slug: "tripman-promo-ride",
    name: "The Tripman Promo Ride",
    durationMin: 60,
    price: null,
  },
] as const;

export type TripmanPackageSlug = (typeof TRIPMAN_PACKAGES)[number]["slug"];

export function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function getTripmanPackage(slug: string) {
  return TRIPMAN_PACKAGES.find((p) => p.slug === slug);
}

export function getTripmanFromPriceLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom";
  return `From ${formatUsd(pkg.price.baseCents)}`;
}

export function getTripmanTierBreakdownLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom pricing";
  return `1–4: ${formatUsd(pkg.price.baseCents)} · 5–7: ${formatUsd(pkg.price.largeCents)}`;
}

export function getTripmanPriceForPeople(
  slug: string,
  peopleCount: number | null | undefined,
) {
  const pkg = getTripmanPackage(slug);
  if (!pkg || !pkg.price) return null;
  if (!peopleCount || Number.isNaN(peopleCount)) return null;

  // Pricing tiers per PDF:
  // 1–4 people: base price
  // 4–7 people: large price
  // We treat 4 as part of the lower tier to avoid overlap; 5–7 uses large tier.
  if (peopleCount <= 4) return pkg.price.baseCents;
  if (peopleCount <= pkg.price.maxPeople) return pkg.price.largeCents;
  return null;
}
