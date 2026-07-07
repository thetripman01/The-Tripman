import {
  formatBookingDate,
  formatBookingTime,
  formatBookingTimeRange,
  toBookingWallClock,
} from "../format-datetime";

// A single absolute instant: 2026-08-02 17:00:00 UTC.
//   - Europe/Amsterdam (CEST, +2) => 19:00 (7:00 PM), Sunday Aug 2
//   - America/Toronto  (EDT,  -4) => 13:00 (1:00 PM), Sunday Aug 2
const INSTANT = "2026-08-02T17:00:00Z";

describe("formatBookingDate", () => {
  it("formats in the booking's timezone", () => {
    expect(formatBookingDate(INSTANT, "Europe/Amsterdam")).toBe(
      "Sunday, August 2, 2026",
    );
  });

  it("can land on a different calendar day depending on the zone", () => {
    // 02:00 UTC Aug 2 is still Aug 1 (10pm) in Toronto, but Aug 2 in Amsterdam.
    const lateInstant = "2026-08-02T02:00:00Z";
    expect(formatBookingDate(lateInstant, "America/Toronto")).toBe(
      "Saturday, August 1, 2026",
    );
    expect(formatBookingDate(lateInstant, "Europe/Amsterdam")).toBe(
      "Sunday, August 2, 2026",
    );
  });

  it("falls back to Toronto when no zone is given", () => {
    expect(formatBookingDate(INSTANT)).toBe("Sunday, August 2, 2026");
    expect(formatBookingDate(INSTANT, null)).toBe("Sunday, August 2, 2026");
    expect(formatBookingDate(INSTANT, "")).toBe("Sunday, August 2, 2026");
  });
});

describe("formatBookingTime", () => {
  it("shows the local wall-clock time of the booking's zone", () => {
    expect(formatBookingTime(INSTANT, "Europe/Amsterdam")).toMatch(/^7:00 PM/);
    expect(formatBookingTime(INSTANT, "America/Toronto")).toMatch(/^1:00 PM/);
  });

  it("includes a zone abbreviation so it's unambiguous", () => {
    expect(formatBookingTime(INSTANT, "America/Toronto")).toContain("EDT");
  });

  it("defaults to Toronto when no zone is given", () => {
    expect(formatBookingTime(INSTANT)).toMatch(/^1:00 PM/);
  });
});

describe("formatBookingTimeRange", () => {
  it("shows start – end in one zone with a trailing label", () => {
    const out = formatBookingTimeRange(
      INSTANT,
      "2026-08-02T18:00:00Z",
      "Europe/Amsterdam",
    );
    expect(out).toMatch(/^7:00 PM – 8:00 PM/);
  });
});

describe("toBookingWallClock", () => {
  it("produces the booked wall-clock time with no offset", () => {
    expect(toBookingWallClock(INSTANT, "Europe/Amsterdam")).toBe(
      "2026-08-02T19:00:00",
    );
    expect(toBookingWallClock(INSTANT, "America/Toronto")).toBe(
      "2026-08-02T13:00:00",
    );
  });

  it("can shift the calendar day relative to UTC", () => {
    // 02:00 UTC Aug 2 = 10pm Aug 1 in Toronto.
    expect(toBookingWallClock("2026-08-02T02:00:00Z", "America/Toronto")).toBe(
      "2026-08-01T22:00:00",
    );
  });

  it("defaults to Toronto when no zone is given", () => {
    expect(toBookingWallClock(INSTANT)).toBe("2026-08-02T13:00:00");
  });
});
