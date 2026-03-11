export const TRIPMAN_PACKAGES = [
  {
    slug: "tripman-experience",
    name: "The Tripman Experience",
    durationMin: 60,
    price: {
      baseCents: 7000, // 70 CAD — journey/party only, 1–4 people
      maxPeople: 4,
    },
  },
  {
    slug: "tripman-experience-plus",
    name: "The Tripman Experience +",
    durationMin: 60,
    price: {
      baseCents: 27000, // 270 CAD — includes videos shot & shared, 1–4 people
      maxPeople: 4,
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

export function formatCad(cents: number) {
  return `$${(cents / 100).toFixed(0)} CAD`;
}

/** @deprecated Use formatCad for display. Kept for backward compatibility. */
export function formatUsd(cents: number) {
  return formatCad(cents);
}

export function getTripmanPackage(slug: string) {
  return TRIPMAN_PACKAGES.find((p) => p.slug === slug);
}

export function getTripmanFromPriceLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom";
  return `From ${formatCad(pkg.price.baseCents)}`;
}

export function getTripmanTierBreakdownLabel(slug: string) {
  const pkg = getTripmanPackage(slug);
  if (!pkg) return null;
  if (!pkg.price) return "Custom pricing";
  return `${formatCad(pkg.price.baseCents)} (1–4 people)`;
}

export function getTripmanPriceForPeople(
  slug: string,
  peopleCount: number | null | undefined,
) {
  const pkg = getTripmanPackage(slug);
  if (!pkg || !pkg.price) return null;
  if (!peopleCount || Number.isNaN(peopleCount)) return null;

  // 1–4 people only
  if (peopleCount >= 1 && peopleCount <= pkg.price.maxPeople) {
    return pkg.price.baseCents;
  }
  return null;
}
