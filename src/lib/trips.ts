import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const CATALOGUE_PATH = path.join(
  process.cwd(),
  "scripts",
  "photo-catalogue.json",
);

// Photos are referenced by `src` (filename only). The deployed bucket
// serves them under `/photos/`; if the actual file lives elsewhere
// later, only this constant moves.
const PHOTO_URL_PREFIX = "/photos/";

// Maximum gap between consecutive photos (within the same country) for
// them to still belong to the same trip. The brief models a "trip" as
// contiguous photos by country with at most this many days between
// frames; anything longer starts a new cluster, even if the country
// did not change.
const MAX_GAP_DAYS = 3;

type RawCatalogueEntry = {
  src: string;
  takenAt?: string;
  hasGps?: boolean;
  gps?: { lat: number; lon: number };
  place?: { city?: string; country?: string; display?: string };
  cameraModel?: string;
  /**
   * Optional human-friendly caption produced by
   * `scripts/enrich-photo-captions.mjs`. When present it replaces the
   * date-only / city-country alt fallback in the lightbox and trip
   * pages. Format:
   *   - Stock:    "Landmark · City, Country · Month Year"
   *   - Personal: "City, Country · Month Year"
   */
  caption?: string;
};

export type TripPhoto = {
  /** Filename only, as it appears in the catalogue. */
  filename: string;
  /** Public URL (under PHOTO_URL_PREFIX). */
  src: string;
  /**
   * Alt text for screen readers / SEO. Prefers the catalogue's pre-
   * derived `caption` (landmark + city + month) and falls back to
   * `city, country` for entries that predate caption enrichment.
   */
  alt: string;
  /**
   * Pre-derived caption from the catalogue, if available. Same value
   * as `alt` when a caption exists; useful for code paths that want
   * to surface the caption distinctly (e.g. a `<figcaption>`).
   */
  caption?: string;
  /** ISO timestamp the photo was taken at. */
  takenAt: string;
  city?: string;
  country: string;
  lat: number;
  lon: number;
};

export type Trip = {
  /** Stable kebab slug, e.g. `italy-2024-04` (or `italy-2024-04-2`
   *  when a same-month return-trip would otherwise collide). */
  slug: string;
  /** Country name (as Nominatim returned it). */
  country: string;
  /** Country slug without the year-month suffix; equal across slug
   *  collisions so cross-links can pick the first matching trip. */
  countrySlug: string;
  /** Year of the cluster's earliest photo. */
  year: number;
  /** Long English month label, e.g. "April 2024". */
  monthLabel: string;
  /** Human-readable date range, e.g. "12–18 April 2024" or
   *  "27 March – 4 April 2024" when the cluster spans months. */
  dateRange: string;
  /** Number of photos in the trip. */
  photoCount: number;
  /** Most-photographed city in the cluster, if one stands out. */
  primaryCity?: string;
  /** ISO timestamps for the earliest and latest photos in the trip. */
  startsAt: string;
  endsAt: string;
  /** Whether this is a true cluster (>1 photo) or a single-photo trip. */
  isCluster: boolean;
  /** All photos in the cluster, oldest first. */
  photos: TripPhoto[];
};

function slugifyCountry(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    // Strip combining marks (any Unicode "Mark" character).
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

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

function monthLabelFromIso(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatDateRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sd = s.getUTCDate();
  const ed = e.getUTCDate();
  const sm = MONTHS_EN[s.getUTCMonth()];
  const em = MONTHS_EN[e.getUTCMonth()];
  const sy = s.getUTCFullYear();
  const ey = e.getUTCFullYear();

  // Same calendar day: just one date.
  if (sd === ed && sm === em && sy === ey) {
    return `${sd} ${sm} ${sy}`;
  }
  // Same month + year: "12–18 April 2024".
  if (sm === em && sy === ey) {
    return `${sd}–${ed} ${sm} ${sy}`;
  }
  // Same year, different months: "27 March – 4 April 2024".
  if (sy === ey) {
    return `${sd} ${sm} – ${ed} ${em} ${sy}`;
  }
  // Different years (rare, but possible).
  return `${sd} ${sm} ${sy} – ${ed} ${em} ${ey}`;
}

function pickPrimaryCity(
  photos: { city?: string }[],
): string | undefined {
  const counts = new Map<string, number>();
  for (const p of photos) {
    if (!p.city) continue;
    counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  let best: string | undefined;
  let bestN = -1;
  // Tie-break alphabetically for stability.
  for (const [city, n] of [...counts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (n > bestN) {
      best = city;
      bestN = n;
    }
  }
  return best;
}

/**
 * Pure clustering helper, exported for unit tests. Takes raw catalogue
 * entries (already filtered to the ones with country + date + GPS)
 * and emits a list of Trips, applying:
 *
 *   1. Filter out entries missing country, date, or GPS.
 *   2. Walk photos chronologically; start a new cluster whenever the
 *      country changes OR the gap from the previous photo exceeds
 *      MAX_GAP_DAYS days.
 *   3. Single-photo trips are KEPT but flagged `isCluster: false`.
 *   4. Build the slug from the cluster's earliest photo:
 *      `<country-kebab>-<YYYY-MM>`. If two clusters land on the same
 *      slug (e.g. two trips to Italy in the same month, separated by
 *      time at home), the second gets `-2`, the third `-3`, etc.
 */
export function clusterTrips(entries: RawCatalogueEntry[]): Trip[] {
  // 1. Filter + normalise.
  const usable: TripPhoto[] = [];
  for (const e of entries) {
    if (!e.takenAt) continue;
    if (!e.hasGps || !e.gps) continue;
    if (!e.place?.country) continue;
    usable.push({
      filename: e.src,
      src: PHOTO_URL_PREFIX + e.src,
      // Prefer the pre-derived caption (landmark + city + month for
      // stock, city + month for personal) and fall back to the
      // city, country form used before round-6 caption enrichment.
      alt:
        e.caption ??
        [e.place.city, e.place.country].filter(Boolean).join(", "),
      caption: e.caption,
      takenAt: e.takenAt,
      city: e.place.city,
      country: e.place.country,
      lat: e.gps.lat,
      lon: e.gps.lon,
    });
  }

  // 2. Sort all photos chronologically.
  usable.sort((a, b) => a.takenAt.localeCompare(b.takenAt));

  // 3. Walk and split into clusters whenever country changes or the
  //    gap from the previous photo exceeds MAX_GAP_DAYS.
  type Cluster = { country: string; photos: TripPhoto[] };
  const clusters: Cluster[] = [];
  for (const photo of usable) {
    const last = clusters[clusters.length - 1];
    if (
      !last ||
      last.country !== photo.country ||
      daysBetween(last.photos[last.photos.length - 1].takenAt, photo.takenAt) >
        MAX_GAP_DAYS
    ) {
      clusters.push({ country: photo.country, photos: [photo] });
    } else {
      last.photos.push(photo);
    }
  }

  // 4. Materialise into Trip objects (without final slug yet — that
  //    needs the collision-aware second pass).
  type Draft = Omit<Trip, "slug"> & { baseSlug: string };
  const drafts: Draft[] = clusters.map((c) => {
    const start = c.photos[0].takenAt;
    const end = c.photos[c.photos.length - 1].takenAt;
    const startD = new Date(start);
    const countrySlug = slugifyCountry(c.country);
    const baseSlug = `${countrySlug}-${startD.getUTCFullYear()}-${pad2(startD.getUTCMonth() + 1)}`;
    return {
      baseSlug,
      country: c.country,
      countrySlug,
      year: startD.getUTCFullYear(),
      monthLabel: monthLabelFromIso(start),
      dateRange: formatDateRange(start, end),
      photoCount: c.photos.length,
      primaryCity: pickPrimaryCity(c.photos),
      startsAt: start,
      endsAt: end,
      isCluster: c.photos.length > 1,
      photos: c.photos,
    };
  });

  // 5. Resolve slug collisions in chronological order: first
  //    occurrence keeps the bare base slug, subsequent ones get
  //    `-2`, `-3`, … This is deterministic because `drafts` is sorted
  //    by chronology of the underlying photos.
  drafts.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const occurrences = new Map<string, number>();
  const trips: Trip[] = drafts.map((d) => {
    const prev = occurrences.get(d.baseSlug) ?? 0;
    occurrences.set(d.baseSlug, prev + 1);
    const slug = prev === 0 ? d.baseSlug : `${d.baseSlug}-${prev + 1}`;
    // Drop the temporary `baseSlug` discriminator before returning the
    // public Trip shape.
    const { baseSlug, ...rest } = d;
    void baseSlug;
    return { slug, ...rest };
  });

  // 6. Most-recent first across the whole list.
  trips.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return trips;
}

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
