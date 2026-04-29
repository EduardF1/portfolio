// Apply high-confidence GeoCLIP predictions to no-GPS catalogue entries.
//
// Inputs:
//   - scripts/.geoclip-predictions.json (preferred — full top-K + geocode)
//   - docs/geoclip-location-proposals.md (fallback — top-1 only)
// Output:
//   - scripts/photo-catalogue.json (updated in place for accepted entries)
//   - docs/geoclip-applied.md (audit trail)
//
// Acceptance rules:
//   1. Country sanity check: predicted country MUST equal trip-slug's expected country.
//   2. Probability above noise floor (top1 prob > 0.05).
//   3. Skip entries explicitly flagged as outliers in geoclip-location-proposals.md.
//
// Catalogue updates: hasGps=true, gps={lat,lon}, place={city,country,display},
// gpsSource="geoclip". Reverse-geocoding uses scripts/.geocode-cache.json (cache-first).

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOGUE_PATH = path.join(ROOT, "scripts", "photo-catalogue.json");
const PREDICTIONS_PATH = path.join(ROOT, "scripts", ".geoclip-predictions.json");
const PROPOSALS_PATH = path.join(ROOT, "docs", "geoclip-location-proposals.md");
const GEOCODE_CACHE_PATH = path.join(ROOT, "scripts", ".geocode-cache.json");
const APPLIED_DOC_PATH = path.join(ROOT, "docs", "geoclip-applied.md");

const PROB_THRESHOLD = 0.05;

// Trip slug -> expected country (canonical English Nominatim form).
const TRIP_COUNTRY = {
  "2018-03-israel": "Israel",
  "2018-04-sweden": "Sweden",
  "2019-07-belgium": "Belgium",
  "2019-07-luxembourg": "Luxembourg",
  "2020-02-denmark": "Denmark",
  "2022-07-greece": "Greece",
  "2022-08-denmark": "Denmark",
  "2022-08-romania": "Romania",
  "2022-10-denmark": "Denmark",
  "2022-10-germany": "Germany",
  "2022-12-romania": "Romania",
  "2023-07-turkey": "Turkey",
  "2023-08-romania": "Romania",
  "2024-09-albania-saranda": "Albania",
  "2025-02-finland": "Finland",
  "2025-03-romania": "Romania",
};

// Outliers explicitly flagged as suspect in docs/geoclip-location-proposals.md.
// These are not auto-applied even if other rules would accept them.
const OUTLIER_SRCS = new Set([
  "trips/2022-08-romania/pexels-brasov-cobblestone-street-36957142.jpg", // Brașov -> Retz, Austria
  "trips/2022-12-romania/pexels-bucharest-arcul-de-triumf-night-31829727.jpg", // Bucharest -> Paris
  "trips/2025-03-romania/pexels-bucharest-parliament-cloudy-17066979.jpg", // Bucharest -> Budapest
  "trips/2024-09-albania-saranda/pexels-saranda-night-lights-6863718.jpg", // Saranda -> Greece
]);

function tripSlugFromSrc(src) {
  const parts = src.split("/");
  return parts.length > 1 ? parts[1] : "";
}

function geocodeCacheKey(lat, lon) {
  return `${(Math.round(lat * 100) / 100).toFixed(2)},${(Math.round(lon * 100) / 100).toFixed(2)}`;
}

async function loadJson(p) {
  return JSON.parse(await fs.readFile(p, "utf-8"));
}

// Parse the markdown proposals doc into a list of {src, lat, lon, prob, geocode_display}.
async function parseProposalsMd() {
  const text = await fs.readFile(PROPOSALS_PATH, "utf-8");
  const lines = text.split(/\r?\n/);
  const entries = [];
  let currentSrc = null;
  let currentHint = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const srcMatch = line.match(/^- \[ \] approve — `([^`]+)`/);
    if (srcMatch) {
      currentSrc = srcMatch[1];
      currentHint = null;
      continue;
    }
    const hintMatch = line.match(/^\s+- hint: `([^`]+)`/);
    if (hintMatch && currentSrc) {
      currentHint = hintMatch[1] === "None" ? null : hintMatch[1];
      continue;
    }
    const top1Match = line.match(
      /^\s+- top-1: `\(([-\d.]+),\s*([-\d.]+)\)` prob `([\d.]+)` -> \*\*([^*]+)\*\*/
    );
    if (top1Match && currentSrc) {
      const lat = parseFloat(top1Match[1]);
      const lon = parseFloat(top1Match[2]);
      const prob = parseFloat(top1Match[3]);
      const geocodeDisplay = top1Match[4].trim();
      entries.push({
        src: currentSrc,
        place_hint: currentHint,
        topK: [{ lat, lon, prob }],
        top1_geocode: parseGeocodeDisplay(geocodeDisplay),
      });
      currentSrc = null;
      currentHint = null;
    }
  }
  return entries;
}

// "Brasov, Romania" -> {city: "Brasov", country: "Romania", display: "Brasov, Romania"}
function parseGeocodeDisplay(display) {
  const trimmed = display.trim();
  const lastComma = trimmed.lastIndexOf(",");
  if (lastComma === -1) {
    return { city: null, country: trimmed, display: trimmed };
  }
  const city = trimmed.slice(0, lastComma).trim();
  const country = trimmed.slice(lastComma + 1).trim();
  return { city, country, display: trimmed };
}

async function loadPredictions() {
  if (existsSync(PREDICTIONS_PATH)) {
    const data = await loadJson(PREDICTIONS_PATH);
    return data.predictions;
  }
  console.log(
    "[apply-geoclip] .geoclip-predictions.json not found; parsing docs/geoclip-location-proposals.md instead."
  );
  return await parseProposalsMd();
}

async function main() {
  const catalogue = await loadJson(CATALOGUE_PATH);
  const predictions = await loadPredictions();
  const geocodeCache = existsSync(GEOCODE_CACHE_PATH)
    ? await loadJson(GEOCODE_CACHE_PATH)
    : {};

  const catBySrc = new Map(catalogue.map((e, idx) => [e.src, idx]));

  const applied = [];
  const skipped = [];

  for (const pred of predictions) {
    const src = pred.src;
    const idx = catBySrc.get(src);
    if (idx === undefined) {
      skipped.push({ src, reason: "src not in catalogue" });
      continue;
    }
    const entry = catalogue[idx];
    if (entry.hasGps) {
      skipped.push({ src, reason: "already has GPS (skipping)" });
      continue;
    }
    if (OUTLIER_SRCS.has(src)) {
      skipped.push({ src, reason: "flagged as outlier in proposals doc" });
      continue;
    }
    if (!pred.topK || pred.topK.length === 0) {
      skipped.push({ src, reason: "no predictions (file missing or model error)" });
      continue;
    }
    const top1 = pred.topK[0];
    const slug = tripSlugFromSrc(src);
    const expectedCountry = TRIP_COUNTRY[slug];
    if (!expectedCountry) {
      skipped.push({
        src,
        reason: `no expected-country mapping for trip slug ${slug}`,
      });
      continue;
    }
    if (top1.prob <= PROB_THRESHOLD) {
      skipped.push({
        src,
        reason: `top-1 prob ${top1.prob.toFixed(4)} <= threshold ${PROB_THRESHOLD}`,
        top1_prob: top1.prob,
        top1_country: pred.top1_geocode?.country,
      });
      continue;
    }
    // Cache-first reverse geocode.
    const cacheKey = geocodeCacheKey(top1.lat, top1.lon);
    let place = geocodeCache[cacheKey] || pred.top1_geocode || null;
    if (!place) {
      skipped.push({
        src,
        reason: `no geocode available for ${cacheKey} (cache miss + no top1_geocode)`,
      });
      continue;
    }
    // Country sanity check.
    const predCountry = (place.country || "").trim();
    if (predCountry !== expectedCountry) {
      skipped.push({
        src,
        reason: `country mismatch: predicted ${predCountry || "<unknown>"} != expected ${expectedCountry}`,
        top1_prob: top1.prob,
      });
      continue;
    }
    // APPLY. Rebuild the entry in canonical key order matching
    // build-photo-catalogue.mjs's buildCatalogueEntry shape:
    //   src, takenAt, hasGps, [cameraModel], gps, place, gpsSource, [source]
    const before = { hasGps: false, place: entry.place || null };
    const newPlace = {
      city: place.city || null,
      country: place.country || null,
      display:
        place.display ||
        `${place.city || ""}, ${place.country || ""}`.replace(/^, /, ""),
    };
    /** @type {Record<string, unknown>} */
    const rebuilt = {
      src: entry.src,
      takenAt: entry.takenAt ?? null,
      hasGps: true,
    };
    if (entry.cameraModel) rebuilt.cameraModel = entry.cameraModel;
    rebuilt.gps = { lat: top1.lat, lon: top1.lon };
    rebuilt.place = newPlace;
    rebuilt.gpsSource = "geoclip";
    if (entry.source) rebuilt.source = entry.source;
    // Preserve any other fields siblings may have appended.
    for (const [k, v] of Object.entries(entry)) {
      if (!(k in rebuilt)) rebuilt[k] = v;
    }
    catalogue[idx] = rebuilt;
    applied.push({
      src,
      before,
      after: {
        gps: { lat: top1.lat, lon: top1.lon },
        place: newPlace,
        prob: top1.prob,
      },
    });
    // Top up geocode cache.
    if (!geocodeCache[cacheKey]) {
      geocodeCache[cacheKey] = {
        city: place.city || null,
        country: place.country || null,
        display: place.display || null,
      };
    }
  }

  // Persist catalogue.
  await fs.writeFile(
    CATALOGUE_PATH,
    JSON.stringify(catalogue, null, 2) + "\n",
    "utf-8"
  );
  console.log(
    `[apply-geoclip] Wrote ${CATALOGUE_PATH} (applied=${applied.length}, skipped=${skipped.length})`
  );

  // Persist (potentially augmented) geocode cache.
  await fs.writeFile(
    GEOCODE_CACHE_PATH,
    JSON.stringify(geocodeCache, null, 2) + "\n",
    "utf-8"
  );

  // Build audit doc.
  const md = buildAppliedDoc(applied, skipped);
  await fs.writeFile(APPLIED_DOC_PATH, md, "utf-8");
  console.log(`[apply-geoclip] Wrote ${APPLIED_DOC_PATH}`);

  return { applied, skipped };
}

function buildAppliedDoc(applied, skipped) {
  const lines = [];
  lines.push("# GeoCLIP applied predictions");
  lines.push("");
  lines.push(
    "High-confidence GeoCLIP top-1 predictions auto-applied to `scripts/photo-catalogue.json` for previously no-GPS entries. Generated by `scripts/apply-geoclip-predictions.mjs`."
  );
  lines.push("");
  lines.push("## Acceptance rules");
  lines.push("");
  lines.push(
    "1. **Country sanity check** — predicted country must match the trip slug's expected country (e.g. `trips/2022-08-romania/...` must geocode to Romania). Otherwise SKIP."
  );
  lines.push("2. **Noise floor** — top-1 prob must exceed `0.05`.");
  lines.push(
    "3. **Outlier list** — Brașov→Retz, Bucharest→Paris, Bucharest→Budapest, and Saranda→Greece are excluded as flagged in `docs/geoclip-location-proposals.md`."
  );
  lines.push("");
  lines.push(
    'Each accepted entry gets `hasGps: true`, `gps: {lat, lon}`, `place: {city, country, display}`, and a `gpsSource: "geoclip"` marker for future audits.'
  );
  lines.push("");
  lines.push("## Caveat");
  lines.push("");
  lines.push(
    "GeoCLIP predicts coordinates from image content alone. Accuracy is **city-level** (smoke-test mean error 2.34 km, max 3.73 km), **not pixel-accurate**. Treat lat/lon as a city pin for map clustering, not as the photo's exact capture point."
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Applied**: ${applied.length}`);
  lines.push(`- **Skipped**: ${skipped.length}`);
  lines.push("");
  // Bucket skip reasons.
  const reasonCounts = new Map();
  for (const s of skipped) {
    const key = bucketReason(s.reason);
    reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
  }
  if (reasonCounts.size) {
    lines.push("Skip reason breakdown:");
    lines.push("");
    const sorted = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [k, v] of sorted) lines.push(`- ${k}: ${v}`);
    lines.push("");
  }

  // Applied table grouped by trip.
  lines.push("## Applied entries");
  lines.push("");
  lines.push("| src | before | after (city, country) | lat, lon | prob |");
  lines.push("| --- | --- | --- | ---: | ---: |");
  for (const a of applied) {
    const beforeStr = a.before.place?.display || "(no place hint)";
    const afterStr = a.after.place.display;
    const latlon = `${a.after.gps.lat.toFixed(4)}, ${a.after.gps.lon.toFixed(4)}`;
    lines.push(
      `| \`${a.src}\` | ${beforeStr} (no GPS) | ${afterStr} | ${latlon} | ${a.after.prob.toFixed(4)} |`
    );
  }
  lines.push("");

  // Skipped entries.
  lines.push("## Skipped entries");
  lines.push("");
  lines.push("| src | reason |");
  lines.push("| --- | --- |");
  for (const s of skipped) {
    lines.push(`| \`${s.src}\` | ${s.reason} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function bucketReason(reason) {
  if (reason.startsWith("country mismatch:")) return "country mismatch";
  if (reason.startsWith("top-1 prob")) return "below noise floor (prob <= 0.05)";
  if (reason === "flagged as outlier in proposals doc") return "outlier (manual flag)";
  if (reason === "already has GPS (skipping)") return "already had GPS";
  return reason;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
