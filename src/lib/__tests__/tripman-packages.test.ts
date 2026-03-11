import {
  formatCad,
  getTripmanPriceForPeople,
  getTripmanPackage,
  getTripmanFromPriceLabel,
  getTripmanTierBreakdownLabel,
} from "../tripman-packages";

describe("tripman-packages", () => {
  describe("formatCad", () => {
    it("formats cents as CAD", () => {
      expect(formatCad(7000)).toBe("$70 CAD");
      expect(formatCad(27000)).toBe("$270 CAD");
    });
  });

  describe("getTripmanPriceForPeople", () => {
    it("returns 7000 for tripman-experience with 1-4 people", () => {
      expect(getTripmanPriceForPeople("tripman-experience", 1)).toBe(7000);
      expect(getTripmanPriceForPeople("tripman-experience", 2)).toBe(7000);
      expect(getTripmanPriceForPeople("tripman-experience", 4)).toBe(7000);
    });

    it("returns 27000 for tripman-experience-plus with 1-4 people", () => {
      expect(getTripmanPriceForPeople("tripman-experience-plus", 1)).toBe(
        27000,
      );
      expect(getTripmanPriceForPeople("tripman-experience-plus", 4)).toBe(
        27000,
      );
    });

    it("returns null for 5+ people", () => {
      expect(getTripmanPriceForPeople("tripman-experience", 5)).toBeNull();
      expect(getTripmanPriceForPeople("tripman-experience-plus", 7)).toBeNull();
    });

    it("returns null for tripman-promo-ride", () => {
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
    it("returns From label for priced packages", () => {
      expect(getTripmanFromPriceLabel("tripman-experience")).toBe(
        "From $70 CAD",
      );
      expect(getTripmanFromPriceLabel("tripman-experience-plus")).toBe(
        "From $270 CAD",
      );
    });

    it("returns Custom for promo ride", () => {
      expect(getTripmanFromPriceLabel("tripman-promo-ride")).toBe("Custom");
    });
  });

  describe("getTripmanTierBreakdownLabel", () => {
    it("returns tier breakdown for priced packages", () => {
      expect(getTripmanTierBreakdownLabel("tripman-experience")).toContain(
        "1–4 people",
      );
      expect(getTripmanTierBreakdownLabel("tripman-experience")).toContain(
        "$70 CAD",
      );
    });
  });
});
