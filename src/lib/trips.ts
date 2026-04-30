import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  clusterTrips,
  PHOTO_URL_PREFIX,
  type RawCatalogueEntry,
  type Trip,
  type TripPhoto,
} from "./trips-pure";

// Pure clustering + types live in `trips-pure.ts` so Edge routes
// (e.g. the per-trip `opengraph-image`) can reuse them without
// pulling `node:fs` into the bundle. We re-export them here so the
// existing public API of `@/lib/trips` is unchanged.
export { clusterTrips } from "./trips-pure";
export type { Trip, TripPhoto } from "./trips-pure";

const CATALOGUE_PATH = path.join(
  process.cwd(),
  "scripts",
  "photo-catalogue.json",
);

let cached: Trip[] | null = null;

export async function getTrips(): Promise<Trip[]> {
  if (cached) return cached;
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    cached = [];
    return cached;
  }
  const items = JSON.parse(raw) as RawCatalogueEntry[];
  cached = clusterTrips(items);
  return cached;
}

export async function getTrip(slug: string): Promise<Trip | null> {
  const trips = await getTrips();
  return trips.find((t) => t.slug === slug) ?? null;
}

/**
 * Find the chronologically first trip in a given country. Used by the
 * /travel page so that clicking the country card or its map pin sends
 * the visitor straight to a real photo set rather than a fragment.
 *
 * `countryName` matches against the country as it appears in the
 * catalogue (e.g. "Italy"); the comparison is case-insensitive.
 */
export async function getFirstTripForCountry(
  countryName: string,
): Promise<Trip | null> {
  const trips = await getTrips();
  const target = countryName.toLowerCase();
  const matches = trips.filter((t) => t.country.toLowerCase() === target);
  if (matches.length === 0) return null;
  // `trips` is sorted most-recent first; the chronologically first
  // trip is the one with the earliest startsAt.
  return matches.reduce((earliest, t) =>
    t.startsAt < earliest.startsAt ? t : earliest,
  );
}

// Test-only escape hatch so unit tests can re-import without
// memoisation effects between the catalogue file and this module.
export function __resetTripsCache(): void {
  cached = null;
}

function slugifyCountry(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CountryPhotoGroup = {
  country: string;
  countrySlug: string;
  cities: { city: string; photos: TripPhoto[] }[];
  photoCount: number;
};

let catalogueCached: RawCatalogueEntry[] | null = null;

async function readCatalogue(): Promise<RawCatalogueEntry[]> {
  if (catalogueCached) return catalogueCached;
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    catalogueCached = [];
    return catalogueCached;
  }
  catalogueCached = JSON.parse(raw) as RawCatalogueEntry[];
  return catalogueCached;
}

/**
 * Aggregate ALL catalogue photos for a given country slug into a
 * per-city grouping. Unlike `getTrips()` / `clusterTrips()`, this
 * never splits photos into separate clusters — every GPS-tagged photo
 * for the country is included, ordered by city (photoCount desc) and
 * within each city by `takenAt` ascending.
 *
 * Only entries with `hasGps:true`, `gps`, and `place.city` are
 * included so every photo has a proper city label.
 */
export async function getPhotosByCountry(
  slug: string,
): Promise<CountryPhotoGroup | null> {
  const items = await readCatalogue();

  // Collect all GPS-tagged photos for the requested country.
  const cityBuckets = new Map<string, TripPhoto[]>();

  for (const entry of items) {
    if (!entry.hasGps || !entry.gps || !entry.place?.country || !entry.place?.city) {
      continue;
    }
    if (slugifyCountry(entry.place.country) !== slug) continue;

    const photo: TripPhoto = {
      filename: entry.src,
      src: PHOTO_URL_PREFIX + entry.src,
      alt:
        entry.caption ??
        `${entry.place.city}, ${entry.place.country}`,
      caption: entry.caption,
      takenAt: entry.takenAt ?? "",
      city: entry.place.city,
      country: entry.place.country,
      lat: entry.gps.lat,
      lon: entry.gps.lon,
    };

    const bucket = cityBuckets.get(entry.place.city) ?? [];
    if (bucket.length === 0) cityBuckets.set(entry.place.city, bucket);
    bucket.push(photo);
  }

  if (cityBuckets.size === 0) return null;

  // Pick the country name from the first matching entry.
  const countryName =
    [...cityBuckets.values()][0]?.[0]?.country ?? slug;

  const cities = [...cityBuckets.entries()]
    .map(([city, photos]) => ({
      city,
      photos: [...photos].sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    }))
    // Sort cities by photo count descending, alphabetical tie-break.
    .sort((a, b) => {
      if (b.photos.length !== a.photos.length)
        return b.photos.length - a.photos.length;
      return a.city.localeCompare(b.city);
    });

  const photoCount = cities.reduce((sum, c) => sum + c.photos.length, 0);

  return { country: countryName, countrySlug: slug, cities, photoCount };
}

/**
 * Return all unique country slugs present in the catalogue (GPS-tagged
 * entries only). Used by `generateStaticParams` on the country page.
 */
export async function getAllCountrySlugs(): Promise<string[]> {
  const items = await readCatalogue();
  const seen = new Set<string>();
  for (const entry of items) {
    if (!entry.hasGps || !entry.gps || !entry.place?.country || !entry.place?.city) {
      continue;
    }
    seen.add(slugifyCountry(entry.place.country));
  }
  return [...seen].sort();
}
