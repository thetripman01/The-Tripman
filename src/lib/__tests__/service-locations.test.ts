import {
  isLocationAvailableOn,
  findMatchingActiveLocation,
  formatPickupLocation,
} from "../service-locations";
import type { ServiceLocation } from "@prisma/client";

function loc(overrides: Partial<ServiceLocation>): ServiceLocation {
  return {
    id: "test-id",
    country: "Canada",
    city: "Toronto",
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    isDefault: false,
    note: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("isLocationAvailableOn", () => {
  it("returns true for always-on active location", () => {
    expect(isLocationAvailableOn(loc({}), new Date("2026-07-15"))).toBe(true);
  });

  it("returns false when isActive is false", () => {
    expect(
      isLocationAvailableOn(loc({ isActive: false }), new Date("2026-07-15")),
    ).toBe(false);
  });

  it("returns true on the first day of the window (inclusive lower bound)", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: new Date("2026-07-12T00:00:00Z"),
          availableUntil: new Date("2026-07-14T23:59:59Z"),
        }),
        new Date("2026-07-12T20:00:00Z"),
      ),
    ).toBe(true);
  });

  it("returns true on the last day of the window (inclusive upper bound)", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: new Date("2026-07-12T00:00:00Z"),
          availableUntil: new Date("2026-07-14T23:59:59Z"),
        }),
        new Date("2026-07-14T20:00:00Z"),
      ),
    ).toBe(true);
  });

  it("returns false the day before the window starts", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: new Date("2026-07-12T00:00:00Z"),
          availableUntil: new Date("2026-07-14T23:59:59Z"),
        }),
        new Date("2026-07-11T20:00:00Z"),
      ),
    ).toBe(false);
  });

  it("returns false the day after the window ends", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: new Date("2026-07-12T00:00:00Z"),
          availableUntil: new Date("2026-07-14T23:59:59Z"),
        }),
        new Date("2026-07-15T01:00:00Z"),
      ),
    ).toBe(false);
  });

  it("treats only-from as half-open lower bound", () => {
    const l = loc({ availableFrom: new Date("2026-07-12T00:00:00Z") });
    expect(isLocationAvailableOn(l, new Date("2026-07-11"))).toBe(false);
    expect(isLocationAvailableOn(l, new Date("2026-07-12"))).toBe(true);
    expect(isLocationAvailableOn(l, new Date("2026-12-31"))).toBe(true);
  });

  it("treats only-until as half-open upper bound", () => {
    const l = loc({ availableUntil: new Date("2026-07-14T23:59:59Z") });
    expect(isLocationAvailableOn(l, new Date("2025-01-01"))).toBe(true);
    expect(isLocationAvailableOn(l, new Date("2026-07-14"))).toBe(true);
    expect(isLocationAvailableOn(l, new Date("2026-07-15"))).toBe(false);
  });
});

describe("findMatchingActiveLocation", () => {
  const date = new Date("2026-07-15");
  const list = [
    loc({ id: "tor", country: "Canada", city: "Toronto" }),
    loc({ id: "mis", country: "Canada", city: "Mississauga" }),
    loc({
      id: "ott",
      country: "Canada",
      city: "Ottawa",
      availableFrom: new Date("2026-07-12T00:00:00Z"),
      availableUntil: new Date("2026-07-14T23:59:59Z"),
    }),
  ];

  it("returns the matching active location (case-insensitive)", () => {
    expect(
      findMatchingActiveLocation(list, "Canada", "Toronto", date)?.id,
    ).toBe("tor");
    expect(
      findMatchingActiveLocation(list, "canada", "toronto", date)?.id,
    ).toBe("tor");
    expect(
      findMatchingActiveLocation(list, "  Canada ", "  Toronto  ", date)?.id,
    ).toBe("tor");
  });

  it("returns null when the city is outside its date window", () => {
    expect(
      findMatchingActiveLocation(list, "Canada", "Ottawa", date),
    ).toBeNull();
  });

  it("returns the city when within the date window", () => {
    expect(
      findMatchingActiveLocation(
        list,
        "Canada",
        "Ottawa",
        new Date("2026-07-13"),
      )?.id,
    ).toBe("ott");
  });

  it("returns null for unknown country/city", () => {
    expect(
      findMatchingActiveLocation(list, "USA", "New York", date),
    ).toBeNull();
    expect(
      findMatchingActiveLocation(list, "Canada", "Hamilton", date),
    ).toBeNull();
  });
});

describe("formatPickupLocation", () => {
  it("formats structured fields when all present", () => {
    expect(
      formatPickupLocation({
        pickupCountry: "Canada",
        pickupCity: "Toronto",
        pickupAddress: "75 Laurelcrest Street",
        pickup: "ignored legacy value",
      }),
    ).toBe("75 Laurelcrest Street, Toronto, Canada");
  });

  it("falls back to legacy pickup when structured fields are missing", () => {
    expect(
      formatPickupLocation({
        pickupCountry: null,
        pickupCity: null,
        pickupAddress: null,
        pickup: "Old Address, Brampton",
      }),
    ).toBe("Old Address, Brampton");
  });

  it("returns null when nothing is set", () => {
    expect(
      formatPickupLocation({
        pickupCountry: null,
        pickupCity: null,
        pickupAddress: null,
        pickup: null,
      }),
    ).toBeNull();
  });

  it("falls back when structured fields are partially set", () => {
    expect(
      formatPickupLocation({
        pickupCountry: "Canada",
        pickupCity: null,
        pickupAddress: "75 Laurelcrest",
        pickup: "fallback",
      }),
    ).toBe("fallback");
  });
});
