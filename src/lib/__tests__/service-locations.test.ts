import {
  isLocationAvailableOn,
  findMatchingActiveLocation,
  formatPickupLocation,
  filterBookableLocations,
  isLocationBookableOn,
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
    exclusive: false,
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

describe("filterBookableLocations (exclusive mode)", () => {
  // GTA always-on cities used in the scenarios below.
  const toronto = loc({ id: "tor", country: "Canada", city: "Toronto" });
  const mississauga = loc({
    id: "mis",
    country: "Canada",
    city: "Mississauga",
  });

  it("returns all available locations when no exclusive is active", () => {
    const result = filterBookableLocations(
      [toronto, mississauga],
      new Date("2026-07-15"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });

  it("hides non-exclusive cities when an exclusive city covers the date", () => {
    const montreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      exclusive: true,
      availableFrom: new Date("2026-07-18T00:00:00Z"),
      availableUntil: new Date("2026-07-21T23:59:59Z"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, montreal],
      new Date("2026-07-19"),
    );
    expect(result.map((l) => l.id)).toEqual(["mtl"]);
  });

  it("returns GTA again outside the exclusive window", () => {
    const montreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      exclusive: true,
      availableFrom: new Date("2026-07-18T00:00:00Z"),
      availableUntil: new Date("2026-07-21T23:59:59Z"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, montreal],
      new Date("2026-07-22"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });

  it("supports multiple coexisting exclusives (e.g. USA tour with NY + NJ)", () => {
    const ny = loc({
      id: "ny",
      country: "USA",
      city: "New York",
      exclusive: true,
      availableFrom: new Date("2026-07-25T00:00:00Z"),
      availableUntil: new Date("2026-07-27T23:59:59Z"),
    });
    const nj = loc({
      id: "nj",
      country: "USA",
      city: "New Jersey",
      exclusive: true,
      availableFrom: new Date("2026-07-25T00:00:00Z"),
      availableUntil: new Date("2026-07-27T23:59:59Z"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, ny, nj],
      new Date("2026-07-26"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["nj", "ny"]);
  });

  it("ignores exclusive cities outside their window when computing exclusive mode", () => {
    // Montreal is exclusive but its window has passed — should NOT hide GTA.
    const pastMontreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      exclusive: true,
      availableFrom: new Date("2025-01-01T00:00:00Z"),
      availableUntil: new Date("2025-01-03T23:59:59Z"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, pastMontreal],
      new Date("2026-07-19"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });

  it("ignores inactive exclusive cities", () => {
    const inactiveMontreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      isActive: false,
      exclusive: true,
      availableFrom: new Date("2026-07-18T00:00:00Z"),
      availableUntil: new Date("2026-07-21T23:59:59Z"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, inactiveMontreal],
      new Date("2026-07-19"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });
});

describe("isLocationBookableOn", () => {
  const toronto = loc({ id: "tor", country: "Canada", city: "Toronto" });
  const montrealExclusive = loc({
    id: "mtl",
    country: "Canada",
    city: "Montreal",
    exclusive: true,
    availableFrom: new Date("2026-07-18T00:00:00Z"),
    availableUntil: new Date("2026-07-21T23:59:59Z"),
  });

  it("returns true for an always-on city outside any exclusive window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Toronto" },
        [toronto, montrealExclusive],
        new Date("2026-07-22"),
      ),
    ).toBe(true);
  });

  it("returns false for an always-on city during an exclusive window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Toronto" },
        [toronto, montrealExclusive],
        new Date("2026-07-19"),
      ),
    ).toBe(false);
  });

  it("returns true for the exclusive city during its window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Montreal" },
        [toronto, montrealExclusive],
        new Date("2026-07-19"),
      ),
    ).toBe(true);
  });

  it("returns false for the exclusive city OUTSIDE its window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Montreal" },
        [toronto, montrealExclusive],
        new Date("2026-07-22"),
      ),
    ).toBe(false);
  });

  it("is case-insensitive on country/city match", () => {
    expect(
      isLocationBookableOn(
        { country: "  CANADA ", city: " toronto " },
        [toronto],
        new Date("2026-07-22"),
      ),
    ).toBe(true);
  });

  it("returns false for an unknown city", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Hamilton" },
        [toronto, montrealExclusive],
        new Date("2026-07-22"),
      ),
    ).toBe(false);
  });
});
