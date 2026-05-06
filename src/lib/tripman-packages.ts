export const TRIPMAN_PACKAGES = [
  {
    slug: "tripman-experience",
    name: "The Tripman Experience",
    durationMin: 60,
    price: {
      baseCents: 9900, // 99 CAD — single flat rate, 1–4 people. Video feature not guaranteed.
      maxPeople: 4,
    },
  },
] as const;

export type TripmanPackageSlug = (typeof TRIPMAN_PACKAGES)[number]["slug"];

export function formatCad(cents: number) {
  const dollars = cents / 100;
  // Whole dollars: "$99 CAD". Otherwise: "$99.50 CAD".
  const formatted = Number.isInteger(dollars)
    ? dollars.toFixed(0)
    : dollars.toFixed(2);
  return `$${formatted} CAD`;
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
  return formatCad(pkg.price.baseCents);
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
