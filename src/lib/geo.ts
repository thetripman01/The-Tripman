/**
 * Geo inference: maps a pickup country (and optionally city) to its
 * operating IANA timezone and billing currency.
 *
 * This is the single place that answers "where in the world is this
 * booking?" so that availability (slot generation), the calendar display,
 * transactional emails, and pricing all agree. Tripman normally works in
 * the GTA (America/Toronto, CAD) but on tour the operating timezone and
 * currency change with the destination.
 *
 * IMPORTANT — matching is forgiving on purpose. Country strings come from
 * admin free-text and the live DB already contains real-world variants:
 *   - "Belguim" (a misspelling of Belgium, used for the Brussels stop)
 *   - "Zürich" (accented city name)
 * So all lookups are normalized (trim + lowercase) and the maps include
 * the exact spellings used in production plus common synonyms/accents. If
 * a country is never matched we fall back to the home base
 * (America/Toronto + CAD) — a missed mapping degrades gracefully to
 * "behave like a normal GTA booking" rather than throwing.
 */

export const HOME_TIMEZONE = "America/Toronto";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// Country (normalized) → IANA timezone. Covers the home base, the US tour
// cities (Eastern), the current European tour, and the broader Eurozone so
// future tours work without code changes.
const COUNTRY_TIMEZONES: Record<string, string> = {
  canada: "America/Toronto",

  // United States — defaults to Eastern (seeded tour cities are NY/NJ).
  // Multi-zone exceptions live in CITY_TIMEZONES below.
  usa: "America/New_York",
  "united states": "America/New_York",
  "united states of america": "America/New_York",
  us: "America/New_York",
  "u.s.": "America/New_York",
  "u.s.a.": "America/New_York",
  america: "America/New_York",

  // --- Current European tour (exact production spellings included) ---
  belgium: "Europe/Brussels",
  belguim: "Europe/Brussels", // production typo — keep mapped
  france: "Europe/Paris",
  monaco: "Europe/Monaco", // Riviera stop (Nice/Monaco/Cannes) — CET, same as Paris
  switzerland: "Europe/Zurich",
  swiss: "Europe/Zurich",
  italy: "Europe/Rome",
  italia: "Europe/Rome",
  germany: "Europe/Berlin",
  deutschland: "Europe/Berlin",
  czechia: "Europe/Prague",
  "czech republic": "Europe/Prague",
  czech: "Europe/Prague",
  netherlands: "Europe/Amsterdam",
  "the netherlands": "Europe/Amsterdam",
  holland: "Europe/Amsterdam",

  // --- Broader Eurozone / nearby (future-proofing) ---
  austria: "Europe/Vienna",
  spain: "Europe/Madrid",
  españa: "Europe/Madrid",
  espana: "Europe/Madrid",
  portugal: "Europe/Lisbon",
  ireland: "Europe/Dublin",
  greece: "Europe/Athens",
  luxembourg: "Europe/Luxembourg",
  finland: "Europe/Helsinki",
  slovakia: "Europe/Bratislava",
  slovenia: "Europe/Ljubljana",
  croatia: "Europe/Zagreb",

  // Non-Euro European neighbours (timezone only; currency handled below).
  "united kingdom": "Europe/London",
  uk: "Europe/London",
  england: "Europe/London",
  britain: "Europe/London",
  "great britain": "Europe/London",
  poland: "Europe/Warsaw",
  hungary: "Europe/Budapest",
  denmark: "Europe/Copenhagen",
  sweden: "Europe/Stockholm",
  norway: "Europe/Oslo",
};

// City-level overrides for multi-timezone countries, keyed by
// "normalizedCountry|normalizedCity". The European tour countries each sit
// in a single zone so they don't need entries here — this is mainly for the
// US, which spans four zones.
const CITY_TIMEZONES: Record<string, string> = {
  "usa|los angeles": "America/Los_Angeles",
  "usa|san francisco": "America/Los_Angeles",
  "usa|las vegas": "America/Los_Angeles",
  "usa|seattle": "America/Los_Angeles",
  "usa|chicago": "America/Chicago",
  "usa|houston": "America/Chicago",
  "usa|denver": "America/Denver",
  "usa|miami": "America/New_York",
};

/**
 * The set of countries we bill in EUR. This is the Eurozone PLUS the two
 * non-Euro stops on the current tour (Switzerland, Czechia) — the owner
 * decided all European tour cities are charged in EUR even where the local
 * currency differs (Stripe settles to the Canadian account fine). Countries
 * with their own currency that are NOT on the tour (UK, Poland, the
 * Nordics, Hungary) are intentionally excluded so we never silently
 * mischarge — add explicit support if a tour ever goes there.
 */
const EUR_COUNTRIES = new Set<string>([
  // Tour stops
  "belgium",
  "belguim",
  "france",
  "monaco",
  "switzerland",
  "swiss",
  "italy",
  "italia",
  "germany",
  "deutschland",
  "czechia",
  "czech republic",
  "czech",
  "netherlands",
  "the netherlands",
  "holland",
  // Rest of the Eurozone
  "austria",
  "spain",
  "españa",
  "espana",
  "portugal",
  "ireland",
  "greece",
  "luxembourg",
  "finland",
  "slovakia",
  "slovenia",
  "croatia",
]);

const USA_SYNONYMS = new Set<string>([
  "usa",
  "united states",
  "united states of america",
  "us",
  "u.s.",
  "u.s.a.",
  "america",
]);

export type SupportedCurrency = "cad" | "usd" | "eur";

/**
 * True if `tz` is a valid IANA timezone the runtime accepts. Used to
 * validate admin overrides at write time and to guard against a bad value
 * ever reaching date formatting (formatInTimeZone throws on invalid zones).
 */
export function isValidTimezone(tz: string | null | undefined): boolean {
  if (!tz || !tz.trim()) return false;
  try {
    // Throws RangeError for an unknown timezone.
    new Intl.DateTimeFormat("en-US", { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the operating IANA timezone for a pickup country/city. City wins
 * over country (for multi-zone countries); unknown input falls back to the
 * home timezone so callers never get an invalid zone.
 */
export function inferTimezone(
  country: string | null | undefined,
  city?: string | null | undefined,
): string {
  const c = normalize(country);
  const ct = normalize(city);
  if (c && ct) {
    const cityHit = CITY_TIMEZONES[`${c}|${ct}`];
    if (cityHit) return cityHit;
  }
  return COUNTRY_TIMEZONES[c] ?? HOME_TIMEZONE;
}

/**
 * Resolve the billing currency for a pickup country. European tour
 * countries → EUR, USA → USD, everything else (incl. Canada and unknowns)
 * → CAD. Mirrors the home-base fallback used by inferTimezone.
 */
export function inferCurrency(
  country: string | null | undefined,
): SupportedCurrency {
  const c = normalize(country);
  if (EUR_COUNTRIES.has(c)) return "eur";
  if (USA_SYNONYMS.has(c)) return "usd";
  return "cad";
}

// ---------------------------------------------------------------------------
// URL-slug matching for the per-region tour landing pages (/Belgium, /Berlin…)
// ---------------------------------------------------------------------------

/**
 * Collapse a country/city string to a match key: strip accents (Zürich →
 * zurich), lowercase, drop non-alphanumerics. So "/Zurich", "/zürich" and a
 * stored "Zürich" all match, and "/New York" matches "New York".
 */
export function slugKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Fold known country typos/synonyms so a clean URL (/Belgium) matches the
// admin's stored spelling — production stores the Brussels stop as "Belguim".
const COUNTRY_SLUG_ALIASES: Record<string, string> = {
  belguim: "belgium",
  holland: "netherlands",
  thenetherlands: "netherlands",
  czechrepublic: "czechia",
  czech: "czechia",
  deutschland: "germany",
  italia: "italy",
  espana: "spain",
  swiss: "switzerland",
  unitedstates: "usa",
  us: "usa",
};

/** Canonical country key for slug matching (folds typos/synonyms). */
export function canonicalCountryKey(
  country: string | null | undefined,
): string {
  const k = slugKey(country);
  return COUNTRY_SLUG_ALIASES[k] ?? k;
}

// Nice display spelling for a country, keyed by canonical key — so the
// "Belguim" typo never reaches customers on the landing pages.
const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
  belgium: "Belgium",
  france: "France",
  monaco: "Monaco",
  switzerland: "Switzerland",
  italy: "Italy",
  germany: "Germany",
  czechia: "Czechia",
  netherlands: "Netherlands",
  austria: "Austria",
  spain: "Spain",
  portugal: "Portugal",
  ireland: "Ireland",
  greece: "Greece",
  canada: "Canada",
  usa: "USA",
};

/** Human-friendly country name (fixes the stored typo where possible). */
export function countryDisplayName(country: string | null | undefined): string {
  const k = canonicalCountryKey(country);
  if (COUNTRY_DISPLAY_NAMES[k]) return COUNTRY_DISPLAY_NAMES[k];
  return (country ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
