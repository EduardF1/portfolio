import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  clusterTrips,
  type RawCatalogueEntry,
  type Trip,
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
