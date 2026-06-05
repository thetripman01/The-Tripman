import {
  BUSINESS_TIMEZONE,
  BUSINESS_DAY_CUTOFF_HOUR,
  toBusinessCalendarDay,
  toBusinessSessionDay,
  businessDayStartUtc,
  businessDayEndUtc,
} from "../timezone";

// These tests pin the business-TZ behaviour that the location/availability
// logic depends on. If America/Toronto's DST rules change or the constant
// gets overridden in the environment, these will fail loudly.

describe("BUSINESS_TIMEZONE", () => {
  it("defaults to America/Toronto", () => {
    expect(BUSINESS_TIMEZONE).toBe("America/Toronto");
  });
});

describe("toBusinessCalendarDay", () => {
  it("returns the same day for a UTC midday timestamp", () => {
    expect(toBusinessCalendarDay(new Date("2026-06-15T12:00:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("rolls a late-evening UTC instant BACK to the previous day in EDT", () => {
    // 2am UTC on Jun 12 is 10pm EDT on Jun 11 (summer, UTC-4)
    expect(toBusinessCalendarDay(new Date("2026-06-12T02:00:00Z"))).toBe(
      "2026-06-11",
    );
  });

  it("correctly handles UTC midnight as previous calendar day", () => {
    // 00:00 UTC Jun 12 = 20:00 EDT Jun 11
    expect(toBusinessCalendarDay(new Date("2026-06-12T00:00:00Z"))).toBe(
      "2026-06-11",
    );
  });

  it("returns the new day after business-TZ midnight crosses", () => {
    // 04:00 UTC = midnight EDT
    expect(toBusinessCalendarDay(new Date("2026-06-12T04:00:00Z"))).toBe(
      "2026-06-12",
    );
  });

  it("respects EST (winter, UTC-5)", () => {
    // 04:00 UTC in January = 23:00 EST previous day
    expect(toBusinessCalendarDay(new Date("2026-01-15T04:00:00Z"))).toBe(
      "2026-01-14",
    );
    // 05:00 UTC in January = midnight EST = new day
    expect(toBusinessCalendarDay(new Date("2026-01-15T05:00:00Z"))).toBe(
      "2026-01-15",
    );
  });

  it("accepts string and number inputs", () => {
    expect(toBusinessCalendarDay("2026-06-15T18:00:00Z")).toBe("2026-06-15");
    expect(toBusinessCalendarDay(Date.UTC(2026, 5, 15, 18))).toBe("2026-06-15");
  });
});

describe("businessDayStartUtc", () => {
  it("returns midnight EDT (= 04:00 UTC) for a summer date", () => {
    expect(businessDayStartUtc("2026-06-12").toISOString()).toBe(
      "2026-06-12T04:00:00.000Z",
    );
  });

  it("returns midnight EST (= 05:00 UTC) for a winter date", () => {
    expect(businessDayStartUtc("2026-01-15").toISOString()).toBe(
      "2026-01-15T05:00:00.000Z",
    );
  });

  it("round-trips: toBusinessCalendarDay(businessDayStartUtc(d)) === d", () => {
    for (const day of [
      "2026-06-12",
      "2026-01-15",
      "2026-11-02",
      "2026-03-09",
    ]) {
      expect(toBusinessCalendarDay(businessDayStartUtc(day))).toBe(day);
    }
  });
});

describe("businessDayEndUtc", () => {
  it("returns end-of-day EDT for a summer date", () => {
    // 23:59:59.999 EDT = 03:59:59.999 UTC next day
    expect(businessDayEndUtc("2026-06-15").toISOString()).toBe(
      "2026-06-16T03:59:59.999Z",
    );
  });

  it("round-trips: toBusinessCalendarDay(businessDayEndUtc(d)) === d", () => {
    for (const day of ["2026-06-15", "2026-01-15", "2026-11-02"]) {
      expect(toBusinessCalendarDay(businessDayEndUtc(day))).toBe(day);
    }
  });
});

describe("toBusinessSessionDay (overnight shift)", () => {
  it("returns the configured default cutoff", () => {
    expect(BUSINESS_DAY_CUTOFF_HOUR).toBe(6);
  });

  it("attributes an early-evening slot to today", () => {
    // Jun 15 7pm EDT = Jun 15 23:00 UTC
    expect(toBusinessSessionDay(new Date("2026-06-15T23:00:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("attributes a late-evening slot to today", () => {
    // Jun 15 11pm EDT = Jun 16 03:00 UTC
    expect(toBusinessSessionDay(new Date("2026-06-16T03:00:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("attributes an after-midnight slot back to PREVIOUS day", () => {
    // Jun 16 1am EDT = Jun 16 05:00 UTC. Cutoff is 6am, so 1am < 6am
    // → still part of Jun 15's session.
    expect(toBusinessSessionDay(new Date("2026-06-16T05:00:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("attributes a 2:30am slot to PREVIOUS day", () => {
    // Jun 16 2:30am EDT = Jun 16 06:30 UTC
    expect(toBusinessSessionDay(new Date("2026-06-16T06:30:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("attributes a 5:59am slot to PREVIOUS day (cutoff boundary)", () => {
    // Jun 16 5:59am EDT = Jun 16 09:59 UTC
    expect(toBusinessSessionDay(new Date("2026-06-16T09:59:00Z"))).toBe(
      "2026-06-15",
    );
  });

  it("attributes a 6am slot to NEW day (at cutoff)", () => {
    // Jun 16 6am EDT = Jun 16 10:00 UTC — exactly at cutoff
    expect(toBusinessSessionDay(new Date("2026-06-16T10:00:00Z"))).toBe(
      "2026-06-16",
    );
  });

  it("attributes daytime to today", () => {
    expect(toBusinessSessionDay(new Date("2026-06-16T18:00:00Z"))).toBe(
      "2026-06-16",
    );
  });

  it("handles DST correctly (winter EST = UTC-5)", () => {
    // Jan 20 1am EST = Jan 20 06:00 UTC. Still before 6am cutoff.
    expect(toBusinessSessionDay(new Date("2026-01-20T06:00:00Z"))).toBe(
      "2026-01-19",
    );
    // Jan 20 6am EST = Jan 20 11:00 UTC. At cutoff.
    expect(toBusinessSessionDay(new Date("2026-01-20T11:00:00Z"))).toBe(
      "2026-01-20",
    );
  });
});
