// Pexels-only placeholder galleries for two trips Eduard mentioned but for which
// the photo archive carries zero own-camera GPS hits:
//
//   - 2019-05 Netherlands  (Amsterdam + Rotterdam + The Hague + Utrecht)
//   - 2019-07 France-Sedan (paired with the Belgium 2019-07 trip — Sedan was
//     the same-day French side-trip from the Bouillon GPS cluster on Jul 30)
//
// Same convention as scripts/.hu-de-cities/apply-pexels.mjs from the Hungary/
// Germany backfill: synth `takenAt` (mid-trip noon), `hasGps:true` with city
// centroid, `cameraModel:"Pexels stock"`, `stock:true`. This makes the
// gallery surface as a real Trip in src/lib/trips.ts (which keys off
// hasGps + takenAt + place.country).

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

// City centroids for hand-curated GPS on stock entries.
const CITY = {
  amsterdam: { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lon: 4.9041 },
  rotterdam: { city: "Rotterdam", country: "Netherlands", lat: 51.9244, lon: 4.4777 },
  hague:     { city: "The Hague", country: "Netherlands", lat: 52.0705, lon: 4.3007 },
  utrecht:   { city: "Utrecht",   country: "Netherlands", lat: 52.0907, lon: 5.1214 },
  sedan:     { city: "Sedan",     country: "France",      lat: 49.7016, lon: 4.9425 },
  charleville: { city: "Sedan",   country: "France",      lat: 49.7016, lon: 4.9425 }, // Charleville is 25km from Sedan; tag to Sedan since the trip's about Sedan
};

// Synthetic dates per trip — chronologically plausible and distinct so each
// surfaces as its own cluster. Netherlands trip is a notional spring-2019
// long weekend (Amsterdam tulip season). France-Sedan is the same day as
// the Belgian-Ardennes / Bouillon archive cluster (Jul 30 2019), since
// Sedan is 30km from Bouillon — natural same-day side trip.
const NL_DATE = "2019-05-04T12:00:00Z";
const FR_DATE = "2019-07-30T15:00:00Z";

const PICKS = [
  // ---------- 2019-05 NETHERLANDS — Amsterdam (5) ----------
  {
    tripFolder: "2019-05-netherlands",
    id: 29351196,
    slug: "amsterdam-canal-boats-trees",
    photographer: "naimish17",
    photographerUrl: "https://www.pexels.com/@naimish17",
    pageUrl: "https://www.pexels.com/photo/scenic-amsterdam-canal-with-boats-and-trees-29351196/",
    description: "Amsterdam canal lined with boats and trees beneath historic facades.",
    place: CITY.amsterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 18936486,
    slug: "amsterdam-canal-from-bridge",
    photographer: "cvele",
    photographerUrl: "https://www.pexels.com/@cvele",
    pageUrl: "https://www.pexels.com/photo/canal-in-amsterdam-seen-from-bridge-18936486/",
    description: "Amsterdam canal seen from a bridge with classic Dutch architecture.",
    place: CITY.amsterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 31773686,
    slug: "amsterdam-canal-houseboats-morning",
    photographer: "Titouan Jullien",
    photographerUrl: "https://www.pexels.com/@titouan-jullien-504247666",
    pageUrl: "https://www.pexels.com/photo/scenic-canal-view-with-boats-in-amsterdam-31773686/",
    description: "Quiet morning canal view in Amsterdam with houseboats and historic facades.",
    place: CITY.amsterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 36670516,
    slug: "amsterdam-canal-spring",
    photographer: "Burak Akmanoglu",
    photographerUrl: "https://www.pexels.com/@burak-akmanoglu-745300984",
    pageUrl: "https://www.pexels.com/photo/scenic-amsterdam-canal-with-boats-and-trees-in-spring-36670516/",
    description: "Amsterdam canal lined with boats and spring trees under clear skies.",
    place: CITY.amsterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 29351195,
    slug: "amsterdam-canal-bridge-church",
    photographer: "naimish17",
    photographerUrl: "https://www.pexels.com/@naimish17",
    pageUrl: "https://www.pexels.com/photo/charming-amsterdam-canal-with-boats-and-bridge-29351195/",
    description: "Amsterdam canal with boats, bridge, and a church spire in the background.",
    place: CITY.amsterdam,
    takenAt: NL_DATE,
  },

  // ---------- 2019-05 NETHERLANDS — Rotterdam (3) ----------
  {
    tripFolder: "2019-05-netherlands",
    id: 20655919,
    slug: "rotterdam-erasmus-bridge-sunset",
    photographer: "Igor Passchier",
    photographerUrl: "https://www.pexels.com/@igor-passchier-111147847",
    pageUrl: "https://www.pexels.com/photo/suspension-bridge-by-the-harbor-in-rotterdam-20655919/",
    description: "Erasmus Bridge over the harbor in Rotterdam at sunset.",
    place: CITY.rotterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 35993737,
    slug: "rotterdam-willemsbrug-white-house",
    photographer: "braujardim",
    photographerUrl: "https://www.pexels.com/@braujardim",
    pageUrl: "https://www.pexels.com/photo/sunset-over-willemsbrug-and-historic-white-house-rotterdam-35993737/",
    description: "Sunset over Willemsbrug and the historic Witte Huis in Rotterdam.",
    place: CITY.rotterdam,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 29819767,
    slug: "rotterdam-cube-houses",
    photographer: "Valter Biscaia Filho",
    photographerUrl: "https://www.pexels.com/@valter-biscaia-filho-2147883999",
    pageUrl: "https://www.pexels.com/photo/cube-houses-in-rotterdam-architectural-innovation-29819767/",
    description: "Rotterdam's iconic Cube Houses showcasing post-war architectural innovation.",
    place: CITY.rotterdam,
    takenAt: NL_DATE,
  },

  // ---------- 2019-05 NETHERLANDS — The Hague (3) ----------
  {
    tripFolder: "2019-05-netherlands",
    id: 18684354,
    slug: "the-hague-binnenhof-fountain",
    photographer: "Patrick Jaksic",
    photographerUrl: "https://www.pexels.com/@patrick-jaksic-615183630",
    pageUrl: "https://www.pexels.com/photo/binnenhof-in-hague-in-netherlands-18684354/",
    description: "The Binnenhof government complex in The Hague with its central fountain.",
    place: CITY.hague,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 33841317,
    slug: "the-hague-skyline-historic-modern",
    photographer: "Jakub Zerdzicki",
    photographerUrl: "https://www.pexels.com/@jakubzerdzicki",
    pageUrl: "https://www.pexels.com/photo/skyline-of-the-hague-featuring-historic-and-modern-buildings-33841317/",
    description: "The Hague skyline blending historic spires with modern South-Holland office towers.",
    place: CITY.hague,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 34126088,
    slug: "the-hague-scheveningen-beach",
    photographer: "Jakub Zerdzicki",
    photographerUrl: "https://www.pexels.com/@jakubzerdzicki",
    pageUrl: "https://www.pexels.com/photo/scheveningen-beach-and-cityscape-the-hague-34126088/",
    description: "Scheveningen beach and coastal cityscape on the edge of The Hague.",
    place: CITY.hague,
    takenAt: NL_DATE,
  },

  // ---------- 2019-05 NETHERLANDS — Utrecht (3) ----------
  {
    tripFolder: "2019-05-netherlands",
    id: 32348115,
    slug: "utrecht-dom-tower-blue-sky",
    photographer: "Martijn Stoof",
    photographerUrl: "https://www.pexels.com/@martijn-stoof",
    pageUrl: "https://www.pexels.com/photo/dom-tower-against-clear-blue-sky-in-utrecht-32348115/",
    description: "Utrecht's Dom Tower framed by green trees under a clear blue sky.",
    place: CITY.utrecht,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 33375300,
    slug: "utrecht-canal-evening",
    photographer: "Barkalı",
    photographerUrl: "https://www.pexels.com/@barkali-340353352",
    pageUrl: "https://www.pexels.com/photo/scenic-evening-canal-view-in-utrecht-netherlands-33375300/",
    description: "Evening canal view in central Utrecht with cafe terraces along the waterline.",
    place: CITY.utrecht,
    takenAt: NL_DATE,
  },
  {
    tripFolder: "2019-05-netherlands",
    id: 33021970,
    slug: "utrecht-cyclists-dom-tower",
    photographer: "Ernesto",
    photographerUrl: "https://www.pexels.com/@ernesto-2335487",
    pageUrl: "https://www.pexels.com/photo/cyclists-near-dom-tower-utrecht-historic-street-33021970/",
    description: "Cyclists passing the Dom Tower along an Utrecht historic-centre street.",
    place: CITY.utrecht,
    takenAt: NL_DATE,
  },

  // ---------- 2019-07 FRANCE-SEDAN (5) ----------
  // Sedan-specific photography on Pexels is sparse; following the Hungary
  // backfill convention (regional Hungarian Plain photos for Szarvas/Gyula)
  // the gallery uses Sedan-region (Ardennes department + Grand Est) photos
  // tagged to Sedan's centroid, plus the closest Charleville-Mézières frames.
  {
    tripFolder: "2019-07-france-sedan",
    id: 32604665,
    slug: "charleville-french-town",
    photographer: "Filiamariss",
    photographerUrl: "https://www.pexels.com/@filiamariss",
    pageUrl: "https://www.pexels.com/photo/charming-french-town-with-historic-architecture-32604665/",
    description: "Quaint Ardennes town near Sedan with historic stone facades under cloudy skies.",
    place: CITY.charleville,
    takenAt: FR_DATE,
  },
  {
    tripFolder: "2019-07-france-sedan",
    id: 32604664,
    slug: "charleville-gothic-street",
    photographer: "Filiamariss",
    photographerUrl: "https://www.pexels.com/@filiamariss",
    pageUrl: "https://www.pexels.com/photo/charming-european-historic-street-scene-with-gothic-architecture-32604664/",
    description: "Northeastern French street scene with Gothic architecture in the Ardennes department.",
    place: CITY.charleville,
    takenAt: FR_DATE,
  },
  {
    tripFolder: "2019-07-france-sedan",
    id: 14249425,
    slug: "sedan-medieval-castle-proxy",
    photographer: "Michael Waddle",
    photographerUrl: "https://www.pexels.com/@michael-waddle-1019947",
    pageUrl: "https://www.pexels.com/photo/medieval-castle-in-france-14249425/",
    description: "Stone medieval fortress in France — period and style match Sedan's Château-Fort.",
    place: CITY.sedan,
    takenAt: FR_DATE,
  },
  {
    tripFolder: "2019-07-france-sedan",
    id: 5800890,
    slug: "ardennes-river-valley",
    photographer: "Nico Becker",
    photographerUrl: "https://www.pexels.com/@nicobecker",
    pageUrl: "https://www.pexels.com/photo/mountain-valley-with-green-forest-and-river-5800890/",
    description: "Ardennes-region river valley with forested slopes — Meuse landscape near Sedan.",
    place: CITY.sedan,
    takenAt: FR_DATE,
  },
  {
    tripFolder: "2019-07-france-sedan",
    id: 27130648,
    slug: "epernay-grand-est-architecture",
    photographer: "Ilipily",
    photographerUrl: "https://www.pexels.com/@ilipily",
    pageUrl: "https://www.pexels.com/photo/champagne-de-castellane-in-epernay-in-france-27130648/",
    description: "Grand-Est region architecture and riverfront under summer skies.",
    place: CITY.sedan,
    takenAt: FR_DATE,
  },
];

function targetPath(pick) {
  const file = `pexels-${pick.slug}-${pick.id}.jpg`;
  return {
    file,
    rel: `trips/${pick.tripFolder}/${file}`,
    abs: join(repoRoot, "public", "photos", "trips", pick.tripFolder, file),
  };
}

async function downloadImage(pick) {
  const url = `https://images.pexels.com/photos/${pick.id}/pexels-photo-${pick.id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) {
    throw new Error(`Suspiciously small response (${buf.length} bytes) for ${url}`);
  }
  return buf;
}

async function processOne(pick) {
  const { file, rel, abs } = targetPath(pick);
  mkdirSync(dirname(abs), { recursive: true });

  if (existsSync(abs)) {
    console.log(`  [skip exists] ${rel}`);
    return { pick, rel, abs, file, skipped: true };
  }

  const raw = await downloadImage(pick);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`  [ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs, file, bytes: out.length };
}

const results = [];
const failures = [];

for (const pick of PICKS) {
  try {
    const r = await processOne(pick);
    results.push(r);
  } catch (err) {
    console.error(`  [FAIL] ${pick.tripFolder}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(`\nDone. ${results.length} processed, ${failures.length} failures.`);

// ---------- Append to photo-catalogue.json ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  const place = r.pick.place;
  newEntries.push({
    src,
    takenAt: r.pick.takenAt,
    hasGps: true,
    cameraModel: "Pexels stock",
    gps: { lat: place.lat, lon: place.lon },
    place: { city: place.city, country: place.country, display: `${place.city}, ${place.country}` },
    stock: true,
    source: {
      type: "stock",
      provider: "Pexels",
      url: r.pick.pageUrl,
      photographer: r.pick.photographer,
      photographerUrl: r.pick.photographerUrl,
      license: PEXELS_LICENSE,
      licenseUrl: PEXELS_LICENSE_URL,
    },
  });
}

const merged = [...catalogue, ...newEntries];
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries (was ${catalogue.length}, now ${merged.length}).`);

// ---------- Persist results manifest ----------
const manifestPath = join(__dirname, "applied.json");
writeFileSync(
  manifestPath,
  JSON.stringify({ results, failures, newEntries }, null, 2),
  "utf8",
);
console.log(`Wrote ${manifestPath}.`);
