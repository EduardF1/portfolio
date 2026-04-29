// Batch 3 — backfill thin cities to >=5 photos:
// Belgrade, Kladovo (Serbia); Banská Bystrica, Malá Franková, Harmanec,
// Osturňa, Vysoké Tatry, Tatranská Javorina (Slovakia); Salobreña, Almuñécar
// (Spain); Săcele, Calimanesti (Romania).
// Plus 2 supplementary Bratislava landmark stocks (UFO Bridge, Slovak Radio
// Building) since those landmarks are not GPS-represented in the existing 9.
//
// Same schema and resize/encode pipeline as scripts/.per-city-min5/apply-pexels-wave5.mjs.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

const MID = {
  "2022-08-romania": "2022-08-07T12:00:00Z",
  "2023-08-romania": "2023-08-27T12:00:00Z",
  "2025-04-czechia-poland-slovakia-austria": "2025-04-15T12:00:00Z",
  "2025-09-andalusia-gibraltar": "2025-09-14T12:00:00Z",
  "2026-03-balkans-roadtrip": "2026-03-20T12:00:00Z",
};

const PLACES = {
  belgrade: {
    gps: { lat: 44.8125, lon: 20.4612 },
    place: { city: "Belgrade", country: "Serbia", display: "Belgrade, Serbia" },
  },
  kladovo: {
    gps: { lat: 44.6125, lon: 22.6166 },
    place: { city: "Kladovo", country: "Serbia", display: "Kladovo, Serbia" },
  },
  banskaBystrica: {
    gps: { lat: 48.7357, lon: 19.1511 },
    place: {
      city: "Banská Bystrica",
      country: "Slovakia",
      display: "Banská Bystrica, Slovakia",
    },
  },
  malaFrankova: {
    gps: { lat: 49.2855, lon: 20.3145 },
    place: {
      city: "Malá Franková",
      country: "Slovakia",
      display: "Malá Franková, Slovakia",
    },
  },
  harmanec: {
    gps: { lat: 48.7942, lon: 19.1, },
    place: { city: "Harmanec", country: "Slovakia", display: "Harmanec, Slovakia" },
  },
  osturna: {
    gps: { lat: 49.2912, lon: 20.2316 },
    place: { city: "Osturňa", country: "Slovakia", display: "Osturňa, Slovakia" },
  },
  vysokeTatry: {
    gps: { lat: 49.1664, lon: 20.1317 },
    place: {
      city: "Vysoké Tatry",
      country: "Slovakia",
      display: "Vysoké Tatry, Slovakia",
    },
  },
  tatranskaJavorina: {
    gps: { lat: 49.2796, lon: 20.178 },
    place: {
      city: "Tatranská Javorina",
      country: "Slovakia",
      display: "Tatranská Javorina, Slovakia",
    },
  },
  salobrena: {
    gps: { lat: 36.7437, lon: -3.5874 },
    place: { city: "Salobreña", country: "Spain", display: "Salobreña, Spain" },
  },
  almunecar: {
    gps: { lat: 36.7375, lon: -3.6906 },
    place: { city: "Almuñécar", country: "Spain", display: "Almuñécar, Spain" },
  },
  sacele: {
    gps: { lat: 45.6118, lon: 25.6973 },
    place: { city: "Săcele", country: "Romania", display: "Săcele, Romania" },
  },
  calimanesti: {
    gps: { lat: 45.2426, lon: 24.342 },
    place: { city: "Calimanesti", country: "Romania", display: "Calimanesti, Romania" },
  },
  bratislava: {
    gps: { lat: 48.1486, lon: 17.1077 },
    place: { city: "Bratislava", country: "Slovakia", display: "Bratislava, Slovakia" },
  },
};

const PICKS = [
  // ---- Belgrade (3 -> 6) ----
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 31476895,
    slug: "belgrade-kalemegdan-fortress-arch",
    photographer: "Sofiia Asmi",
    photographerUrl: "https://www.pexels.com/@sofiia-asmi-3378970/",
    pageUrl: "https://www.pexels.com/photo/winter-view-through-kalemegdan-fortress-arch-31476895/",
    placeKey: "belgrade",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 14487939,
    slug: "belgrade-saint-sava-temple-night",
    photographer: "Boris Hamer",
    photographerUrl: "https://www.pexels.com/@borishamer/",
    pageUrl: "https://www.pexels.com/photo/saint-sava-temple-in-belgrade-serbia-14487939/",
    placeKey: "belgrade",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 18419080,
    slug: "belgrade-old-town-skadarlija-pavement",
    photographer: "Neon Joi",
    photographerUrl: "https://www.pexels.com/@neon-joi-685205478/",
    pageUrl: "https://www.pexels.com/photo/people-on-pavement-in-old-town-of-belgrade-serbia-18419080/",
    placeKey: "belgrade",
  },

  // ---- Kladovo (1 -> 5) ----
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 30975080,
    slug: "kladovo-iron-gates-gorge-danube",
    photographer: "Radovan Brnelic",
    photographerUrl: "https://www.pexels.com/@brluti/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-iron-gates-gorge-and-danube-river-30975080/",
    placeKey: "kladovo",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 9220649,
    slug: "kladovo-iron-gates-danube-cliffs",
    photographer: "Gip07",
    photographerUrl: "https://www.pexels.com/@gip07/",
    pageUrl: "https://www.pexels.com/photo/9220649/",
    placeKey: "kladovo",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 30926014,
    slug: "kladovo-golubac-fortress-aerial",
    photographer: "Nikola Kojević",
    photographerUrl: "https://www.pexels.com/@nikola-kojevic-1608684723/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-golubac-fortress-on-danube-river-30926014/",
    placeKey: "kladovo",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 13680514,
    slug: "kladovo-decebalus-rock-iron-gates",
    photographer: "Andrei Danut",
    photographerUrl: "https://www.pexels.com/@andrei-danut/",
    pageUrl: "https://www.pexels.com/photo/13680514/",
    placeKey: "kladovo",
  },

  // ---- Banská Bystrica (4 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 33798106,
    slug: "banska-bystrica-grassy-field",
    photographer: "Enis Uzeiri",
    photographerUrl: "https://www.pexels.com/@enis-uzeiri-2155503894/",
    pageUrl: "https://www.pexels.com/photo/ginger-cat-lying-in-the-grassy-field-of-banska-bystrica-relaxing-outdoors-33798106/",
    placeKey: "banskaBystrica",
  },

  // ---- Malá Franková (4 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 15267850,
    slug: "mala-frankova-podbiel-wooden-cottages",
    photographer: "Valentin Onu",
    photographerUrl: "https://www.pexels.com/@vali741/",
    pageUrl: "https://www.pexels.com/photo/charming-wooden-cottages-in-podbiel-slovakia-showcasing-traditional-architecture-15267850/",
    placeKey: "malaFrankova",
  },

  // ---- Harmanec (2 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 32275767,
    slug: "harmanec-vysoke-tatry-aerial",
    photographer: "Michal Vaško",
    photographerUrl: "https://www.pexels.com/@wacho/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-vysoke-tatry-mountains-in-slovakia-32275767/",
    placeKey: "harmanec",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 28966350,
    slug: "harmanec-tatra-mountain-trail",
    photographer: "Viliam Kudelka",
    photographerUrl: "https://www.pexels.com/@viliamphotography/",
    pageUrl: "https://www.pexels.com/photo/scenic-mountain-trail-in-the-high-tatras-28966350/",
    placeKey: "harmanec",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 5877697,
    slug: "harmanec-cicmany-foggy-village",
    photographer: "Robo Michalec",
    photographerUrl: "https://www.pexels.com/@robo-michalec-728554/",
    pageUrl: "https://www.pexels.com/photo/foggy-countryside-village-in-cicmany-slovakia-with-traditional-rural-landscape-5877697/",
    placeKey: "harmanec",
  },

  // ---- Osturňa (1 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 15267870,
    slug: "osturna-podbiel-historic-wooden",
    photographer: "Valentin Onu",
    photographerUrl: "https://www.pexels.com/@vali741/",
    pageUrl: "https://www.pexels.com/photo/historic-wooden-houses-of-podbiel-slovakia-showcasing-unique-architectural-design-15267870/",
    placeKey: "osturna",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 11019952,
    slug: "osturna-ruzomberok-rustic-wooden",
    photographer: "Walkers",
    photographerUrl: "https://www.pexels.com/@walkers-113027/",
    pageUrl: "https://www.pexels.com/photo/charming-rustic-wooden-houses-nestled-in-the-scenic-mountains-of-ruzomberok-slovakia-11019952/",
    placeKey: "osturna",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 28121309,
    slug: "osturna-velky-lipnik-aerial-village",
    photographer: "Karolina",
    photographerUrl: "https://www.pexels.com/@karolina-2031292/",
    pageUrl: "https://www.pexels.com/photo/scenic-aerial-view-of-velky-lipnik-village-surrounded-by-rolling-hills-28121309/",
    placeKey: "osturna",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 28121371,
    slug: "osturna-velky-lipnik-hills-village",
    photographer: "Karolina",
    photographerUrl: "https://www.pexels.com/@karolina-2031292/",
    pageUrl: "https://www.pexels.com/photo/scenic-aerial-view-of-velky-lipnik-village-surrounded-by-lush-hills-and-mountains-28121371/",
    placeKey: "osturna",
  },

  // ---- Vysoké Tatry (1 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 30829433,
    slug: "vysoke-tatry-mountain-valley-summer",
    photographer: "György Lakatos",
    photographerUrl: "https://www.pexels.com/@gyorgy-lakatos-113005281/",
    pageUrl: "https://www.pexels.com/photo/stunning-high-tatras-mountain-valley-view-30829433/",
    placeKey: "vysokeTatry",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 31007188,
    slug: "vysoke-tatry-lomnicky-stit-deck",
    photographer: "Vladyslav Dukhin",
    photographerUrl: "https://www.pexels.com/@vladyslav-dukhin/",
    pageUrl: "https://www.pexels.com/photo/majestic-view-from-lomnicky-stit-observation-deck-31007188/",
    placeKey: "vysokeTatry",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 30829431,
    slug: "vysoke-tatry-mountains-with-lakes",
    photographer: "György Lakatos",
    photographerUrl: "https://www.pexels.com/@gyorgy-lakatos-113005281/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-tatra-mountains-with-lakes-30829431/",
    placeKey: "vysokeTatry",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 35012695,
    slug: "vysoke-tatry-snow-capped-peaks",
    photographer: "Michal Petráš",
    photographerUrl: "https://www.pexels.com/@michal-petras-2152077115/",
    pageUrl: "https://www.pexels.com/photo/majestic-snow-capped-peaks-of-high-tatras-slovakia-35012695/",
    placeKey: "vysokeTatry",
  },

  // ---- Tatranská Javorina (1 -> 5) ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 37100593,
    slug: "tatranska-javorina-tatra-autumn",
    photographer: "Dawid Zawiła",
    photographerUrl: "https://www.pexels.com/@dawid-zawila-2151273316/",
    pageUrl: "https://www.pexels.com/photo/stunning-autumn-view-of-tatra-mountains-37100593/",
    placeKey: "tatranskaJavorina",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 36781462,
    slug: "tatranska-javorina-tatra-rocky-peaks",
    photographer: "Anastasia Saiko",
    photographerUrl: "https://www.pexels.com/@likhtarik/",
    pageUrl: "https://www.pexels.com/photo/scenic-mountain-view-in-the-tatra-mountains-poland-36781462/",
    placeKey: "tatranskaJavorina",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 33239879,
    slug: "tatranska-javorina-tatra-valley-view",
    photographer: "Paweł Kosmala",
    photographerUrl: "https://www.pexels.com/@pawel-kosmala-18647583/",
    pageUrl: "https://www.pexels.com/photo/breathtaking-view-of-tatra-mountains-and-valley-33239879/",
    placeKey: "tatranskaJavorina",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 31060827,
    slug: "tatranska-javorina-rocky-mountain-ridge",
    photographer: "Viliam Kudelka",
    photographerUrl: "https://www.pexels.com/@viliamphotography/",
    pageUrl: "https://www.pexels.com/photo/stunning-rocky-mountain-ridge-landscape-view-31060827/",
    placeKey: "tatranskaJavorina",
  },

  // ---- Salobreña (1 -> 5) ----
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 33844731,
    slug: "salobrena-spanish-village-coastline",
    photographer: "Ray Raimundo",
    photographerUrl: "https://www.pexels.com/@rayraimundo/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-spanish-village-and-coastline-33844731/",
    placeKey: "salobrena",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 33844732,
    slug: "salobrena-hilltop-village-mediterranean",
    photographer: "Ray Raimundo",
    photographerUrl: "https://www.pexels.com/@rayraimundo/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-coastal-hilltop-village-in-spain-33844732/",
    placeKey: "salobrena",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 18515569,
    slug: "salobrena-granada-coast-dusk",
    photographer: "Manuel Muñoz",
    photographerUrl: "https://www.pexels.com/@manuel-munoz-540217738/",
    pageUrl: "https://www.pexels.com/photo/coastal-city-at-dusk-18515569/",
    placeKey: "salobrena",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 14508595,
    slug: "salobrena-aerial-coastline-city",
    photographer: "Ray Raimundo",
    photographerUrl: "https://www.pexels.com/@rayraimundo/",
    pageUrl: "https://www.pexels.com/photo/aerial-shot-of-city-on-coastline-14508595/",
    placeKey: "salobrena",
  },

  // ---- Almuñécar (1 -> 5) ----
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 25300342,
    slug: "almunecar-cotobro-beach-hillside",
    photographer: "Bloople Web",
    photographerUrl: "https://www.pexels.com/@bloople/",
    pageUrl: "https://www.pexels.com/photo/calm-coastal-scene-of-cotobro-beach-in-almunecar-spain-with-hills-and-buildings-25300342/",
    placeKey: "almunecar",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 33258894,
    slug: "almunecar-beach-colorful-boats",
    photographer: "Darris Brooks",
    photographerUrl: "https://www.pexels.com/@darris-brooks-2154340184/",
    pageUrl: "https://www.pexels.com/photo/colorful-boats-resting-on-almunecar-beach-with-waves-33258894/",
    placeKey: "almunecar",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 17740863,
    slug: "almunecar-nerja-coastal-mountains",
    photographer: "Flow TV",
    photographerUrl: "https://www.pexels.com/@flowtv/",
    pageUrl: "https://www.pexels.com/photo/picturesque-coastal-town-of-nerja-with-stunning-mountains-and-clear-blue-sea-17740863/",
    placeKey: "almunecar",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 34499934,
    slug: "almunecar-nerja-hillside-houses-sunset",
    photographer: "Oliver Schröder",
    photographerUrl: "https://www.pexels.com/@olivers/",
    pageUrl: "https://www.pexels.com/photo/charming-hillside-houses-in-nerja-spain-with-a-mountain-backdrop-during-sunset-34499934/",
    placeKey: "almunecar",
  },

  // ---- Săcele (2 -> 5) ----
  // Săcele is a Brașov suburb (Bunloc, Tâmpa adjoining); use Brașov stock.
  {
    tripFolder: "2022-08-romania", id: 30271191,
    slug: "sacele-brasov-tampa-mountain-street",
    photographer: "Carsten Jørgensen",
    photographerUrl: "https://www.pexels.com/@carsten-jorgensen-2147830195/",
    pageUrl: "https://www.pexels.com/photo/charming-street-view-of-brasov-with-tampa-mountain-30271191/",
    placeKey: "sacele",
  },
  {
    tripFolder: "2022-08-romania", id: 11534893,
    slug: "sacele-brasov-weaver-bastion-winter",
    photographer: "Παναγιώτης Αρκουμάνης",
    photographerUrl: "https://www.pexels.com/@179554791/",
    pageUrl: "https://www.pexels.com/photo/snowy-winter-scene-at-weaver-bastion-in-brasov-with-benches-and-fortress-walls-11534893/",
    placeKey: "sacele",
  },
  {
    tripFolder: "2023-08-romania", id: 34069343,
    slug: "sacele-brasov-square-clock-tower-aerial",
    photographer: "Râmbeț Ioana",
    photographerUrl: "https://www.pexels.com/@rambe-ioana-211953981/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-historic-brasov-square-and-clock-tower-34069343/",
    placeKey: "sacele",
  },

  // ---- Calimanesti (2 -> 5) ----
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 17953083,
    slug: "calimanesti-sambata-de-sus-monastery",
    photographer: "Sirbu 126",
    photographerUrl: "https://www.pexels.com/@sirbu-126-579574530/",
    pageUrl: "https://www.pexels.com/photo/sambata-de-sus-monastery-in-romania-17953083/",
    placeKey: "calimanesti",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 10882222,
    slug: "calimanesti-romanian-church-flowers",
    photographer: "Eliza Aldea",
    photographerUrl: "https://www.pexels.com/@eliza-aldea-164966937/",
    pageUrl: "https://www.pexels.com/photo/charming-romanian-church-with-blooming-flowers-10882222/",
    placeKey: "calimanesti",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 34457978,
    slug: "calimanesti-bucegi-mountains-autumn",
    photographer: "Catalin M",
    photographerUrl: "https://www.pexels.com/@catalin-m-1839309/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-bucegi-mountains-in-autumn-34457978/",
    placeKey: "calimanesti",
  },

  // ---- Bratislava landmarks (9 -> 11): UFO Bridge + Slovak Radio Building ----
  // Existing 9 photos cluster at Castle (~48.142,17.099) + Old Town. UFO Bridge
  // (~48.138,17.105 across Danube) and Slovak Radio Building inverted pyramid
  // (~48.151,17.119) are not visually represented; add them as supplementary.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 31715853,
    slug: "bratislava-ufo-bridge-cityscape-sunset",
    photographer: "Marek Bajbar",
    photographerUrl: "https://www.pexels.com/@marek-bajbar-2151401168/",
    pageUrl: "https://www.pexels.com/photo/ufo-bridge-and-cityscape-at-sunset-in-bratislava-31715853/",
    placeKey: "bratislava",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 9404482,
    slug: "bratislava-slovak-radio-building-inverted-pyramid",
    photographer: "Leopold Biget",
    photographerUrl: "https://www.pexels.com/@leopold-biget-19679119/",
    pageUrl: "https://www.pexels.com/photo/low-angle-view-of-the-iconic-slovak-radio-building-in-bratislava-slovakia-under-a-clear-sky-9404482/",
    placeKey: "bratislava",
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
  const url = `https://images.pexels.com/photos/${pick.id}/pexels-photo-${pick.id}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
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
    const sz = statSync(abs).size;
    return { pick, rel, abs, file, bytes: sz, skipped: true };
  }

  const raw = await downloadImage(pick);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`  [ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs, file, bytes: out.length };
}

const results = [];
for (const pick of PICKS) {
  try {
    results.push(await processOne(pick));
  } catch (err) {
    console.error(`  [FAIL] ${pick.slug} (#${pick.id}): ${err.message}`);
    results.push({ pick, error: err.message });
  }
}

const failures = results.filter((r) => r.error);
if (failures.length) {
  console.error(`\n${failures.length} downloads failed; aborting catalogue update.`);
  process.exit(1);
}

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  if (existingSrc.has(r.rel)) continue;
  const placeData = PLACES[r.pick.placeKey];
  const takenAt = MID[r.pick.tripFolder];
  newEntries.push({
    src: r.rel,
    takenAt,
    hasGps: true,
    cameraModel: "Pexels stock",
    gps: placeData.gps,
    place: placeData.place,
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
merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`\nAppended ${newEntries.length} catalogue entries.`);

// Update docs/photo-attributions.md
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");
const lines = attribRaw.split("\n");
const licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
for (const r of results) {
  if (r.error) continue;
  newRows.push(
    `| \`public/photos/${r.rel}\` | ${PLACES[r.pick.placeKey].place.display} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
  );
}

let totalIdx = lines.length - 1;
while (totalIdx >= 0 && !lines[totalIdx].startsWith("Total stock photos:")) totalIdx--;

const newTotal = catalogue.filter((e) => e.source?.type === "stock").length + newEntries.length;
const updatedLines = [
  ...lines.slice(0, lastRowIdx + 1),
  ...newRows,
  ...lines.slice(lastRowIdx + 1, totalIdx === -1 ? lines.length : totalIdx),
];
if (totalIdx !== -1) {
  updatedLines.push(`Total stock photos: ${newTotal}`);
  updatedLines.push("");
}

writeFileSync(attribPath, updatedLines.join("\n"), "utf8");
console.log(`Appended ${newRows.length} attribution rows. New total: ${newTotal}.`);

writeFileSync(
  join(__dirname, "apply-pexels-results.json"),
  JSON.stringify(results, null, 2) + "\n",
  "utf8",
);
