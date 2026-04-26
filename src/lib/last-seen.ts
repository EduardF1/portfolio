import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const CATALOGUE_PATH = path.join(
  process.cwd(),
  "scripts",
  "photo-catalogue.json",
);

type RawCatalogueEntry = {
  src: string;
  takenAt?: string;
  hasGps?: boolean;
  gps?: { lat: number; lon: number };
  place?: { city?: string; country?: string; display?: string };
};

export type LastSeen = {
  /** City name as Nominatim returned it. May be undefined when the
   *  catalogue entry only carries country-level reverse-geocoding. */
  city?: string;
  /** Country name as Nominatim returned it. Always present. */
  country: string;
  /** ISO timestamp of the photo this entry was derived from. */
  takenAt: string;
};

/**
 * Pure derivation: given a list of catalogue entries (in any order),
 * return the most-recent GPS-tagged entry that has at least a country.
 * City is preferred but not required — falls back to country-only.
 *
 * Returns `null` if no entry in the catalogue has GPS + country + a
 * usable `takenAt` timestamp.
 *
 * Kept separate from the IO so it can be unit-tested with synthetic
 * fixtures rather than the on-disk catalogue.
 */
export function deriveLastSeen(
  entries: readonly RawCatalogueEntry[],
): LastSeen | null {
  let best: { takenAt: string; city?: string; country: string } | null = null;

  for (const e of entries) {
    if (!e.hasGps) continue;
    if (!e.takenAt) continue;
    const country = e.place?.country;
    if (!country) continue;

    if (!best || e.takenAt > best.takenAt) {
      best = {
        takenAt: e.takenAt,
        city: e.place?.city || undefined,
        country,
      };
    }
  }

  if (!best) return null;
  return { city: best.city, country: best.country, takenAt: best.takenAt };
}

/**
 * Reads the on-disk EXIF photo catalogue and returns the most recent
 * GPS-tagged entry as a `LastSeen` object. Returns `null` if the file
 * is missing/unreadable, malformed, or contains no GPS-tagged photo
 * with a country.
 */
export async function getLastSeen(): Promise<LastSeen | null> {
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    return null;
  }
  let items: RawCatalogueEntry[];
  try {
    items = JSON.parse(raw) as RawCatalogueEntry[];
  } catch {
    return null;
  }
  if (!Array.isArray(items)) return null;
  return deriveLastSeen(items);
}

/**
 * Format a `LastSeen` for footer display. Locale is required so EN
 * reads "April 2026" and DA reads "april 2026".
 */
export function formatLastSeenPlace(seen: LastSeen): string {
  return seen.city ? `${seen.city}, ${seen.country}` : seen.country;
}

export function formatLastSeenMonth(seen: LastSeen, locale: string): string {
  const d = new Date(seen.takenAt);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(d);
}
