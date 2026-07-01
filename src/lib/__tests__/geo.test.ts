import {
  inferTimezone,
  inferCurrency,
  HOME_TIMEZONE,
  slugKey,
  canonicalCountryKey,
  countryDisplayName,
} from "../geo";

describe("inferTimezone", () => {
  it("maps the home base to Toronto", () => {
    expect(inferTimezone("Canada")).toBe("America/Toronto");
    expect(inferTimezone("Canada", "Toronto")).toBe("America/Toronto");
    expect(inferTimezone("Canada", "Ottawa")).toBe("America/Toronto");
  });

  it("maps the European tour stops to their real zones", () => {
    // Exact production spellings (note the "Belguim" typo + accented city).
    expect(inferTimezone("Belguim", "Brussels")).toBe("Europe/Brussels");
    expect(inferTimezone("France", "Strasbourg")).toBe("Europe/Paris");
    expect(inferTimezone("Switzerland", "Zürich")).toBe("Europe/Zurich");
    expect(inferTimezone("Italy", "Milano")).toBe("Europe/Rome");
    expect(inferTimezone("Germany", "Munich")).toBe("Europe/Berlin");
    expect(inferTimezone("Germany", "Berlin")).toBe("Europe/Berlin");
    expect(inferTimezone("Germany", "Cologne")).toBe("Europe/Berlin");
    expect(inferTimezone("Czechia", "Prague")).toBe("Europe/Prague");
    expect(inferTimezone("Netherlands", "Amsterdam")).toBe("Europe/Amsterdam");
  });

  it("accepts the correct Belgium spelling too", () => {
    expect(inferTimezone("Belgium", "Brussels")).toBe("Europe/Brussels");
  });

  it("normalizes case and whitespace", () => {
    expect(inferTimezone("  germany  ")).toBe("Europe/Berlin");
    expect(inferTimezone("FRANCE")).toBe("Europe/Paris");
  });

  it("defaults USA to Eastern but honours west-coast city overrides", () => {
    expect(inferTimezone("USA", "New York")).toBe("America/New_York");
    expect(inferTimezone("USA", "New Jersey")).toBe("America/New_York");
    expect(inferTimezone("USA", "Los Angeles")).toBe("America/Los_Angeles");
    expect(inferTimezone("USA", "Chicago")).toBe("America/Chicago");
  });

  it("falls back to the home timezone for unknown countries", () => {
    expect(inferTimezone("Mexico")).toBe(HOME_TIMEZONE);
    expect(inferTimezone("")).toBe(HOME_TIMEZONE);
    expect(inferTimezone(null)).toBe(HOME_TIMEZONE);
    expect(inferTimezone(undefined)).toBe(HOME_TIMEZONE);
  });
});

describe("inferCurrency", () => {
  it("bills the European tour stops in EUR (incl. CHF/CZK countries)", () => {
    expect(inferCurrency("Belguim")).toBe("eur");
    expect(inferCurrency("France")).toBe("eur");
    expect(inferCurrency("Switzerland")).toBe("eur");
    expect(inferCurrency("Italy")).toBe("eur");
    expect(inferCurrency("Germany")).toBe("eur");
    expect(inferCurrency("Czechia")).toBe("eur");
    expect(inferCurrency("Netherlands")).toBe("eur");
  });

  it("bills the USA in USD (with synonyms)", () => {
    expect(inferCurrency("USA")).toBe("usd");
    expect(inferCurrency("United States")).toBe("usd");
    expect(inferCurrency("us")).toBe("usd");
    expect(inferCurrency("  USA  ")).toBe("usd");
  });

  it("bills Canada and unknowns in CAD", () => {
    expect(inferCurrency("Canada")).toBe("cad");
    expect(inferCurrency("Mexico")).toBe("cad");
    expect(inferCurrency("")).toBe("cad");
    expect(inferCurrency(null)).toBe("cad");
  });

  it("does NOT bill non-tour, non-Euro European countries in EUR", () => {
    // These have their own currency and aren't on the tour — must not be
    // silently charged EUR.
    expect(inferCurrency("United Kingdom")).toBe("cad");
    expect(inferCurrency("Poland")).toBe("cad");
    expect(inferCurrency("Sweden")).toBe("cad");
  });
});

describe("slugKey", () => {
  it("strips accents, case and punctuation", () => {
    expect(slugKey("Zürich")).toBe("zurich");
    expect(slugKey("  Strasbourg ")).toBe("strasbourg");
    expect(slugKey("New York")).toBe("newyork");
    expect(slugKey("Milano")).toBe("milano");
  });
});

describe("canonicalCountryKey", () => {
  it("folds the production Belguim typo and synonyms to a canonical key", () => {
    expect(canonicalCountryKey("Belguim")).toBe("belgium");
    expect(canonicalCountryKey("Belgium")).toBe("belgium");
    expect(canonicalCountryKey("Holland")).toBe("netherlands");
    expect(canonicalCountryKey("Czech Republic")).toBe("czechia");
    expect(canonicalCountryKey("Germany")).toBe("germany");
  });

  it("lets a clean /Belgium URL match the stored Belguim row", () => {
    expect(canonicalCountryKey("Belgium")).toBe(canonicalCountryKey("Belguim"));
  });
});

describe("countryDisplayName", () => {
  it("shows the corrected spelling even for the typo'd row", () => {
    expect(countryDisplayName("Belguim")).toBe("Belgium");
    expect(countryDisplayName("Germany")).toBe("Germany");
    expect(countryDisplayName("czechia")).toBe("Czechia");
  });

  it("title-cases unknown countries as a fallback", () => {
    expect(countryDisplayName("narnia")).toBe("Narnia");
  });
});
