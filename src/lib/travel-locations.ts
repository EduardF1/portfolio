import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { clusterTrips } from "@/lib/trips";
import { tripCountByCountry } from "@/lib/trip-clusters";

const CATALOGUE_PATH = path.join(
  process.cwd(),
  "scripts",
  "photo-catalogue.json",
);

type RawCatalogueEntry = {
  src: string;
  takenAt?: string;
  hasGps: boolean;
  gps?: { lat: number; lon: number };
  place?: { city?: string; country?: string; display?: string };
};

export type CountryDestination = {
  /** Country name as Nominatim returned it. */
  country: string;
  /** Lower-kebab slug derived from the country name, used as anchor id. */
  slug: string;
  /** Average lat/lon of all photos in this country (centroid). */
  centroid: { lat: number; lon: number };
  /** Distinct city names in this country, alphabetically. */
  cities: string[];
  /** Number of photos in the catalogue from this country. */
  photoCount: number;
  /** ISO date string of the most recent photo from this country. */
  latestPhoto?: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getTravelDestinations(): Promise<CountryDestination[]> {
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    return [];
  }
  const items = JSON.parse(raw) as RawCatalogueEntry[];

  const byCountry = new Map<
    string,
    {
      country: string;
      lats: number[];
      lons: number[];
      cities: Set<string>;
      photoCount: number;
      latestPhoto?: string;
    }
  >();

  for (const item of items) {
    if (!item.hasGps || !item.gps || !item.place?.country) continue;
    const country = item.place.country;
    const entry =
      byCountry.get(country) ??
      ({
        country,
        lats: [],
        lons: [],
        cities: new Set<string>(),
        photoCount: 0,
      } as ReturnType<typeof byCountry.get> & object);
    if (!byCountry.has(country)) byCountry.set(country, entry as never);
    const e = byCountry.get(country)!;
    e.lats.push(item.gps.lat);
    e.lons.push(item.gps.lon);
    if (item.place.city) e.cities.add(item.place.city);
    e.photoCount += 1;
    if (item.takenAt && (!e.latestPhoto || item.takenAt > e.latestPhoto)) {
      e.latestPhoto = item.takenAt;
    }
  }

  const out: CountryDestination[] = [];
  for (const e of byCountry.values()) {
    const lat = e.lats.reduce((a, b) => a + b, 0) / e.lats.length;
    const lon = e.lons.reduce((a, b) => a + b, 0) / e.lons.length;
    out.push({
      country: e.country,
      slug: slugify(e.country),
      centroid: { lat, lon },
      cities: [...e.cities].sort((a, b) => a.localeCompare(b)),
      photoCount: e.photoCount,
      latestPhoto: e.latestPhoto,
    });
  }
  out.sort((a, b) => a.country.localeCompare(b.country));
  return out;
}

/**
 * Per-city dot data for the city-overlay map view. Groups catalogue
 * entries by `place.city`, averages the GPS coords (cheap centroid),
 * counts photos, and picks the most-photographed trip slug as the
 * click target so the dot links into a real trip page.
 *
 * Entries without GPS or without `place.city` are dropped silently;
 * they will not appear on the map. The two heuristics combined
 * dedupe to roughly the unique catalogued cities — the dataset is
 * small (≈80 cities) so the linear scan is fine.
 */
export type CityDestination = {
  /** City name as Nominatim returned it. */
  city: string;
  /** Country name as Nominatim returned it. */
  country: string;
  /** Stable slug derived from `${country}-${city}`, used as a key. */
  slug: string;
  /** Average lat/lon of the photos taken in this city. */
  lat: number;
  lon: number;
  /** Number of catalogue photos taken in this city. */
  photoCount: number;
  /** Trip slug with the most photos from this city. Used as click
   *  target so the dot scrolls to a relevant trip card / section. */
  primaryTripSlug?: string;
};

function citySlug(country: string, city: string): string {
  return `${slugify(country)}-${slugify(city)}`;
}

export async function getCityDestinations(): Promise<CityDestination[]> {
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    return [];
  }
  const items = JSON.parse(raw) as RawCatalogueEntry[];
  return deriveCityDestinations(items);
}

/**
 * Pure helper, exported for unit tests. Buckets catalogue entries
 * by `(country, city)` and produces one CityDestination per bucket.
 */
export function deriveCityDestinations(
  items: RawCatalogueEntry[],
): CityDestination[] {
  // Cluster trips up-front so we can attribute each city to the trip
  // that has the most photos from it. clusterTrips drops entries
  // without takenAt + GPS + country, so it is a strict subset of what
  // we render dots for — we fall back to undefined when no trip can
  // be matched (e.g. all photos are stock without takenAt).
  const trips = clusterTrips(items);

  type Bucket = {
    city: string;
    country: string;
    lats: number[];
    lons: number[];
    photoCount: number;
    /** photo `src` values, used to find the matching trip slug. */
    srcs: string[];
  };
  const buckets = new Map<string, Bucket>();

  for (const item of items) {
    if (!item.hasGps || !item.gps || !item.place?.city || !item.place?.country) {
      continue;
    }
    const key = `${item.place.country}|${item.place.city}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        city: item.place.city,
        country: item.place.country,
        lats: [],
        lons: [],
        photoCount: 0,
        srcs: [],
      };
      buckets.set(key, bucket);
    }
    bucket.lats.push(item.gps.lat);
    bucket.lons.push(item.gps.lon);
    bucket.photoCount += 1;
    bucket.srcs.push(item.src);
  }

  // Attribute each city to its dominant trip slug. We score every
  // trip by how many of its photos overlap with the bucket's `srcs`,
  // and take the top-scoring trip (alphabetical tie-break for
  // determinism).
  function pickTripSlug(bucket: Bucket): string | undefined {
    if (trips.length === 0) return undefined;
    const cityFiles = new Set(bucket.srcs);
    let bestSlug: string | undefined;
    let bestScore = 0;
    for (const trip of trips) {
      let score = 0;
      for (const photo of trip.photos) {
        if (cityFiles.has(photo.filename)) score += 1;
      }
      if (
        score > bestScore ||
        (score > 0 && score === bestScore && bestSlug && trip.slug < bestSlug)
      ) {
        bestScore = score;
        bestSlug = trip.slug;
      }
    }
    return bestSlug;
  }

  const out: CityDestination[] = [];
  for (const bucket of buckets.values()) {
    const lat = bucket.lats.reduce((a, b) => a + b, 0) / bucket.lats.length;
    const lon = bucket.lons.reduce((a, b) => a + b, 0) / bucket.lons.length;
    out.push({
      city: bucket.city,
      country: bucket.country,
      slug: citySlug(bucket.country, bucket.city),
      lat,
      lon,
      photoCount: bucket.photoCount,
      primaryTripSlug: pickTripSlug(bucket),
    });
  }
  // Stable order: country, then city.
  out.sort((a, b) =>
    a.country === b.country
      ? a.city.localeCompare(b.city)
      : a.country.localeCompare(b.country),
  );
  return out;
}

/**
 * Per-country city listing, used by the /travel country cards to
 * surface the actual cities inside each country (e.g. Romania card →
 * Bucharest, Brașov, Sibiu, …). Cities are ordered most-photographed
 * first, with alphabetical tie-break, so the country card and the
 * per-trip city sections share a stable, intuitive order.
 *
 * Each city carries a `primaryTripSlug` so we can deep-link from the
 * country card or city section into a real photo set.
 */
export type CityInCountry = {
  /** City name as Nominatim returned it. */
  name: string;
  /** Number of catalogue photos taken in this city (regardless of GPS). */
  photoCount: number;
  /** Trip slug with the most photos from this city, if any. */
  primaryTripSlug?: string;
};

export type CountryCities = {
  /** Country name as Nominatim returned it. */
  country: string;
  /** Lower-kebab slug derived from the country name. */
  slug: string;
  /** Cities in display order: photoCount desc, alphabetical tie-break. */
  cities: CityInCountry[];
  /** Country-wide photo count (sum of cities + city-less entries). */
  photoCount: number;
  /** Primary trip slug for the country card click target. We pick the
   *  most-recent trip so visitors land on the freshest content. */
  primaryTripSlug?: string;
};

export async function getCitiesByCountry(): Promise<CountryCities[]> {
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    return [];
  }
  const items = JSON.parse(raw) as RawCatalogueEntry[];
  return deriveCitiesByCountry(items);
}

/**
 * Pure helper, exported for unit tests. Buckets catalogue entries
 * by country, then by city, and orders the cities by photo count
 * (descending) with alphabetical tie-break. Uses `clusterTrips`
 * to attach a `primaryTripSlug` to each city and to pick the
 * most-recent trip slug as the country's click target.
 */
export function deriveCitiesByCountry(
  items: RawCatalogueEntry[],
): CountryCities[] {
  const trips = clusterTrips(items);

  // Per-country aggregate.
  type CountryAgg = {
    country: string;
    cities: Map<string, { name: string; photoCount: number; srcs: string[] }>;
    photoCount: number;
  };
  const byCountry = new Map<string, CountryAgg>();

  for (const item of items) {
    const country = item.place?.country;
    if (!country) continue;
    let agg = byCountry.get(country);
    if (!agg) {
      agg = { country, cities: new Map(), photoCount: 0 };
      byCountry.set(country, agg);
    }
    agg.photoCount += 1;
    const city = item.place?.city;
    if (!city) continue;
    let cb = agg.cities.get(city);
    if (!cb) {
      cb = { name: city, photoCount: 0, srcs: [] };
      agg.cities.set(city, cb);
    }
    cb.photoCount += 1;
    cb.srcs.push(item.src);
  }

  // Pre-index trip photos by filename so we can score cities cheaply.
  // For each city we count overlap with every trip's photo filenames
  // and pick the dominant trip; ties break alphabetically by slug for
  // determinism.
  function pickTripSlugForCity(srcs: string[]): string | undefined {
    if (trips.length === 0 || srcs.length === 0) return undefined;
    const cityFiles = new Set(srcs);
    let bestSlug: string | undefined;
    let bestScore = 0;
    for (const trip of trips) {
      let score = 0;
      for (const photo of trip.photos) {
        if (cityFiles.has(photo.filename)) score += 1;
      }
      if (
        score > bestScore ||
        (score > 0 && score === bestScore && bestSlug && trip.slug < bestSlug)
      ) {
        bestScore = score;
        bestSlug = trip.slug;
      }
    }
    return bestSlug;
  }

  // Pick the most-recent trip slug for the country click target.
  // `trips` is already sorted most-recent first, so we just take the
  // first one matching the country (case-insensitive).
  function pickPrimaryTripForCountry(country: string): string | undefined {
    const target = country.toLowerCase();
    return trips.find((t) => t.country.toLowerCase() === target)?.slug;
  }

  const out: CountryCities[] = [];
  for (const agg of byCountry.values()) {
    const cities: CityInCountry[] = [...agg.cities.values()]
      .map((cb) => ({
        name: cb.name,
        photoCount: cb.photoCount,
        primaryTripSlug: pickTripSlugForCity(cb.srcs),
      }))
      .sort((a, b) => {
        if (b.photoCount !== a.photoCount) return b.photoCount - a.photoCount;
        return a.name.localeCompare(b.name);
      });
    out.push({
      country: agg.country,
      slug: slugify(agg.country),
      cities,
      photoCount: agg.photoCount,
      primaryTripSlug: pickPrimaryTripForCountry(agg.country),
    });
  }
  // Country order matches getTravelDestinations(): alphabetical by name.
  out.sort((a, b) => a.country.localeCompare(b.country));
  return out;
}

/**
 * Per-country distinct trip count, derived from the same catalogue
 * using the date+country, ≤3-day-gap clustering rule (see
 * `src/lib/trip-clusters.ts`). Used by the /travel chloropleth toggle
 * on the Europe map.
 */
export async function getCountryTripCounts(): Promise<Record<string, number>> {
  let raw: string;
  try {
    raw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  } catch {
    return {};
  }
  const items = JSON.parse(raw) as RawCatalogueEntry[];
  const counts = tripCountByCountry(items);
  return Object.fromEntries(counts);
}
