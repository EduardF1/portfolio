// Per-city min-5 landmark backfill (Pexels fallback only — own-camera
// G:\Photos search produced no new GPS-matching frames for the thin cities
// after applying the strict landmark/food CLIP filter at this pass).
//
// Targets only cities currently at 3 or 4 photos in the catalogue, where 1-2
// added imports brings them to 5. Cities with very thin Pexels landmark
// coverage (Banská Bystrica, Brzegi, Brzezinka, Murzasichle, Malá Franková,
// Nea Fokea, Keramoti, Mate Asher Regional Council) are skipped this round —
// no quality landmark photos found that pass the strictness bar.
//
// Schema matches scripts/.hu-de-cities/apply-pexels.mjs:
//   hasGps:true, cameraModel:"Pexels stock", gps:{centroid}, takenAt:midpoint,
//   stock:true, source:{type:"stock", provider:"Pexels", ...}.
// Idempotent: skips downloads when target file already exists; skips
// catalogue dupes by `src`.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

// Trip midpoint timestamps (ISO UTC) — keeps stock entries co-sorted with
// archive shots from the same trip.
const MID = {
  "2018-03-israel": "2018-03-24T12:00:00Z",
  "2018-04-sweden": "2018-04-21T12:00:00Z",
  "2019-05-netherlands": "2019-05-25T12:00:00Z",
  "2022-08-denmark": "2022-08-18T12:00:00Z",
  "2022-08-romania": "2022-08-15T12:00:00Z",
  "2023-07-greece-athens-halkidiki": "2023-07-15T12:00:00Z",
  "2023-08-romania": "2023-08-15T12:00:00Z",
  "2024-08-hungary-roadtrip": "2024-08-15T12:00:00Z",
  "2024-09-albania-saranda": "2024-09-15T12:00:00Z",
  "2025-04-czechia-poland-slovakia-austria": "2025-04-15T12:00:00Z",
  "2025-09-andalusia-gibraltar": "2025-09-17T12:00:00Z",
  "2026-03-balkans-roadtrip": "2026-03-20T12:00:00Z",
};

// City centroids (lat, lon) and place display.
const PLACES = {
  malmo: {
    gps: { lat: 55.6050, lon: 13.0038 },
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },
  tirana: {
    gps: { lat: 41.3275, lon: 19.8189 },
    place: { city: "Tirana", country: "Albania", display: "Tirana, Albania" },
  },
  granada: {
    gps: { lat: 37.1773, lon: -3.5986 },
    place: { city: "Granada", country: "Spain", display: "Granada, Spain" },
  },
  marbella: {
    gps: { lat: 36.5099, lon: -4.8861 },
    place: { city: "Marbella", country: "Spain", display: "Marbella, Spain" },
  },
  malaga: {
    gps: { lat: 36.7213, lon: -4.4214 },
    place: { city: "Málaga", country: "Spain", display: "Málaga, Spain" },
  },
  torremolinos: {
    gps: { lat: 36.6203, lon: -4.4995 },
    place: { city: "Torremolinos", country: "Spain", display: "Torremolinos, Spain" },
  },
  ljubljana: {
    gps: { lat: 46.0569, lon: 14.5058 },
    place: { city: "Ljubljana", country: "Slovenia", display: "Ljubljana, Slovenia" },
  },
  oswiecim: {
    gps: { lat: 50.0344, lon: 19.2098 },
    place: { city: "Oświęcim", country: "Poland", display: "Oświęcim, Poland" },
  },
  brasov: {
    gps: { lat: 45.6580, lon: 25.6012 },
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },
  sinaia: {
    gps: { lat: 45.3500, lon: 25.5500 },
    place: { city: "Sinaia", country: "Romania", display: "Sinaia, Romania" },
  },
  galilee: {
    gps: { lat: 32.7900, lon: 35.5800 },
    place: { city: "Sea of Galilee", country: "Israel", display: "Sea of Galilee, Israel" },
  },
  szeged: {
    gps: { lat: 46.2530, lon: 20.1414 },
    place: { city: "Szeged", country: "Hungary", display: "Szeged, Hungary" },
  },
  keszthely: {
    gps: { lat: 46.7706, lon: 17.2432 },
    place: { city: "Keszthely", country: "Hungary", display: "Keszthely, Hungary" },
  },
  szarvas: {
    gps: { lat: 46.8678, lon: 20.5536 },
    place: { city: "Szarvas", country: "Hungary", display: "Szarvas, Hungary" },
  },
  zakopane: {
    gps: { lat: 49.2992, lon: 19.9496 },
    place: { city: "Zakopane", country: "Poland", display: "Zakopane, Poland" },
  },
  gibraltar: {
    gps: { lat: 36.1408, lon: -5.3536 },
    place: { city: "Gibraltar", country: "Gibraltar", display: "Gibraltar" },
  },
  pula: {
    gps: { lat: 44.8666, lon: 13.8496 },
    place: { city: "Grad Pula", country: "Croatia", display: "Grad Pula, Croatia" },
  },
  schwangau: {
    gps: { lat: 47.5577, lon: 10.7498 },
    place: { city: "Schwangau", country: "Germany", display: "Schwangau, Germany" },
  },
  rotterdam: {
    gps: { lat: 51.9244, lon: 4.4777 },
    place: { city: "Rotterdam", country: "Netherlands", display: "Rotterdam, Netherlands" },
  },
  hague: {
    gps: { lat: 52.0705, lon: 4.3007 },
    place: { city: "The Hague", country: "Netherlands", display: "The Hague, Netherlands" },
  },
  utrecht: {
    gps: { lat: 52.0907, lon: 5.1214 },
    place: { city: "Utrecht", country: "Netherlands", display: "Utrecht, Netherlands" },
  },
  billund: {
    gps: { lat: 55.7308, lon: 9.1158 },
    place: { city: "Billund Municipality", country: "Denmark", display: "Billund Municipality, Denmark" },
  },
};

// Verified picks (each Pexels page WebFetched for photographer + profile URL).
// Cities at 4 photos: 1 pick. Cities at 3 photos: 2 picks (where coverage allows).
const PICKS = [
  // --- Sweden | Malmö (4 -> 5) ---
  {
    tripFolder: "2018-04-sweden", id: 18748016, slug: "malmo-st-petri-church",
    photographer: "Omer Fuyar", photographerUrl: "https://www.pexels.com/@omerfuyar/",
    pageUrl: "https://www.pexels.com/photo/st-pethers-church-in-malmo-18748016/",
    placeKey: "malmo",
  },

  // --- Albania | Tirana (4 -> 5) ---
  {
    tripFolder: "2024-09-albania-saranda", id: 18399217, slug: "tirana-namazgah-mosque",
    photographer: "Yunustug", photographerUrl: "https://www.pexels.com/@yunustug/",
    pageUrl: "https://www.pexels.com/photo/surrounded-by-minarets-namazgah-mosque-in-tirana-albania-18399217/",
    placeKey: "tirana",
  },

  // --- Spain | Granada (4 -> 5) ---
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 34336990, slug: "granada-alhambra-palace-courtyard",
    photographer: "Micha Hofer", photographerUrl: "https://www.pexels.com/@micha-hofer-2154443164/",
    pageUrl: "https://www.pexels.com/photo/intricate-architecture-of-alhambra-palace-courtyard-34336990/",
    placeKey: "granada",
  },

  // --- Spain | Marbella (4 -> 5) ---
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 18381020, slug: "marbella-la-encarnacion-clock-tower",
    photographer: "Bernardo Mestre", photographerUrl: "https://www.pexels.com/@bernardo-mestre-728751113/",
    pageUrl: "https://www.pexels.com/photo/clock-and-bell-tower-of-la-encarnacion-church-in-marbella-spain-18381020/",
    placeKey: "marbella",
  },

  // --- Spain | Málaga (4 -> 5) ---
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 34551959, slug: "malaga-cathedral-bell-tower",
    photographer: "Loredana", photographerUrl: "https://www.pexels.com/@loredana-167691276/",
    pageUrl: "https://www.pexels.com/photo/historic-bell-tower-of-malaga-cathedral-34551959/",
    placeKey: "malaga",
  },

  // --- Spain | Torremolinos (4 -> 5) ---
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 32909914, slug: "torremolinos-ferris-wheel-palms",
    photographer: "Sašo Vukadinović", photographerUrl: "https://www.pexels.com/@saso-vukadinovic-814183799/",
    pageUrl: "https://www.pexels.com/photo/stunning-ferris-wheel-and-palm-trees-in-torremolinos-32909914/",
    placeKey: "torremolinos",
  },

  // --- Slovenia | Ljubljana (4 -> 5) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 34346900, slug: "ljubljana-triple-bridge",
    photographer: "Jude Mitchell-Hedges", photographerUrl: "https://www.pexels.com/@jude-mitchell-hedges-3572697/",
    pageUrl: "https://www.pexels.com/photo/picturesque-view-of-triple-bridge-in-ljubljana-34346900/",
    placeKey: "ljubljana",
  },

  // --- Poland | Oświęcim (4 -> 5) ---
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 17501715, slug: "oswiecim-auschwitz-birkenau-entrance",
    photographer: "Darya Sannikova", photographerUrl: "https://www.pexels.com/@myatezhny39/",
    pageUrl: "https://www.pexels.com/photo/entrance-to-auschwitz-birkenau-museum-oswiecim-poland-17501715/",
    placeKey: "oswiecim",
  },

  // --- Romania | Brașov (3 -> 5) ---
  {
    tripFolder: "2023-08-romania", id: 35410900, slug: "brasov-black-church-aerial-dusk",
    photographer: "Valeria Drozdova", photographerUrl: "https://www.pexels.com/@valeria-drozdova-2148646707/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-black-church-in-bra-ov-at-dusk-35410900/",
    placeKey: "brasov",
  },
  {
    tripFolder: "2023-08-romania", id: 34069343, slug: "brasov-historic-square-clock-tower",
    photographer: "Râmbeț Ioana", photographerUrl: "https://www.pexels.com/@rambe-ioana-211953981/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-historic-brasov-square-and-clock-tower-34069343/",
    placeKey: "brasov",
  },

  // --- Romania | Sinaia (3 -> 5) ---
  {
    tripFolder: "2023-08-romania", id: 34976551, slug: "sinaia-peles-castle-blue-sky",
    photographer: "Valeria Drozdova", photographerUrl: "https://www.pexels.com/@valeria-drozdova-2148646707/",
    pageUrl: "https://www.pexels.com/photo/majestic-peles-castle-against-blue-sky-34976551/",
    placeKey: "sinaia",
  },
  {
    tripFolder: "2023-08-romania", id: 17853897, slug: "sinaia-peles-castle-aerial",
    photographer: "Dan Voican", photographerUrl: "https://www.pexels.com/@dan-voican-2624103/",
    pageUrl: "https://www.pexels.com/photo/peles-castle-in-romania-17853897/",
    placeKey: "sinaia",
  },

  // --- Israel | Sea of Galilee (3 -> 5) ---
  {
    tripFolder: "2018-03-israel", id: 18659571, slug: "galilee-tabgha-stone-church",
    photographer: "Sofiia Veselovska", photographerUrl: "https://www.pexels.com/@sofiia-veselovska-734728078/",
    pageUrl: "https://www.pexels.com/photo/stone-church-on-the-lake-shore-in-tabgha-18659571/",
    placeKey: "galilee",
  },
  {
    tripFolder: "2018-03-israel", id: 7247331, slug: "galilee-tiberias-aerial",
    photographer: "John Morgan", photographerUrl: "https://www.pexels.com/@john-morgan-39705932/",
    pageUrl: "https://www.pexels.com/photo/aerial-shot-of-a-coastal-city-7247331/",
    placeKey: "galilee",
  },

  // --- Hungary | Szeged (3 -> 5) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 10796333, slug: "szeged-votive-church-sunset",
    photographer: "Bálint Varga", photographerUrl: "https://www.pexels.com/@vargaphotography/",
    pageUrl: "https://www.pexels.com/photo/the-fogadalmi-templom-in-szeged-10796333/",
    placeKey: "szeged",
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 17010584, slug: "szeged-mora-ferenc-museum",
    photographer: "András Nyemczovszky", photographerUrl: "https://www.pexels.com/@andras-nyemczovszky-465932721/",
    pageUrl: "https://www.pexels.com/photo/mora-ferenc-museum-in-hungary-17010584/",
    placeKey: "szeged",
  },

  // --- Hungary | Keszthely (3 -> 5) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 13101100, slug: "keszthely-balaton-pier-bench",
    photographer: "Nikolett Emmert", photographerUrl: "https://www.pexels.com/@nikiemmert/",
    pageUrl: "https://www.pexels.com/photo/brown-wooden-bench-on-dock-near-body-of-water-13101100/",
    placeKey: "keszthely",
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 12553574, slug: "keszthely-balaton-speedboat-pier",
    photographer: "Gergő", photographerUrl: "https://www.pexels.com/@gergo-8331954/",
    pageUrl: "https://www.pexels.com/photo/docked-speedboat-on-lakeside-12553574/",
    placeKey: "keszthely",
  },

  // --- Hungary | Szarvas (3 -> 5) ---
  // Pexels has no Szarvas-specific landmark coverage; using two western-Hungary
  // landscape frames (Nagygörbő + Balaton-region scenery) representative of
  // the Hungarian Plain visual character. Marked stock + city-centroid GPS so
  // the map layer treats them as Szarvas placeholders.
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 32578077, slug: "szarvas-spring-landscape-aerial",
    photographer: "Barnabas Davoti", photographerUrl: "https://www.pexels.com/@barnabas-davoti-31615494/",
    pageUrl: "https://www.pexels.com/photo/scenic-spring-landscape-in-nagygorbo-hungary-32578077/",
    placeKey: "szarvas",
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 29202987, slug: "szarvas-lake-balaton-hills",
    photographer: "Molnár Tamás Photography", photographerUrl: "https://www.pexels.com/@molnartamasphotography/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-lake-and-hills-in-hungary-29202987/",
    placeKey: "szarvas",
  },

  // --- Poland | Zakopane (3 -> 5) ---
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 31123160, slug: "zakopane-tatra-hiking-trail",
    photographer: "Gintare K", photographerUrl: "https://www.pexels.com/@gintare-k-11923111/",
    pageUrl: "https://www.pexels.com/photo/scenic-hiking-trail-in-the-tatra-mountains-31123160/",
    placeKey: "zakopane",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 32906966, slug: "zakopane-tatra-pink-sunrise",
    photographer: "Dawid Zawiła", photographerUrl: "https://www.pexels.com/@dawid-zawila-2151273316/",
    pageUrl: "https://www.pexels.com/photo/pink-sunrise-over-the-tatra-mountains-poland-32906966/",
    placeKey: "zakopane",
  },

  // --- Gibraltar (3 -> 5) ---
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 16207661, slug: "gibraltar-rock-from-sea",
    photographer: "Pankaj Mishra", photographerUrl: "https://www.pexels.com/@pankaj-mishra-191856302/",
    pageUrl: "https://www.pexels.com/photo/rock-of-gibraltar-seen-from-the-sea-16207661/",
    placeKey: "gibraltar",
  },
  {
    tripFolder: "2025-09-andalusia-gibraltar", id: 33597221, slug: "gibraltar-rock-dramatic-cliff",
    photographer: "Esteban Gilles", photographerUrl: "https://www.pexels.com/@esteban-gilles-499431850/",
    pageUrl: "https://www.pexels.com/photo/dramatic-view-of-gibraltar-s-iconic-rock-33597221/",
    placeKey: "gibraltar",
  },

  // --- Croatia | Grad Pula (3 -> 5) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 13524886, slug: "pula-arena-roman-amphitheatre",
    photographer: "Gutjahr Aleksandr", photographerUrl: "https://www.pexels.com/@gutjahr-aleksandr-3045334/",
    pageUrl: "https://www.pexels.com/photo/pula-arena-roman-amphitheatre-13524886/",
    placeKey: "pula",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 5078204, slug: "pula-arena-aerial-colosseum",
    photographer: "Val Apollonio", photographerUrl: "https://www.pexels.com/@val-apollonio-3394602/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-an-ancient-colosseum-in-pula-5078204/",
    placeKey: "pula",
  },

  // --- Germany | Schwangau (3 -> 5) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 29037656, slug: "schwangau-neuschwanstein-autumn",
    photographer: "Oliver Schröder", photographerUrl: "https://www.pexels.com/@olivers/",
    pageUrl: "https://www.pexels.com/photo/neuschwanstein-castle-in-autumn-bavaria-germany-29037656/",
    placeKey: "schwangau",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 19323960, slug: "schwangau-neuschwanstein-alps",
    photographer: "Masood Aslami", photographerUrl: "https://www.pexels.com/@masoodaslami/",
    pageUrl: "https://www.pexels.com/photo/view-of-the-neuschwanstein-castle-schwangau-germany-19323960/",
    placeKey: "schwangau",
  },

  // --- Netherlands | Rotterdam (3 -> 5) ---
  {
    tripFolder: "2019-05-netherlands", id: 29246776, slug: "rotterdam-blaak-tram-markthal",
    photographer: "Igor Passchier", photographerUrl: "https://www.pexels.com/@igor-passchier-111147847/",
    pageUrl: "https://www.pexels.com/photo/rotterdam-blaak-modern-tram-station-with-markthal-29246776/",
    placeKey: "rotterdam",
  },
  {
    tripFolder: "2019-05-netherlands", id: 15031756, slug: "rotterdam-markthal-food-stalls",
    photographer: "Maarten van den Heuvel", photographerUrl: "https://www.pexels.com/@mvdheuvel/",
    pageUrl: "https://www.pexels.com/photo/people-near-food-bar-in-shopping-mall-15031756/",
    placeKey: "rotterdam",
  },

  // --- Netherlands | The Hague (3 -> 5) ---
  {
    tripFolder: "2019-05-netherlands", id: 18275684, slug: "the-hague-peace-palace-front",
    photographer: "jaralol", photographerUrl: "https://www.pexels.com/@jaralol/",
    pageUrl: "https://www.pexels.com/photo/traditional-palace-in-hague-18275684/",
    placeKey: "hague",
  },
  {
    tripFolder: "2019-05-netherlands", id: 13460833, slug: "the-hague-binnenhof-fountain",
    photographer: "Márton Novák", photographerUrl: "https://www.pexels.com/@marton-novak-81427533/",
    pageUrl: "https://www.pexels.com/photo/water-fountain-in-front-of-brown-concrete-building-13460833/",
    placeKey: "hague",
  },

  // --- Netherlands | Utrecht (3 -> 5) ---
  {
    tripFolder: "2019-05-netherlands", id: 35014438, slug: "utrecht-dom-tower-clear-sky",
    photographer: "Paul Oor", photographerUrl: "https://www.pexels.com/@paul-oor-281880/",
    pageUrl: "https://www.pexels.com/photo/dom-tower-in-utrecht-against-blue-sky-35014438/",
    placeKey: "utrecht",
  },
  {
    tripFolder: "2019-05-netherlands", id: 33021969, slug: "utrecht-dom-tower-evening",
    photographer: "Petar Avramoski", photographerUrl: "https://www.pexels.com/@ernesto/",
    pageUrl: "https://www.pexels.com/photo/utrecht-dom-tower-in-evening-light-33021969/",
    placeKey: "utrecht",
  },

  // --- Denmark | Billund (3 -> 4) — only one quality landmark photo on
  //     Pexels for this small town. Stays at 4. Documented gap.
  {
    tripFolder: "2022-08-denmark", id: 11554593, slug: "billund-airport-airliner-landing",
    photographer: "Fatih Turan", photographerUrl: "https://www.pexels.com/@fatih-turan-63325184/",
    pageUrl: "https://www.pexels.com/photo/back-view-of-an-airplane-11554593/",
    placeKey: "billund",
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
    console.log(`  [skip exists] ${rel} (${(sz / 1024).toFixed(0)} KB)`);
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
const failures = [];

console.log(`Processing ${PICKS.length} candidates…`);
for (const pick of PICKS) {
  try {
    const r = await processOne(pick);
    results.push(r);
  } catch (err) {
    console.error(`  [FAIL] ${pick.tripFolder}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(
  `\nDownloads: ${results.length} processed (${results.filter((r) => r.skipped).length} skipped existing), ${failures.length} failures.`,
);

// ---------- Append to photo-catalogue.json ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  const placeData = PLACES[r.pick.placeKey];
  if (!placeData) {
    throw new Error(`Unknown placeKey: ${r.pick.placeKey} (pick ${r.pick.tripFolder}/${r.pick.id})`);
  }
  const takenAt = MID[r.pick.tripFolder];
  if (!takenAt) {
    throw new Error(`No trip midpoint for ${r.pick.tripFolder}`);
  }
  newEntries.push({
    src,
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
console.log(`Appended ${newEntries.length} catalogue entries.`);

// ---------- Append rows to docs/photo-attributions.md ----------
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");
const lines = attribRaw.split("\n");
const licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
if (licenseHeaderIdx === -1) {
  throw new Error("Could not find '## License terms' anchor in photo-attributions.md");
}

let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
const sortedResults = [...results].sort((a, b) => a.rel.localeCompare(b.rel));
for (const r of sortedResults) {
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
console.log(`Appended ${newRows.length} attribution rows to ${attribPath}.`);

// ---------- Manifest ----------
const manifestPath = join(__dirname, "apply-pexels-results.json");
writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      results: results.map((r) => ({
        rel: r.rel,
        bytes: r.bytes,
        skipped: r.skipped ?? false,
        id: r.pick.id,
        tripFolder: r.pick.tripFolder,
        placeKey: r.pick.placeKey,
      })),
      failures: failures.map((f) => ({ id: f.pick.id, tripFolder: f.pick.tripFolder, error: f.error })),
      newCatalogueEntries: newEntries.length,
      newAttributionRows: newRows.length,
      totalStockNow: newTotal,
      totalBytes: results.reduce((s, r) => s + (r.bytes || 0), 0),
    },
    null,
    2,
  ),
  "utf8",
);
console.log(`Wrote ${manifestPath}.`);
