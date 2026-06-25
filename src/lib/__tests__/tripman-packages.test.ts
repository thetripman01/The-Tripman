import {
  formatCad,
  formatUsd,
  formatEur,
  formatQuoteTotal,
  formatQuoteSubtotal,
  formatQuoteTax,
  computeTaxCents,
  getTripmanPriceForPeople,
  getTripmanPackage,
  getTripmanFromPriceLabel,
  getTripmanTierBreakdownLabel,
  getTripmanQuoteForBooking,
  TRIPMAN_USD_FLAT_CENTS,
  TRIPMAN_EUR_FLAT_CENTS,
  TRIPMAN_TAX_RATE,
} from "../tripman-packages";

describe("tripman-packages", () => {
  describe("formatCad", () => {
    it("formats whole dollars without decimals", () => {
      expect(formatCad(9900)).toBe("$99 CAD");
      expect(formatCad(7000)).toBe("$70 CAD");
    });
    it("includes decimals when cents are present", () => {
      expect(formatCad(9999)).toBe("$99.99 CAD");
    });
  });

  describe("getTripmanPriceForPeople", () => {
    it("returns 9900 for tripman-experience with 1-4 people", () => {
      expect(getTripmanPriceForPeople("tripman-experience", 1)).toBe(9900);
      expect(getTripmanPriceForPeople("tripman-experience", 2)).toBe(9900);
      expect(getTripmanPriceForPeople("tripman-experience", 4)).toBe(9900);
    });

    it("returns null for 5+ people", () => {
      expect(getTripmanPriceForPeople("tripman-experience", 5)).toBeNull();
      expect(getTripmanPriceForPeople("tripman-experience", 7)).toBeNull();
    });

    it("returns null for unknown package slug", () => {
      expect(getTripmanPriceForPeople("tripman-experience-plus", 2)).toBeNull();
      expect(getTripmanPriceForPeople("tripman-promo-ride", 2)).toBeNull();
    });

    it("returns null for invalid peopleCount", () => {
      expect(getTripmanPriceForPeople("tripman-experience", 0)).toBeNull();
      expect(getTripmanPriceForPeople("tripman-experience", null)).toBeNull();
      expect(getTripmanPriceForPeople("tripman-experience", NaN)).toBeNull();
    });
  });

  describe("getTripmanPackage", () => {
    it("returns package by slug", () => {
      const pkg = getTripmanPackage("tripman-experience");
      expect(pkg?.slug).toBe("tripman-experience");
      expect(pkg?.name).toBe("The Tripman Experience");
    });

    it("returns undefined for unknown slug", () => {
      expect(getTripmanPackage("unknown")).toBeUndefined();
    });
  });

  describe("getTripmanFromPriceLabel", () => {
    it("returns formatted price for the experience package", () => {
      expect(getTripmanFromPriceLabel("tripman-experience")).toBe("$99 CAD");
    });

    it("returns null for unknown packages", () => {
      expect(getTripmanFromPriceLabel("tripman-promo-ride")).toBeNull();
    });
  });

  describe("getTripmanTierBreakdownLabel", () => {
    it("returns tier breakdown for the experience package", () => {
      expect(getTripmanTierBreakdownLabel("tripman-experience")).toContain(
        "1–4 people",
      );
      expect(getTripmanTierBreakdownLabel("tripman-experience")).toContain(
        "$99 CAD",
      );
    });
  });

  describe("formatUsd / format helpers", () => {
    it("formats whole USD amounts", () => {
      expect(formatUsd(11000)).toBe("$110 USD");
      expect(formatUsd(9999)).toBe("$99.99 USD");
    });

    it("formatQuoteTotal returns total in correct currency", () => {
      expect(
        formatQuoteTotal({
          subtotalCents: 9900,
          taxCents: 1287,
          totalCents: 11187,
          taxRate: 0.13,
          taxLabel: "HST",
          currency: "cad",
        }),
      ).toBe("$111.87 CAD");
      expect(
        formatQuoteTotal({
          subtotalCents: 11000,
          taxCents: 1430,
          totalCents: 12430,
          taxRate: 0.13,
          taxLabel: "Sales tax",
          currency: "usd",
        }),
      ).toBe("$124.30 USD");
    });

    it("formats whole EUR amounts with the euro sign", () => {
      expect(formatEur(8000)).toBe("€80 EUR");
      expect(formatEur(9040)).toBe("€90.40 EUR");
    });

    it("formatQuoteTotal returns EUR total for European pickups", () => {
      expect(
        formatQuoteTotal({
          subtotalCents: 8000,
          taxCents: 1040,
          totalCents: 9040,
          taxRate: 0.13,
          taxLabel: "VAT",
          currency: "eur",
        }),
      ).toBe("€90.40 EUR");
    });

    it("formatQuoteSubtotal shows pre-tax amount", () => {
      expect(
        formatQuoteSubtotal({
          subtotalCents: 9900,
          taxCents: 1287,
          totalCents: 11187,
          taxRate: 0.13,
          taxLabel: "HST",
          currency: "cad",
        }),
      ).toBe("$99 CAD");
    });

    it("formatQuoteTax shows tax line", () => {
      expect(
        formatQuoteTax({
          subtotalCents: 9900,
          taxCents: 1287,
          totalCents: 11187,
          taxRate: 0.13,
          taxLabel: "HST",
          currency: "cad",
        }),
      ).toBe("$12.87 CAD HST (13%)");
    });
  });

  describe("computeTaxCents", () => {
    it("computes 13% tax with banker rounding", () => {
      expect(computeTaxCents(9900, 0.13)).toBe(1287); // 99 * 0.13 = 12.87
      expect(computeTaxCents(11000, 0.13)).toBe(1430); // 110 * 0.13 = 14.30
    });

    it("rounds to nearest cent (not floor)", () => {
      // 1001 * 0.13 = 130.13 → rounds to 130 cents
      expect(computeTaxCents(1001, 0.13)).toBe(130);
      // 105 * 0.13 = 13.65 → rounds to 14
      expect(computeTaxCents(105, 0.13)).toBe(14);
    });

    it("returns 0 for 0 subtotal", () => {
      expect(computeTaxCents(0, 0.13)).toBe(0);
    });
  });

  describe("getTripmanQuoteForBooking (with tax)", () => {
    it("returns CAD breakdown for Canada pickups", () => {
      const q = getTripmanQuoteForBooking("tripman-experience", 2, "Canada");
      expect(q).toEqual({
        subtotalCents: 9900,
        taxCents: 1287, // 99 * 0.13
        totalCents: 11187,
        taxRate: TRIPMAN_TAX_RATE,
        taxLabel: "HST",
        currency: "cad",
      });
    });

    it("returns USD breakdown for USA pickups (Sales tax label)", () => {
      const q = getTripmanQuoteForBooking("tripman-experience", 2, "USA");
      expect(q).toEqual({
        subtotalCents: TRIPMAN_USD_FLAT_CENTS,
        taxCents: 1430, // 110 * 0.13
        totalCents: 12430,
        taxRate: TRIPMAN_TAX_RATE,
        taxLabel: "Sales tax",
        currency: "usd",
      });
    });

    it("returns EUR breakdown for European tour pickups (VAT label, 80€ + 13%)", () => {
      const q = getTripmanQuoteForBooking("tripman-experience", 2, "France");
      expect(q).toEqual({
        subtotalCents: TRIPMAN_EUR_FLAT_CENTS, // 8000 (80 EUR)
        taxCents: 1040, // 80 * 0.13 = 10.40
        totalCents: 9040, // 90.40 EUR
        taxRate: TRIPMAN_TAX_RATE,
        taxLabel: "VAT",
        currency: "eur",
      });
    });

    it("bills every European tour country in EUR (incl. the Belguim typo)", () => {
      for (const country of [
        "Belguim",
        "Switzerland",
        "Italy",
        "Germany",
        "Czechia",
        "Netherlands",
      ]) {
        expect(
          getTripmanQuoteForBooking("tripman-experience", 1, country)?.currency,
        ).toBe("eur");
      }
    });

    it("recognizes USA synonyms", () => {
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, "United States")
          ?.currency,
      ).toBe("usd");
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, "us")?.currency,
      ).toBe("usd");
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, "  USA  ")?.currency,
      ).toBe("usd");
    });

    it("falls back to CAD when country is null/empty/unknown", () => {
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, null)?.currency,
      ).toBe("cad");
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, "")?.currency,
      ).toBe("cad");
      expect(
        getTripmanQuoteForBooking("tripman-experience", 1, "Mexico")?.currency,
      ).toBe("cad");
    });

    it("returns null for invalid group size", () => {
      expect(
        getTripmanQuoteForBooking("tripman-experience", 5, "Canada"),
      ).toBeNull();
      expect(
        getTripmanQuoteForBooking("tripman-experience", 0, "USA"),
      ).toBeNull();
      expect(
        getTripmanQuoteForBooking("tripman-experience", null, "Canada"),
      ).toBeNull();
    });

    it("returns null for unknown slug", () => {
      expect(getTripmanQuoteForBooking("nonexistent", 2, "USA")).toBeNull();
    });
  });
});
