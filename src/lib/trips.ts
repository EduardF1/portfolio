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

// If a photo cluster spans two adjacent (year-month) buckets, we merge
// them when the photos at the boundary are within this many days.
// 14 days is the brief's tolerance for "trip spilling into the next
// month" (e.g. a trip that starts on 27 March and continues until 4
// April should be one trip, not two).
const ADJACENT_MONTH_MERGE_DAYS = 14;

type RawCatalogueEntry = {
  src: string;
  takenAt?: string;
  hasGps?: boolean;
  gps?: { lat: number; lon: number };
  place?: { city?: string; country?: string; display?: string };
  cameraModel?: string;
};

export type TripPhoto = {
  /** Filename only, as it appears in the catalogue. */
  filename: string;
  /** Public URL (under PHOTO_URL_PREFIX). */
  src: string;
  /** Generated alt text (city + country + month/year). */
  alt: string;
  /** ISO timestamp the photo was taken at. */
  takenAt: string;
  city?: string;
  country: string;
  lat: number;
  lon: number;
};

export type Trip = {
  /** Stable kebab slug, e.g. `italy-2024-04`. */
  slug: string;
  /** Country name (as Nominatim returned it). */
  country: string;
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

function ymKey(iso: string): string {
  // YYYY-MM, sliced from a guaranteed-ISO timestamp.
  return iso.slice(0, 7);
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
 * entries (already filtered to the ones with country + date) and emits
 * a list of Trips, applying:
 *
 *   1. Bucketing by (country, YYYY-MM)
 *   2. Adjacent-month merge when boundary photos are within
 *      ADJACENT_MONTH_MERGE_DAYS days.
 *   3. Single-photo trips KEPT, but flagged `isCluster: false`.
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
      alt: [e.place.city, e.place.country].filter(Boolean).join(", "),
      takenAt: e.takenAt,
      city: e.place.city,
      country: e.place.country,
      lat: e.gps.lat,
      lon: e.gps.lon,
    });
  }

  // 2. Bucket by (country, year-month).
  const buckets = new Map<string, TripPhoto[]>();
  for (const p of usable) {
    const key = `${p.country}|${ymKey(p.takenAt)}`;
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push(p);
  }
  // Sort photos inside each bucket chronologically.
  for (const arr of buckets.values()) {
    arr.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  }

  // 3. Group buckets by country, then merge adjacent months when
  //    boundary photos are close in time.
  type Cluster = { country: string; photos: TripPhoto[] };
  const byCountry = new Map<string, { ym: string; photos: TripPhoto[] }[]>();
  for (const [key, photos] of buckets) {
    const [country, ym] = key.split("|");
    let list = byCountry.get(country);
    if (!list) {
      list = [];
      byCountry.set(country, list);
    }
    list.push({ ym, photos });
  }

  const clusters: Cluster[] = [];
  for (const [country, monthBuckets] of byCountry) {
    monthBuckets.sort((a, b) => a.ym.localeCompare(b.ym));
    let i = 0;
    while (i < monthBuckets.length) {
      const current: Cluster = {
        country,
        photos: [...monthBuckets[i].photos],
      };
      // Greedy merge with subsequent adjacent months.
      while (i + 1 < monthBuckets.length) {
        const a = monthBuckets[i];
        const b = monthBuckets[i + 1];
        if (!isAdjacentMonth(a.ym, b.ym)) break;
        const lastA = a.photos[a.photos.length - 1].takenAt;
        const firstB = b.photos[0].takenAt;
        if (daysBetween(lastA, firstB) > ADJACENT_MONTH_MERGE_DAYS) break;
        current.photos.push(...b.photos);
        i += 1;
      }
      clusters.push(current);
      i += 1;
    }
  }

  // 4. Materialise into Trip objects.
  const trips: Trip[] = clusters.map((c) => {
    c.photos.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    const start = c.photos[0].takenAt;
    const end = c.photos[c.photos.length - 1].takenAt;
    const startD = new Date(start);
    const slug = `${slugifyCountry(c.country)}-${startD.getUTCFullYear()}-${pad2(startD.getUTCMonth() + 1)}`;
    return {
      slug,
      country: c.country,
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

  // Most-recent first across the whole list.
  trips.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return trips;
}

function isAdjacentMonth(a: string, b: string): boolean {
  // a, b are YYYY-MM keys; b should be exactly one month later.
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  if (ay === by && bm - am === 1) return true;
  if (by - ay === 1 && am === 12 && bm === 1) return true;
  return false;
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

// Test-only escape hatch so unit tests can re-import without
// memoisation effects between the catalogue file and this module.
export function __resetTripsCache(): void {
  cached = null;
}
