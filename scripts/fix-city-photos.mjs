/**
 * fix-city-photos.mjs
 *
 * Performs four tasks:
 *  1. Rename "Czechia" → "Czech Republic" in photo-catalogue.json and
 *     normalize-place-names.mjs.
 *  2. Replace 5 bad Denmark photos each for Ejby, Grenaa, Middelfart, Odense,
 *     Randers, Silkeborg.  Add 2 more photos for Aarhus.
 *  3. Backfill Albania: +1 for Durrës, +1 for Vlora (Saranda already has 5).
 *  4. Fix Belgium: +1 Pexels for Ghent, +1 Pexels for Brussels.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PEXELS_KEY =
  "dfW5gSS00CrmUgPQraZC6rwcrybajthYnuiwzKPQtNV9XjE1NBEpTLVm";
const PROJECT_ROOT = join(__dirname, "..");
const CAT_PATH = join(PROJECT_ROOT, "scripts", "photo-catalogue.json");

// ── Pexels helpers ────────────────────────────────────────────────────────────

async function searchPexels(query, perPage = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape`;
  const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!r.ok) {
    console.error(`  Pexels search failed (${r.status}) for: ${query}`);
    return [];
  }
  const data = await r.json();
  return data.photos || [];
}

async function downloadAndProcess(pexelsId, destPath) {
  const url = `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed (${r.status}) for ID ${pexelsId}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const tmpPath = destPath + ".tmp";
  writeFileSync(tmpPath, buf);
  await sharp(tmpPath)
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(destPath);
  unlinkSync(tmpPath);
}

function makeDescSlug(alt) {
  if (!alt) return "photo";
  return alt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 4)
    .join("-")
    .substring(0, 40) || "photo";
}

function makeCitySlug(city) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PEOPLE_WORDS = /\b(people|crowd|man|woman|person|portrait|tourist|tourists|girl|boy|couple|family|vendor|workers|children|kids|face)\b/i;
const MOUNTAIN_WORDS = /\b(mountain|mountains|alpine|alps|peak|summit|glacier|highland|hills)\b/i;

function isGoodPhoto(photo, noDenmark = false) {
  const text = [photo.alt || "", photo.photographer || ""].join(" ");
  if (PEOPLE_WORDS.test(text)) return false;
  if (noDenmark && MOUNTAIN_WORDS.test(text)) return false;
  return true;
}

/** Collect `needed` good photos from multiple queries, skipping already-used IDs */
async function collectPhotos(queries, usedIds, needed, isDenmark = false) {
  const results = [];
  const seen = new Set();

  for (const query of queries) {
    if (results.length >= needed) break;
    console.log(`  Searching Pexels: "${query}"…`);
    const photos = await searchPexels(query, 20);
    for (const photo of photos) {
      if (results.length >= needed) break;
      const sid = String(photo.id);
      if (seen.has(sid) || usedIds.has(sid)) continue;
      seen.add(sid);
      if (!isGoodPhoto(photo, isDenmark)) {
        console.log(`  Skip (people/mountain): ${sid} — ${photo.alt}`);
        continue;
      }
      results.push(photo);
    }
  }

  if (results.length < needed) {
    console.warn(
      `  WARNING: only found ${results.length}/${needed} photos for queries: ${queries.join(", ")}`
    );
  }
  return results;
}

function makeEntry(photo, citySlug, folder, city, country) {
  const descSlug = makeDescSlug(photo.alt);
  const filename = `pexels-${citySlug}-${descSlug}-${photo.id}.jpg`;
  const src = `trips/${folder}/${filename}`;
  return {
    entry: {
      src,
      takenAt: null,
      hasGps: false,
      place: { city, country, display: `${city}, ${country}` },
      source: {
        type: "stock",
        provider: "Pexels",
        url: `https://www.pexels.com/photo/${photo.id}/`,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        license: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
      },
      caption: photo.alt
        ? photo.alt.split(/[,.\-|]/)[0].trim() + ` · ${city}, ${country}`
        : `${city}, ${country}`,
    },
    filename,
  };
}

// ── Catalogue helpers ─────────────────────────────────────────────────────────

function getAllUsedIds(cat) {
  const ids = new Set();
  for (const e of cat) {
    const m = e.src && e.src.match(/pexels-photo-(\d+)|(\d+)\.jpg/);
    if (m) ids.add(m[1] || m[2]);
    // also extract ID from last hyphen-segment of filename
    const fname = e.src && e.src.split("/").pop();
    if (fname) {
      const parts = fname.replace(".jpg", "").split("-");
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) ids.add(last);
    }
    // and from source URL
    if (e.source && e.source.url) {
      const um = e.source.url.match(/\/photo\/(\d+)/);
      if (um) ids.add(um[1]);
    }
  }
  return ids;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let cat = JSON.parse(readFileSync(CAT_PATH, "utf8"));
  console.log(`Loaded catalogue: ${cat.length} entries`);

  // ── Task 1: Czechia → Czech Republic ───────────────────────────────────────
  console.log("\n=== TASK 1: Czechia → Czech Republic ===");
  let czechiaCount = 0;
  cat = cat.map((e) => {
    if (e.place && e.place.country === "Czechia") {
      czechiaCount++;
      return {
        ...e,
        place: {
          ...e.place,
          country: "Czech Republic",
          display: e.place.city
            ? `${e.place.city}, Czech Republic`
            : "Czech Republic",
        },
      };
    }
    return e;
  });
  console.log(`  Updated ${czechiaCount} Czechia → Czech Republic entries`);

  // Fix normalize-place-names.mjs — swap the country alias direction
  const normPath = join(PROJECT_ROOT, "scripts", "normalize-place-names.mjs");
  let normContent = readFileSync(normPath, "utf8");
  if (normContent.includes('"Czech Republic": "Czechia"')) {
    normContent = normContent.replace(
      '"Czech Republic": "Czechia"',
      '"Czechia": "Czech Republic"'
    );
    writeFileSync(normPath, normContent, "utf8");
    console.log("  Updated normalize-place-names.mjs alias direction");
  } else if (normContent.includes('"Czechia": "Czech Republic"')) {
    console.log("  normalize-place-names.mjs already correct");
  } else {
    console.warn("  Could not find Czechia alias in normalize-place-names.mjs");
  }

  // Search src/ for hardcoded "Czechia"
  console.log(
    "  (src/ Czechia scan is handled by the git commit — script updates catalogue only)"
  );

  // ── Task 2: Denmark photos ─────────────────────────────────────────────────
  console.log("\n=== TASK 2: Denmark photos ===");
  const DENMARK_FOLDER = "2022-10-denmark";
  const DENMARK_DIR = join(
    PROJECT_ROOT,
    "public",
    "photos",
    "trips",
    DENMARK_FOLDER
  );

  const denmarkCities = [
    {
      city: "Ejby",
      queries: [
        "Danish village Funen countryside",
        "small Danish village",
        "Funen island Denmark",
        "Danish rural landscape",
        "Denmark countryside village",
      ],
    },
    {
      city: "Grenaa",
      queries: [
        "Grenaa Denmark harbour",
        "Kattegat coast Denmark",
        "Grenaa coastal Denmark",
        "Danish harbour town",
        "Denmark fishing harbour coast",
      ],
    },
    {
      city: "Middelfart",
      queries: [
        "Middelfart Denmark",
        "Little Belt bridge Denmark",
        "Funen Denmark bridge",
        "Denmark bridge waterway",
        "Funen island city Denmark",
      ],
    },
    {
      city: "Odense",
      queries: [
        "Odense Denmark city",
        "Hans Christian Andersen museum Odense",
        "Odense historic centre",
        "Odense Denmark street",
        "Odense Denmark landmark",
      ],
    },
    {
      city: "Randers",
      queries: [
        "Randers Denmark city",
        "Randers fjord Denmark",
        "Randers town centre",
        "Randers Denmark downtown",
        "Denmark town square",
      ],
    },
    {
      city: "Silkeborg",
      queries: [
        "Silkeborg Denmark lake",
        "Silkeborg city Denmark",
        "Gudenaa river Denmark",
        "Silkeborg Denmark nature",
        "Danish lake landscape",
      ],
    },
  ];

  for (const { city, queries } of denmarkCities) {
    console.log(`\n-- Replacing ${city} photos --`);

    // Find existing catalogue entries for this city
    const oldEntries = cat.filter(
      (e) => e.place && e.place.city === city && e.place.country === "Denmark"
    );
    console.log(`  Found ${oldEntries.length} existing entries`);

    // Delete old files
    for (const e of oldEntries) {
      const fpath = join(PROJECT_ROOT, "public", "photos", e.src);
      if (existsSync(fpath)) {
        unlinkSync(fpath);
        console.log(`  Deleted: ${e.src}`);
      } else {
        console.log(`  Not found (skip delete): ${e.src}`);
      }
    }

    // Remove old entries from catalogue
    cat = cat.filter(
      (e) =>
        !(e.place && e.place.city === city && e.place.country === "Denmark")
    );

    // Get all currently used IDs (refresh after each city)
    const usedIds = getAllUsedIds(cat);

    // Search for 5 new photos
    const photos = await collectPhotos(queries, usedIds, 5, true);

    // Download, process, add to catalogue
    const citySlug = makeCitySlug(city);
    for (const photo of photos) {
      const { entry, filename } = makeEntry(
        photo,
        citySlug,
        DENMARK_FOLDER,
        city,
        "Denmark"
      );
      const destPath = join(DENMARK_DIR, filename);
      console.log(`  Downloading ${photo.id} → ${filename}`);
      try {
        await downloadAndProcess(photo.id, destPath);
        cat.push(entry);
        console.log(`  Added: ${entry.src}`);
      } catch (err) {
        console.error(`  ERROR downloading ${photo.id}: ${err.message}`);
      }
    }
  }

  // Aarhus: add 2 more
  console.log("\n-- Adding 2 more Aarhus photos --");
  const usedIdsAarhus = getAllUsedIds(cat);
  const aarhusPhotos = await collectPhotos(
    [
      "Aarhus Denmark city",
      "Aarhus old town Den Gamle By",
      "ARoS Aarhus museum",
      "Aarhus harbour Denmark",
      "Aarhus Denmark architecture",
    ],
    usedIdsAarhus,
    2,
    true
  );
  for (const photo of aarhusPhotos) {
    const { entry, filename } = makeEntry(
      photo,
      "aarhus",
      DENMARK_FOLDER,
      "Aarhus",
      "Denmark"
    );
    const destPath = join(DENMARK_DIR, filename);
    console.log(`  Downloading ${photo.id} → ${filename}`);
    try {
      await downloadAndProcess(photo.id, destPath);
      cat.push(entry);
      console.log(`  Added: ${entry.src}`);
    } catch (err) {
      console.error(`  ERROR downloading ${photo.id}: ${err.message}`);
    }
  }

  // ── Task 3: Albania backfill ───────────────────────────────────────────────
  console.log("\n=== TASK 3: Albania backfill ===");
  const ALBANIA_FOLDER = "2024-09-albania-saranda";
  const ALBANIA_DIR = join(
    PROJECT_ROOT,
    "public",
    "photos",
    "trips",
    ALBANIA_FOLDER
  );

  // Durrës: +1
  {
    console.log("\n-- Durrës +1 --");
    const usedIds = getAllUsedIds(cat);
    const photos = await collectPhotos(
      [
        "Durres Albania amphitheatre",
        "Durres Albania promenade",
        "Durres Albania coast",
        "Albania Adriatic coast city",
      ],
      usedIds,
      1,
      false
    );
    for (const photo of photos) {
      const { entry, filename } = makeEntry(
        photo,
        "durres",
        ALBANIA_FOLDER,
        "Durrës",
        "Albania"
      );
      const destPath = join(ALBANIA_DIR, filename);
      console.log(`  Downloading ${photo.id} → ${filename}`);
      try {
        await downloadAndProcess(photo.id, destPath);
        cat.push(entry);
        console.log(`  Added: ${entry.src}`);
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  // Vlora: +1
  {
    console.log("\n-- Vlora +1 --");
    const usedIds = getAllUsedIds(cat);
    const photos = await collectPhotos(
      [
        "Vlore Albania seafront",
        "Vlora Albania independence monument",
        "Vlora Albania bay",
        "Albania southern coast city",
      ],
      usedIds,
      1,
      false
    );
    for (const photo of photos) {
      const { entry, filename } = makeEntry(
        photo,
        "vlora",
        ALBANIA_FOLDER,
        "Vlora",
        "Albania"
      );
      const destPath = join(ALBANIA_DIR, filename);
      console.log(`  Downloading ${photo.id} → ${filename}`);
      try {
        await downloadAndProcess(photo.id, destPath);
        cat.push(entry);
        console.log(`  Added: ${entry.src}`);
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  // Saranda: already has 5 — skip
  console.log("\n-- Saranda: already has 5, skipping --");

  // ── Task 4: Belgium ────────────────────────────────────────────────────────
  console.log("\n=== TASK 4: Belgium ===");
  const BELGIUM_FOLDER = "2019-07-belgium";
  const BELGIUM_DIR = join(
    PROJECT_ROOT,
    "public",
    "photos",
    "trips",
    BELGIUM_FOLDER
  );

  // Ghent: +1 Pexels
  {
    console.log("\n-- Ghent +1 --");
    const usedIds = getAllUsedIds(cat);
    const photos = await collectPhotos(
      [
        "Ghent Belgium Graslei",
        "Ghent Gravensteen castle",
        "Ghent Sint-Baafskathedraal",
        "Ghent Belgium canal",
        "Ghent medieval city Belgium",
      ],
      usedIds,
      1,
      false
    );
    for (const photo of photos) {
      const { entry, filename } = makeEntry(
        photo,
        "ghent",
        BELGIUM_FOLDER,
        "Ghent",
        "Belgium"
      );
      const destPath = join(BELGIUM_DIR, filename);
      console.log(`  Downloading ${photo.id} → ${filename}`);
      try {
        await downloadAndProcess(photo.id, destPath);
        cat.push(entry);
        console.log(`  Added: ${entry.src}`);
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  // Brussels: +1 Pexels (currently has 4 stock, need 5)
  {
    console.log("\n-- Brussels +1 --");
    const usedIds = getAllUsedIds(cat);
    const photos = await collectPhotos(
      [
        "Brussels Grand Place Belgium",
        "Brussels atomium Belgium",
        "Manneken Pis Brussels",
        "Brussels Belgium city centre",
        "Brussels historic architecture",
      ],
      usedIds,
      1,
      false
    );
    for (const photo of photos) {
      const { entry, filename } = makeEntry(
        photo,
        "brussels",
        BELGIUM_FOLDER,
        "Brussels",
        "Belgium"
      );
      const destPath = join(BELGIUM_DIR, filename);
      console.log(`  Downloading ${photo.id} → ${filename}`);
      try {
        await downloadAndProcess(photo.id, destPath);
        cat.push(entry);
        console.log(`  Added: ${entry.src}`);
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  // ── Save catalogue ─────────────────────────────────────────────────────────
  console.log("\n=== Saving catalogue ===");
  writeFileSync(CAT_PATH, JSON.stringify(cat, null, 2) + "\n", "utf8");
  console.log(`Saved ${cat.length} entries to ${CAT_PATH}`);

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log("\n=== SUMMARY ===");
  const cities = [
    "Ejby",
    "Grenaa",
    "Middelfart",
    "Odense",
    "Randers",
    "Silkeborg",
    "Aarhus",
    "Durrës",
    "Vlora",
    "Saranda",
    "Brussels",
    "Bruges",
    "Ghent",
    "Brno",
    "Jaroslavice",
  ];
  const byCityCountry = {};
  cat.forEach((p) => {
    if (p.place) {
      const k = `${p.place.country}|${p.place.city}`;
      byCityCountry[k] = (byCityCountry[k] || 0) + 1;
    }
  });
  Object.entries(byCityCountry)
    .filter(([k]) => cities.some((c) => k.includes(c)))
    .sort()
    .forEach(([k, v]) =>
      console.log((v < 5 ? "!! " : "   ") + v + " " + k)
    );
  console.log(
    "Czechia entries:",
    cat.filter((p) => p.place && p.place.country === "Czechia").length,
    "(should be 0)"
  );
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
