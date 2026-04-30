// One-shot normaliser for `place.city` / `place.display` in
// `scripts/photo-catalogue.json` (and the matching geocode cache).
//
// Why: Nominatim returns administrative names like
// "Stari Grad Urban Municipality, Serbia" or "Malmö kommun, Sweden".
// Eduard sees these on `/travel` country cards as separate cities even though
// they are the same city as their non-suffixed siblings (Belgrade, Malmö).
//
// What it does:
//   1. Walks every entry in `scripts/photo-catalogue.json`.
//   2. If `place.city` is in NORMALISATION_MAP, replaces it with the canonical
//      city + rebuilds `place.display` as "<city>, <country>".
//   3. Same rewrite is applied to `scripts/.geocode-cache.json` so a future
//      `npm run build:photos` (or `extend-catalogue.mjs`) does NOT reintroduce
//      the admin-suffixed names from cached Nominatim responses.
//   4. Preserves `gps`, file order, and every other field. Only the two place
//      fields are touched.
//
// Run with:
//   node scripts/normalize-place-names.mjs            # dry-run, prints diff
//   node scripts/normalize-place-names.mjs --write    # apply

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Canonical-name map keyed by the current `place.city` value (exact match).
 * Each entry is `{ city, country }` — the country is checked too, so a city
 * name shared by two countries is never mis-mapped.
 *
 * Sources of truth:
 *   - The user-supplied table in the task brief (Belgrade sub-municipalities,
 *     Brașov ASCII variant, Malmö kommun, Mate Asher, Kladovo Municipality).
 *   - Discovered via a sweep of `place.city` values for administrative
 *     suffixes ("Municipality", "kommun", "Regional Council", "Urban
 *     Municipality", "Grad" prefix, "Municipal Unit of …").
 *
 * Decisions:
 *   - "Mate Asher Regional Council" + "Rosh HaNikra (Mate Asher)" both
 *     consolidate to "Rosh HaNikra" — Eduard's photos are at the Rosh HaNikra
 *     grottoes (GPS 33.09, 35.10), and the brief explicitly says picking a
 *     more representative landmark is preferred.
 *   - "Grad Pula" → "Pula"  (Croatian "grad" = "city of"; admin label only).
 *   - "Istria County" is NOT remapped — it is a county-level fallback for
 *     three photos south of Pula whose true sub-city we cannot derive
 *     without re-geocoding at higher zoom; the brief explicitly told us not
 *     to consolidate "truly different cities". Left as-is.
 *   - "Aarhus" already canonical (no "Municipality" suffix in the catalogue).
 */
export const NORMALISATION_MAP = {
  // Serbia — Belgrade sub-municipalities.
  "Stari Grad Urban Municipality": { city: "Belgrade", country: "Serbia" },
  "Savski Venac Urban Municipality": { city: "Belgrade", country: "Serbia" },
  "Palilula Urban Municipality": { city: "Belgrade", country: "Serbia" },
  // Serbia — Kladovo town vs admin municipality of the same name.
  "Kladovo Municipality": { city: "Kladovo", country: "Serbia" },
  // Romania — collapse plain-ASCII variant into the Unicode-correct one.
  Brasov: { city: "Brașov", country: "Romania" },
  // Sweden — strip Swedish admin suffix.
  "Malmö kommun": { city: "Malmö", country: "Sweden" },
  // Israel — both labels point to Rosh HaNikra; consolidate.
  "Mate Asher Regional Council": { city: "Rosh HaNikra", country: "Israel" },
  "Rosh HaNikra (Mate Asher)": { city: "Rosh HaNikra", country: "Israel" },
  // Greece — strip "Municipality" / "Municipal Unit of" admin labels.
  "Abdera Municipality": { city: "Abdera", country: "Greece" },
  "Thassos Municipality": { city: "Thassos", country: "Greece" },
  "Municipal Unit of Nafplio": { city: "Nafplio", country: "Greece" },
  // Denmark — strip "Municipality" admin label (Billund is the city/town).
  "Billund Municipality": { city: "Billund", country: "Denmark" },
  // Croatia — strip Croatian "Grad" ("City of") prefix.
  "Grad Pula": { city: "Pula", country: "Croatia" },
};

/**
 * Country aliases: old name → canonical name.
 * Applied after city normalisation so `display` is rebuilt with the correct
 * country name. Keyed by the non-canonical spelling found in the catalogue.
 */
export const COUNTRY_ALIAS_MAP = {
  // Nominatim and older Pexels imports used the long-form name; the app uses
  // the short/modern ISO 3166-1 name throughout.
  "Czechia": "Czech Republic",
};

/**
 * Apply the map to a single `place` object. Returns the new object (or the
 * input unchanged if no rule matched).
 * @param {{ city: string | null, country: string | null, display: string } | null | undefined} place
 */
export function normalisePlace(place) {
  if (!place || typeof place !== "object") return place;
  let result = place;

  // 1. City-name normalization.
  const rule = NORMALISATION_MAP[result.city];
  if (rule && (!rule.country || result.country === rule.country)) {
    const country = result.country || rule.country;
    result = {
      ...result,
      city: rule.city,
      country,
      display: country ? `${rule.city}, ${country}` : rule.city,
    };
  }

  // 2. Country-name normalization.
  const canonicalCountry = COUNTRY_ALIAS_MAP[result.country];
  if (canonicalCountry) {
    result = {
      ...result,
      country: canonicalCountry,
      display: result.city
        ? `${result.city}, ${canonicalCountry}`
        : canonicalCountry,
    };
  }

  return result === place ? place : result;
}

function parseArgs(argv) {
  return { write: argv.includes("--write") };
}

function main() {
  const { write } = parseArgs(process.argv.slice(2));

  const cataloguePath = join(__dirname, "photo-catalogue.json");
  const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));

  /** @type {Map<string, { from: string, to: string, count: number }>} */
  const summary = new Map();
  let touched = 0;

  for (let i = 0; i < catalogue.length; i++) {
    const entry = catalogue[i];
    const before = entry.place;
    const after = normalisePlace(before);
    if (after === before) continue;
    if (before && after && (before.city !== after.city || before.country !== after.country || before.display !== after.display)) {
      const key = `${before.city}|${before.country} -> ${after.city}|${after.country}`;
      const rec = summary.get(key) || {
        from: `${before.city}, ${before.country}`,
        to: `${after.city}, ${after.country}`,
        count: 0,
      };
      rec.count++;
      summary.set(key, rec);
      catalogue[i] = { ...entry, place: after };
      touched++;
    }
  }

  // Geocode cache: same rewrite, so a rebuild does not reintroduce admin
  // suffixes from cached Nominatim responses.
  const cachePath = join(__dirname, ".geocode-cache.json");
  let cacheTouched = 0;
  let cache = null;
  if (existsSync(cachePath)) {
    cache = JSON.parse(readFileSync(cachePath, "utf8"));
    for (const key of Object.keys(cache)) {
      const before = cache[key];
      const after = normalisePlace(before);
      if (after !== before) {
        cache[key] = after;
        cacheTouched++;
      }
    }
  }

  console.log(`Catalogue entries rewritten: ${touched}`);
  console.log(`Geocode cache entries rewritten: ${cacheTouched}`);
  console.log("\nConsolidations:");
  const rows = [...summary.values()].sort((a, b) => b.count - a.count);
  for (const r of rows) {
    console.log(`  ${r.count.toString().padStart(3)}  ${r.from}  ->  ${r.to}`);
  }

  if (!write) {
    console.log("\n(dry-run; pass --write to persist changes)");
    return 0;
  }

  writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${cataloguePath}`);
  if (cache) {
    writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
    console.log(`Wrote ${cachePath}`);
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("normalize-place-names.mjs")) {
  process.exit(main());
}
