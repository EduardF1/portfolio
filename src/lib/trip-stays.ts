import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const STAYS_PATH = path.join(process.cwd(), "scripts", "trip-stays.json");

export type TripStay = {
  /** ISO date (YYYY-MM-DD) the stay starts. */
  checkIn: string;
  /** ISO date (YYYY-MM-DD) the stay ends. */
  checkOut: string;
  /** Airbnb listing type, e.g. "Apartment", "Chalet", "House". */
  type: string;
  /** City the stay sits in (display string from Airbnb). */
  city: string;
  /** Country the stay sits in (display string from Airbnb). */
  country: string;
  /** Slug of the trip this stay belongs to, or null for orphan stays
   *  that don't (yet) have a per-trip page. */
  tripSlug: string | null;
};

let cached: TripStay[] | null = null;

export async function getTripStays(): Promise<TripStay[]> {
  if (cached) return cached;
  let raw: string;
  try {
    raw = await fs.readFile(STAYS_PATH, "utf-8");
  } catch {
    cached = [];
    return cached;
  }
  try {
    cached = JSON.parse(raw) as TripStay[];
  } catch {
    cached = [];
  }
  return cached;
}

/**
 * Return all stays whose `tripSlug` matches the given slug, sorted
 * earliest check-in first. Returns an empty array if no matches.
 */
export async function getStaysForTrip(slug: string): Promise<TripStay[]> {
  const all = await getTripStays();
  return all
    .filter((s) => s.tripSlug === slug)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

// Test-only escape hatch so unit tests can re-import without
// memoisation effects between the JSON file and this module.
export function __resetStaysCache(): void {
  cached = null;
}
