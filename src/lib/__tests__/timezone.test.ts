import {
  BUSINESS_TIMEZONE,
  toBusinessCalendarDay,
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
