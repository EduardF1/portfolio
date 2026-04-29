// Caption derivation for photo-catalogue entries.
//
// Used by scripts/enrich-photo-captions.mjs to backfill the optional
// `caption` field. Pure functions, no I/O, exported for unit tests.
//
// Why a sibling .mjs and not a TS lib: the enrichment script runs under
// plain Node and the app reads the resulting catalogue field as data,
// so derivation lives in one place that both the script and tests
// (vitest, which can import .mjs) can consume.

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Slugify a place name the way Pexels filenames are slugified:
 * lowercase ASCII, strip diacritics, collapse non-alphanumerics to
 * single hyphens, trim leading/trailing hyphens.
 */
export function slugifyForFilename(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format an ISO timestamp as "Month YYYY" in English. Returns null for
 * a falsy / unparseable input — caller decides the fallback.
 */
export function monthYearLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Convert a kebab slug to title-cased words ("tower-of-london" →
 * "Tower of London"). Lowercases short connector words ("of", "the",
 * "and", "de", "la", "le") that are not the first token. The list is
 * deliberately small — over-eager casing rules cause more wrong output
 * than they prevent for landmark names.
 */
export function titleCaseLandmark(slug) {
  const lower = new Set(["of", "the", "and", "de", "la", "le", "du", "von"]);
  const parts = String(slug).split("-").filter(Boolean);
  return parts
    .map((p, i) => {
      if (i > 0 && lower.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}

/**
 * Strip the city slug from the start of a Pexels filename slug body if
 * it appears as a prefix. Avoids "London London Tower of London" when
 * the city is also part of the landmark.
 *
 * `body` is the slug between `pexels-` and the trailing `-<id>`.
 * `citySlug` is the city's filename slug.
 *
 * Returns the remaining landmark slug, or "" if nothing is left.
 */
export function stripCityPrefix(body, citySlug) {
  if (!citySlug) return body;
  if (body === citySlug) return "";
  const prefix = citySlug + "-";
  if (body.startsWith(prefix)) return body.slice(prefix.length);
  return body;
}

/**
 * Parse a Pexels stock filename of the form
 *   pexels-<city-slug>-<landmark-slug>-<id>.jpg
 * into `{ landmark, id }`. Strips the city prefix from the landmark
 * portion when it matches.
 *
 * Returns null when the filename does not start with `pexels-` or
 * has no trailing numeric id (which would make landmark detection
 * unsafe).
 */
export function parsePexelsFilename(filename, citySlug) {
  if (!filename) return null;
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  if (!base.startsWith("pexels-")) return null;
  const stem = base.slice("pexels-".length);
  // Trailing numeric id, e.g. "-30483647".
  const m = stem.match(/^(.*)-(\d+)$/);
  if (!m) return null;
  const body = m[1];
  const id = m[2];
  if (!body) return null;
  const landmarkSlug = stripCityPrefix(body, citySlug);
  return {
    landmarkSlug,
    landmark: landmarkSlug ? titleCaseLandmark(landmarkSlug) : "",
    id,
  };
}

/**
 * Derive a caption for a single catalogue entry.
 *
 * Strategy:
 * - Stock (Pexels) photos: parse the filename for a landmark slug,
 *   then build "<landmark> · <place.display> · <Month Year>".
 *   `Month Year` is omitted when `takenAt` is null (common for stock).
 *   `landmark` is omitted when filename parse fails.
 * - Personal photos: "<place.display> · <Month Year>".
 * - Anything missing both place.display and takenAt: returns null
 *   (caller keeps the existing alt fallback).
 *
 * Never returns a string that double-prints the city: the landmark
 * portion has the city prefix stripped before the city is appended.
 */
export function derivePhotoCaption(entry) {
  if (!entry) return null;
  const filename = (entry.src || "").split("/").pop() || "";
  const display = entry.place?.display || null;
  const city = entry.place?.city || null;
  const country = entry.place?.country || null;
  const monthYear = monthYearLabel(entry.takenAt);

  // Compose place portion. Prefer the explicit `display`, fall back to
  // city + country if only one half is present.
  let placePart = display;
  if (!placePart) {
    if (city && country) placePart = `${city}, ${country}`;
    else if (city) placePart = city;
    else if (country) placePart = country;
  }

  const isStock = entry.source && entry.source.type === "stock";
  if (isStock) {
    const citySlug = city ? slugifyForFilename(city) : "";
    const parsed = parsePexelsFilename(filename, citySlug);
    const parts = [];
    if (parsed && parsed.landmark) parts.push(parsed.landmark);
    if (placePart) parts.push(placePart);
    if (monthYear) parts.push(monthYear);
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }

  // Personal photo path.
  const parts = [];
  if (placePart) parts.push(placePart);
  if (monthYear) parts.push(monthYear);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}
