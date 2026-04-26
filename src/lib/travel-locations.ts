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
