import {
  isLocationAvailableOn,
  findMatchingActiveLocation,
  formatPickupLocation,
  filterBookableLocations,
  isLocationBookableOn,
} from "../service-locations";
import {
  businessDayStartUtc,
  businessDayEndUtc,
  sessionAnchorUtc,
} from "../timezone";
import type { ServiceLocation } from "@prisma/client";

/**
 * Test helper: returns a Date for 2pm EDT on the given YYYY-MM-DD. We use
 * this instead of `businessDayStartUtc` for "anchor dates" in tests because
 * businessDayStartUtc is midnight EDT — which the session-day model
 * attributes back to the PREVIOUS calendar day (since 0am < 6am cutoff).
 * An afternoon timestamp unambiguously belongs to the named day.
 */
function businessAfternoon(yyyyMmDd: string): Date {
  return new Date(
    businessDayStartUtc(yyyyMmDd).getTime() + 14 * 60 * 60 * 1000,
  );
}

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
          availableFrom: businessDayStartUtc("2026-07-12"),
          availableUntil: businessDayEndUtc("2026-07-14"),
        }),
        // 8pm EDT on Jul 12 (within window)
        new Date("2026-07-13T00:00:00Z"),
      ),
    ).toBe(true);
  });

  it("returns true on the last day of the window (inclusive upper bound)", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: businessDayStartUtc("2026-07-12"),
          availableUntil: businessDayEndUtc("2026-07-14"),
        }),
        // 11pm EDT on Jul 14 — still Jul 14 in business TZ
        new Date("2026-07-15T03:00:00Z"),
      ),
    ).toBe(true);
  });

  it("returns false the day before the window starts", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: businessDayStartUtc("2026-07-12"),
          availableUntil: businessDayEndUtc("2026-07-14"),
        }),
        // 8pm EDT on Jul 11
        new Date("2026-07-12T00:00:00Z"),
      ),
    ).toBe(false);
  });

  it("returns false the day after the window ends", () => {
    expect(
      isLocationAvailableOn(
        loc({
          availableFrom: businessDayStartUtc("2026-07-12"),
          availableUntil: businessDayEndUtc("2026-07-14"),
        }),
        // 8pm EDT on Jul 15
        new Date("2026-07-16T00:00:00Z"),
      ),
    ).toBe(false);
  });

  it("treats only-from as half-open lower bound", () => {
    const l = loc({ availableFrom: businessDayStartUtc("2026-07-12") });
    expect(isLocationAvailableOn(l, businessAfternoon("2026-07-11"))).toBe(
      false,
    );
    expect(isLocationAvailableOn(l, businessAfternoon("2026-07-12"))).toBe(
      true,
    );
    expect(isLocationAvailableOn(l, businessAfternoon("2026-12-31"))).toBe(
      true,
    );
  });

  it("treats only-until as half-open upper bound", () => {
    const l = loc({ availableUntil: businessDayEndUtc("2026-07-14") });
    expect(isLocationAvailableOn(l, businessAfternoon("2025-01-01"))).toBe(
      true,
    );
    expect(isLocationAvailableOn(l, businessAfternoon("2026-07-14"))).toBe(
      true,
    );
    expect(isLocationAvailableOn(l, businessAfternoon("2026-07-15"))).toBe(
      false,
    );
  });

  // Tripman runs an OVERNIGHT shift (7pm → 3am). A booking at 1am Jun 16
  // EDT is part of "Jun 15's night session", not Jun 16's. These tests pin
  // the exact bug Bekir flagged: a Jun 15 night slot was wrongly showing
  // the Jun 16 tour city. Session-day attribution fixes it.
  describe("overnight tour-window edge case (Bekir's bug)", () => {
    const ottawaTour = loc({
      country: "Canada",
      city: "Ottawa",
      availableFrom: businessDayStartUtc("2026-06-12"),
      availableUntil: businessDayEndUtc("2026-06-15"),
    });

    it("11pm EDT on Jun 11 — still Jun 11 session, Ottawa NOT yet open", () => {
      // Jun 11 23:00 EDT = Jun 12 03:00 UTC
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-12T03:00:00Z")),
      ).toBe(false);
    });

    it("2am EDT on Jun 12 — STILL Jun 11 session (overnight tail), Ottawa NOT yet", () => {
      // Jun 12 02:00 EDT = Jun 12 06:00 UTC. Tour hasn't started — Ottawa
      // arrives Jun 12 evening, not the wee hours of Jun 12 morning.
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-12T06:00:00Z")),
      ).toBe(false);
    });

    it("7pm EDT on Jun 12 — Jun 12 session, Ottawa available", () => {
      // Jun 12 19:00 EDT = Jun 12 23:00 UTC
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-12T23:00:00Z")),
      ).toBe(true);
    });

    it("8pm EDT on Jun 15 — Jun 15 session, Ottawa available", () => {
      // Jun 15 20:00 EDT = Jun 16 00:00 UTC
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-16T00:00:00Z")),
      ).toBe(true);
    });

    it("1am EDT on Jun 16 — STILL Jun 15 session, Ottawa STILL available", () => {
      // THE BUG: this was returning false (showing Montreal too early).
      // Jun 16 01:00 EDT = Jun 16 05:00 UTC.
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-16T05:00:00Z")),
      ).toBe(true);
    });

    it("2:30am EDT on Jun 16 — still Jun 15 session, Ottawa available", () => {
      // Jun 16 02:30 EDT = Jun 16 06:30 UTC
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-16T06:30:00Z")),
      ).toBe(true);
    });

    it("7pm EDT on Jun 16 — Jun 16 session, Ottawa OUT (tour ended)", () => {
      // Jun 16 19:00 EDT = Jun 16 23:00 UTC
      expect(
        isLocationAvailableOn(ottawaTour, new Date("2026-06-16T23:00:00Z")),
      ).toBe(false);
    });

    // Companion: Montreal is the next tour. It MUST NOT appear during
    // Jun 15's overnight session.
    it("Montreal (Jun 16–20) is hidden during Jun 15 overnight tail", () => {
      const montrealTour = loc({
        country: "Canada",
        city: "Montreal",
        availableFrom: businessDayStartUtc("2026-06-16"),
        availableUntil: businessDayEndUtc("2026-06-20"),
      });
      // 1am Jun 16 EDT — Bekir's scenario
      expect(
        isLocationAvailableOn(montrealTour, new Date("2026-06-16T05:00:00Z")),
      ).toBe(false);
      // 2:30am Jun 16 EDT
      expect(
        isLocationAvailableOn(montrealTour, new Date("2026-06-16T06:30:00Z")),
      ).toBe(false);
      // 7pm Jun 16 EDT — Montreal correctly opens
      expect(
        isLocationAvailableOn(montrealTour, new Date("2026-06-16T23:00:00Z")),
      ).toBe(true);
    });
  });
});

describe("findMatchingActiveLocation", () => {
  const date = businessAfternoon("2026-07-15");
  const list = [
    loc({ id: "tor", country: "Canada", city: "Toronto" }),
    loc({ id: "mis", country: "Canada", city: "Mississauga" }),
    loc({
      id: "ott",
      country: "Canada",
      city: "Ottawa",
      availableFrom: businessDayStartUtc("2026-07-12"),
      availableUntil: businessDayEndUtc("2026-07-14"),
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
        businessAfternoon("2026-07-13"),
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
      businessAfternoon("2026-07-15"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });

  it("hides non-exclusive cities when an exclusive city covers the date", () => {
    const montreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      exclusive: true,
      availableFrom: businessDayStartUtc("2026-07-18"),
      availableUntil: businessDayEndUtc("2026-07-21"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, montreal],
      businessAfternoon("2026-07-19"),
    );
    expect(result.map((l) => l.id)).toEqual(["mtl"]);
  });

  it("returns GTA again outside the exclusive window", () => {
    const montreal = loc({
      id: "mtl",
      country: "Canada",
      city: "Montreal",
      exclusive: true,
      availableFrom: businessDayStartUtc("2026-07-18"),
      availableUntil: businessDayEndUtc("2026-07-21"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, montreal],
      businessAfternoon("2026-07-22"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mis", "tor"]);
  });

  it("supports multiple coexisting exclusives (e.g. USA tour with NY + NJ)", () => {
    const ny = loc({
      id: "ny",
      country: "USA",
      city: "New York",
      exclusive: true,
      availableFrom: businessDayStartUtc("2026-07-25"),
      availableUntil: businessDayEndUtc("2026-07-27"),
    });
    const nj = loc({
      id: "nj",
      country: "USA",
      city: "New Jersey",
      exclusive: true,
      availableFrom: businessDayStartUtc("2026-07-25"),
      availableUntil: businessDayEndUtc("2026-07-27"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, ny, nj],
      businessAfternoon("2026-07-26"),
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
      availableFrom: businessDayStartUtc("2025-01-01"),
      availableUntil: businessDayEndUtc("2025-01-03"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, pastMontreal],
      businessAfternoon("2026-07-19"),
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
      availableFrom: businessDayStartUtc("2026-07-18"),
      availableUntil: businessDayEndUtc("2026-07-21"),
    });
    const result = filterBookableLocations(
      [toronto, mississauga, inactiveMontreal],
      businessAfternoon("2026-07-19"),
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
    availableFrom: businessDayStartUtc("2026-07-18"),
    availableUntil: businessDayEndUtc("2026-07-21"),
  });

  it("returns true for an always-on city outside any exclusive window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Toronto" },
        [toronto, montrealExclusive],
        businessAfternoon("2026-07-22"),
      ),
    ).toBe(true);
  });

  it("returns false for an always-on city during an exclusive window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Toronto" },
        [toronto, montrealExclusive],
        businessAfternoon("2026-07-19"),
      ),
    ).toBe(false);
  });

  it("returns true for the exclusive city during its window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Montreal" },
        [toronto, montrealExclusive],
        businessAfternoon("2026-07-19"),
      ),
    ).toBe(true);
  });

  it("returns false for the exclusive city OUTSIDE its window", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Montreal" },
        [toronto, montrealExclusive],
        businessAfternoon("2026-07-22"),
      ),
    ).toBe(false);
  });

  it("is case-insensitive on country/city match", () => {
    expect(
      isLocationBookableOn(
        { country: "  CANADA ", city: " toronto " },
        [toronto],
        businessAfternoon("2026-07-22"),
      ),
    ).toBe(true);
  });

  it("returns false for an unknown city", () => {
    expect(
      isLocationBookableOn(
        { country: "Canada", city: "Hamilton" },
        [toronto, montrealExclusive],
        businessAfternoon("2026-07-22"),
      ),
    ).toBe(false);
  });
});

// Bekir's reproduction: Ottawa Jun 12-15, Montreal Jun 16-20. Before the
// fix, querying for Jun 16 returned Ottawa (because the public API passed
// midnight EDT, which session-day rolled back to Jun 15). This block uses
// sessionAnchorUtc() — the same anchor the API now uses — so a regression
// in either the API or sessionAnchorUtc trips here loudly.
describe("Bekir's last-day overlap bug (regression pin)", () => {
  const ottawa = loc({
    id: "ott",
    country: "Canada",
    city: "Ottawa",
    availableFrom: businessDayStartUtc("2026-06-12"),
    availableUntil: businessDayEndUtc("2026-06-15"),
  });
  const montreal = loc({
    id: "mtl",
    country: "Canada",
    city: "Montreal",
    availableFrom: businessDayStartUtc("2026-06-16"),
    availableUntil: businessDayEndUtc("2026-06-20"),
  });
  const cities = [ottawa, montreal];

  it("Jun 12 (first day) — Ottawa shown, Montreal NOT", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-12"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["ott"]);
  });

  it("Jun 15 (Ottawa last day) — Ottawa shown, Montreal NOT", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-15"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["ott"]);
  });

  it("Jun 16 (Montreal first day) — Montreal shown, Ottawa NOT (THE bug)", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-16"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mtl"]);
  });

  it("Jun 20 (Montreal last day) — Montreal shown, Ottawa NOT", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-20"),
    );
    expect(result.map((l) => l.id).sort()).toEqual(["mtl"]);
  });

  it("Jun 21 (after both tours) — neither shown", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-21"),
    );
    expect(result.map((l) => l.id)).toEqual([]);
  });

  it("Jun 11 (before either tour) — neither shown", () => {
    const result = filterBookableLocations(
      cities,
      sessionAnchorUtc("2026-06-11"),
    );
    expect(result.map((l) => l.id)).toEqual([]);
  });
});
