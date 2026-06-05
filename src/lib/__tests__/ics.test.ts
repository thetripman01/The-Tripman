import { generateICS, generateICSForDownload } from "../ics";

describe("ICS Generation", () => {
  const mockBooking = {
    id: "test-booking-id",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    notes: "Test booking notes",
    timezone: "America/Toronto",
    startsAt: new Date("2024-01-15T15:00:00Z"),
    endsAt: new Date("2024-01-15T16:00:00Z"),
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    pickup: "123 Main St",
    pickupCountry: null,
    pickupCity: null,
    pickupAddress: null,
    peopleCount: 2,
    subtotalCents: null,
    taxCents: null,
    taxRate: null,
    currency: null,
    eventTypeId: "event-type-id",
    status: "PENDING",
    eventType: {
      id: "event-type-id",
      slug: "tripman-experience",
      name: "The Tripman Experience",
      description:
        "One full hour of chaos, music, and unforgettable energy. 1–4 people: $200 • 5–7 people: $400.",
      durationMin: 60,
      priceCents: 20000,
      isActive: true,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
    },
  };

  describe("generateICS", () => {
    it("should generate valid ICS content structure", () => {
      const icsContent = generateICS(mockBooking);

      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("VERSION:2.0");
      expect(icsContent).toContain("PRODID:-//The Tripman//Booking System//EN");
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("UID:test-booking-id");
      expect(icsContent).toContain(
        "SUMMARY:The Tripman Experience with The Tripman",
      );
      expect(icsContent).toContain("DESCRIPTION:Booking Details:");
      expect(icsContent).toContain("LOCATION:123 Main St");
      expect(icsContent).toContain("END:VEVENT");
      expect(icsContent).toContain("END:VCALENDAR");
    });

    it("should handle missing optional fields", () => {
      const bookingWithoutOptional = {
        ...mockBooking,
        phone: undefined,
        notes: undefined,
        pickup: undefined,
        peopleCount: undefined,
      };

      const icsContent = generateICS(bookingWithoutOptional);

      expect(icsContent).toContain(
        "SUMMARY:The Tripman Experience with The Tripman",
      );
      expect(icsContent).not.toContain("PHONE:");
      expect(icsContent).not.toContain("NOTES:");
      expect(icsContent).not.toContain("LOCATION:");
    });

    it("should include reminder", () => {
      const icsContent = generateICS(mockBooking);

      expect(icsContent).toContain("BEGIN:VALARM");
      expect(icsContent).toContain("ACTION:DISPLAY");
      expect(icsContent).toContain(
        "DESCRIPTION:Reminder: Your TripMan booking is in 15 minutes",
      );
      expect(icsContent).toContain("TRIGGER:-PT15M");
      expect(icsContent).toContain("END:VALARM");
    });
  });

  describe("structured pickup location", () => {
    it("uses structured pickup fields when present", () => {
      const structured = {
        ...mockBooking,
        pickup: null,
        pickupCountry: "Canada",
        pickupCity: "Toronto",
        pickupAddress: "75 Laurelcrest Street",
      };
      const ics = generateICS(structured);
      expect(ics).toContain(
        "LOCATION:75 Laurelcrest Street\\, Toronto\\, Canada",
      );
    });

    it("falls back to legacy pickup when structured fields are missing", () => {
      const ics = generateICS(mockBooking); // legacy pickup="123 Main St"
      expect(ics).toContain("LOCATION:123 Main St");
    });
  });

  describe("generateICSForDownload", () => {
    it("should return ICS content as string", () => {
      const icsContent = generateICSForDownload(mockBooking);

      expect(typeof icsContent).toBe("string");
      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("END:VCALENDAR");
    });

    it("should be identical to generateICS", () => {
      const ics1 = generateICS(mockBooking);
      const ics2 = generateICSForDownload(mockBooking);

      expect(ics1).toBe(ics2);
    });
  });
});
