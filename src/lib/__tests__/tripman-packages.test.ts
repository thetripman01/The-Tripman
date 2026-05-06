import {
  formatCad,
  getTripmanPriceForPeople,
  getTripmanPackage,
  getTripmanFromPriceLabel,
  getTripmanTierBreakdownLabel,
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
});
