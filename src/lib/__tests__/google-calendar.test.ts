import { googleCalendarEventUrl } from "../google-calendar";

describe("googleCalendarEventUrl", () => {
  const base = {
    title: "The Tripman Experience — Jane Doe",
    start: "2026-08-02T17:00:00Z",
    end: "2026-08-02T18:00:00Z",
  };

  it("builds a template URL with UTC basic timestamps", () => {
    const url = new URL(googleCalendarEventUrl(base));
    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(base.title);
    expect(url.searchParams.get("dates")).toBe(
      "20260802T170000Z/20260802T180000Z",
    );
  });

  it("carries the booking timezone via ctz", () => {
    const url = new URL(
      googleCalendarEventUrl({ ...base, timezone: "Europe/Amsterdam" }),
    );
    expect(url.searchParams.get("ctz")).toBe("Europe/Amsterdam");
  });

  it("omits ctz for blank/missing timezone", () => {
    expect(googleCalendarEventUrl(base)).not.toContain("ctz=");
    expect(googleCalendarEventUrl({ ...base, timezone: "  " })).not.toContain(
      "ctz=",
    );
  });

  it("includes optional details and location, URL-encoded", () => {
    const url = new URL(
      googleCalendarEventUrl({
        ...base,
        details: "Customer: Jane\nPhone: +1 555",
        location: "75 Laurelcrest Street, Brampton, Canada",
      }),
    );
    expect(url.searchParams.get("details")).toBe(
      "Customer: Jane\nPhone: +1 555",
    );
    expect(url.searchParams.get("location")).toBe(
      "75 Laurelcrest Street, Brampton, Canada",
    );
  });

  it("accepts Date objects as well as ISO strings", () => {
    const url = new URL(
      googleCalendarEventUrl({
        ...base,
        start: new Date("2026-08-02T17:00:00Z"),
        end: new Date("2026-08-02T18:00:00Z"),
      }),
    );
    expect(url.searchParams.get("dates")).toBe(
      "20260802T170000Z/20260802T180000Z",
    );
  });
});
