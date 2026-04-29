// Last-mile Romania backfill — bring 8 cities to >=5 photos each via Pexels
// regional fallbacks (Pitești→Wallachia/Curtea de Argeș, Ploiești→Sinaia/Peles,
// Brăila→Danube delta, Craiova→Oltenia/Romanian church, Costinești→Black Sea
// Romania, Vama Veche→Black Sea sunset, Câmpina→Prahova/Bucegi, Covasna→
// Carpathian/Transylvanian villages).
//
// Same schema and resize/encode pipeline as scripts/.batch3/apply-pexels.mjs.

import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

const MID = {
  "2019-01-romania": "2019-01-12T12:00:00Z",
  "2024-06-romania-wallachia": "2024-06-15T12:00:00Z",
  "2024-06-romania-black-sea": "2024-06-22T12:00:00Z",
};

const PLACES = {
  pitesti: {
    gps: { lat: 44.8606, lon: 24.8678 },
    place: { city: "Pitești", country: "Romania", display: "Pitești, Romania" },
  },
  ploiesti: {
    gps: { lat: 44.9408, lon: 26.0103 },
    place: {
      city: "Ploiești",
      country: "Romania",
      display: "Ploiești, Romania",
    },
  },
  braila: {
    gps: { lat: 45.2692, lon: 27.9574 },
    place: { city: "Brăila", country: "Romania", display: "Brăila, Romania" },
  },
  craiova: {
    gps: { lat: 44.3302, lon: 23.7949 },
    place: { city: "Craiova", country: "Romania", display: "Craiova, Romania" },
  },
  costinesti: {
    gps: { lat: 43.9494, lon: 28.6336 },
    place: {
      city: "Costinești",
      country: "Romania",
      display: "Costinești, Romania",
    },
  },
  vamaVeche: {
    gps: { lat: 43.7515, lon: 28.575 },
    place: {
      city: "Vama Veche",
      country: "Romania",
      display: "Vama Veche, Romania",
    },
  },
  campina: {
    gps: { lat: 45.1259, lon: 25.7322 },
    place: { city: "Câmpina", country: "Romania", display: "Câmpina, Romania" },
  },
  covasna: {
    gps: { lat: 45.8506, lon: 26.185 },
    place: { city: "Covasna", country: "Romania", display: "Covasna, Romania" },
  },
};

// Trip slug strategy:
// - Pitești, Ploiești, Câmpina, Craiova → 2024-06-romania-wallachia
// - Brăila, Costinești, Vama Veche → 2024-06-romania-black-sea
// - Covasna → 2019-01-romania (existing PR #105 slug)

const PICKS = [
  // ---- Pitești (0 -> 5) — Curtea de Argeș monastery + Romanian small town ----
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 30621326,
    slug: "pitesti-curtea-de-arges-monastery",
    photographer: "Design Diva",
    photographerUrl: "https://www.pexels.com/@designdiva/",
    pageUrl: "https://www.pexels.com/photo/30621326/",
    placeKey: "pitesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 5178441,
    slug: "pitesti-orthodox-church-domes",
    photographer: "Diana ✨",
    photographerUrl: "https://www.pexels.com/@didsss/",
    pageUrl: "https://www.pexels.com/photo/5178441/",
    placeKey: "pitesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 2757830,
    slug: "pitesti-cathedral-interior-dome",
    photographer: "Diana ✨",
    photographerUrl: "https://www.pexels.com/@didsss/",
    pageUrl: "https://www.pexels.com/photo/2757830/",
    placeKey: "pitesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 17010860,
    slug: "pitesti-romanian-village-house",
    photographer: "Lucian Lungu",
    photographerUrl: "https://www.pexels.com/@lucian-lungu-580910624/",
    pageUrl: "https://www.pexels.com/photo/17010860/",
    placeKey: "pitesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 33402114,
    slug: "pitesti-village-church-tower",
    photographer: "Christopher Politano",
    photographerUrl: "https://www.pexels.com/@christopher-politano-978995/",
    pageUrl: "https://www.pexels.com/photo/33402114/",
    placeKey: "pitesti",
  },

  // ---- Ploiești (0 -> 5) — Sinaia mountains / Peles area ----
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 17853892,
    slug: "ploiesti-sinaia-peles-aerial-forest",
    photographer: "Dan Voican",
    photographerUrl: "https://www.pexels.com/@dan-voican-2624103/",
    pageUrl: "https://www.pexels.com/photo/17853892/",
    placeKey: "ploiesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 17853910,
    slug: "ploiesti-sinaia-peles-greenery-aerial",
    photographer: "Dan Voican",
    photographerUrl: "https://www.pexels.com/@dan-voican-2624103/",
    pageUrl: "https://www.pexels.com/photo/17853910/",
    placeKey: "ploiesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 17853891,
    slug: "ploiesti-sinaia-peles-summer-forest",
    photographer: "Dan Voican",
    photographerUrl: "https://www.pexels.com/@dan-voican-2624103/",
    pageUrl: "https://www.pexels.com/photo/17853891/",
    placeKey: "ploiesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 13222849,
    slug: "ploiesti-sinaia-winter-trees",
    photographer: "Javier Linares",
    photographerUrl: "https://www.pexels.com/@javier-linares-293447137/",
    pageUrl: "https://www.pexels.com/photo/13222849/",
    placeKey: "ploiesti",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 14061226,
    slug: "ploiesti-sinaia-peles-neorenaissance-facade",
    photographer: "Princess Ara Versabal",
    photographerUrl: "https://www.pexels.com/@princess-ara-versabal-3110140/",
    pageUrl: "https://www.pexels.com/photo/14061226/",
    placeKey: "ploiesti",
  },

  // ---- Brăila (0 -> 5) — Danube delta wetlands / Lower Danube ----
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 6216092,
    slug: "braila-danube-delta-pelicans-serene",
    photographer: "Andrei Prodan",
    photographerUrl: "https://www.pexels.com/@andrei-prodan-10235249/",
    pageUrl: "https://www.pexels.com/photo/6216092/",
    placeKey: "braila",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 6216085,
    slug: "braila-danube-delta-pelicans-water",
    photographer: "Andrei Prodan",
    photographerUrl: "https://www.pexels.com/@andrei-prodan-10235249/",
    pageUrl: "https://www.pexels.com/photo/6216085/",
    placeKey: "braila",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 6216086,
    slug: "braila-danube-delta-pelicans-vibrant",
    photographer: "Andrei Prodan",
    photographerUrl: "https://www.pexels.com/@andrei-prodan-10235249/",
    pageUrl: "https://www.pexels.com/photo/6216086/",
    placeKey: "braila",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 6176173,
    slug: "braila-danube-delta-pelicans-sunrise",
    photographer: "Andrei Prodan",
    photographerUrl: "https://www.pexels.com/@andrei-prodan-10235249/",
    pageUrl: "https://www.pexels.com/photo/6176173/",
    placeKey: "braila",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 11105458,
    slug: "braila-danube-mahmudia-wetland-pelicans",
    photographer: "Marian Strinoiu",
    photographerUrl: "https://www.pexels.com/@marian-strinoiu-1805558/",
    pageUrl: "https://www.pexels.com/photo/11105458/",
    placeKey: "braila",
  },

  // ---- Craiova (0 -> 5) — Oltenia / Wallachia / Romanian church ----
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 25450652,
    slug: "craiova-madona-dudu-brancovenesc-church",
    photographer: "Ayan Pasol",
    photographerUrl: "https://www.pexels.com/@ayan-pasol-1340587356/",
    pageUrl: "https://www.pexels.com/photo/25450652/",
    placeKey: "craiova",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 12265682,
    slug: "craiova-winter-market-snow",
    photographer: "Cristina Tiris",
    photographerUrl: "https://www.pexels.com/@cristina-tiris-225421306/",
    pageUrl: "https://www.pexels.com/photo/12265682/",
    placeKey: "craiova",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 28113005,
    slug: "craiova-oltenia-orthodox-monastery-river",
    photographer: "Irina A. Balashova",
    photographerUrl: "https://www.pexels.com/@irina-a-balashova/",
    pageUrl: "https://www.pexels.com/photo/28113005/",
    placeKey: "craiova",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 35286173,
    slug: "craiova-romanian-orthodox-church",
    photographer: "Maria M",
    photographerUrl: "https://www.pexels.com/@maria-m-1070886292/",
    pageUrl: "https://www.pexels.com/photo/35286173/",
    placeKey: "craiova",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 14367794,
    slug: "craiova-romanian-village-church-valley",
    photographer: "Ioan Dan Plesa",
    photographerUrl: "https://www.pexels.com/@ioan-dan-plesa-75309815/",
    pageUrl: "https://www.pexels.com/photo/14367794/",
    placeKey: "craiova",
  },

  // ---- Costinești (0 -> 5) — Black Sea Romania beach summer ----
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 19203209,
    slug: "costinesti-schitu-beach-tranquil",
    photographer: "Diana ✨",
    photographerUrl: "https://www.pexels.com/@didsss/",
    pageUrl: "https://www.pexels.com/photo/19203209/",
    placeKey: "costinesti",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 35605671,
    slug: "costinesti-pink-white-beach-huts",
    photographer: "The IOP",
    photographerUrl: "https://www.pexels.com/@the-iop-86002042/",
    pageUrl: "https://www.pexels.com/photo/35605671/",
    placeKey: "costinesti",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 2531325,
    slug: "costinesti-venus-beach-sunset",
    photographer: "Andreea Simion",
    photographerUrl: "https://www.pexels.com/@andreeasimion/",
    pageUrl: "https://www.pexels.com/photo/2531325/",
    placeKey: "costinesti",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 5085466,
    slug: "costinesti-eforie-nord-sunrise",
    photographer: "Mădălina Vlăduță",
    photographerUrl: "https://www.pexels.com/@madalina/",
    pageUrl: "https://www.pexels.com/photo/5085466/",
    placeKey: "costinesti",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 4992518,
    slug: "costinesti-seagull-sandy-shore",
    photographer: "Diana ✨",
    photographerUrl: "https://www.pexels.com/@didsss/",
    pageUrl: "https://www.pexels.com/photo/4992518/",
    placeKey: "costinesti",
  },

  // ---- Vama Veche (0 -> 5) — Black Sea sunset / sandy coast Romania ----
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 17276014,
    slug: "vama-veche-olimp-sea-evening",
    photographer: "Andromeda Stan",
    photographerUrl: "https://www.pexels.com/@andromeda-stan-133604221/",
    pageUrl: "https://www.pexels.com/photo/17276014/",
    placeKey: "vamaVeche",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 33781725,
    slug: "vama-veche-thatched-beach-huts",
    photographer: "Oana Cicalau",
    photographerUrl: "https://www.pexels.com/@oana-cicalau-1402903180/",
    pageUrl: "https://www.pexels.com/photo/33781725/",
    placeKey: "vamaVeche",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 18949577,
    slug: "vama-veche-corbu-seaside-deck",
    photographer: "Bianca Jelezniac",
    photographerUrl: "https://www.pexels.com/@bianca-jelezniac-38713659/",
    pageUrl: "https://www.pexels.com/photo/18949577/",
    placeKey: "vamaVeche",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 28456593,
    slug: "vama-veche-abandoned-pier-sunset",
    photographer: "Teodor Costachioiu",
    photographerUrl: "https://www.pexels.com/@tcostachioiu/",
    pageUrl: "https://www.pexels.com/photo/28456593/",
    placeKey: "vamaVeche",
  },
  {
    tripFolder: "2024-06-romania-black-sea",
    id: 7285299,
    slug: "vama-veche-seagull-sunset-coast",
    photographer: "Gigxels",
    photographerUrl: "https://www.pexels.com/@gigxels/",
    pageUrl: "https://www.pexels.com/photo/7285299/",
    placeKey: "vamaVeche",
  },

  // ---- Câmpina (0 -> 5) — Prahova / Bucegi mountain foothills ----
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 25026862,
    slug: "campina-busteni-carpathians-aerial",
    photographer: "Balázs Gábor",
    photographerUrl: "https://www.pexels.com/@gaborbalazs97/",
    pageUrl: "https://www.pexels.com/photo/25026862/",
    placeKey: "campina",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 25026864,
    slug: "campina-bucegi-fog-clouds",
    photographer: "Balázs Gábor",
    photographerUrl: "https://www.pexels.com/@gaborbalazs97/",
    pageUrl: "https://www.pexels.com/photo/25026864/",
    placeKey: "campina",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 19755730,
    slug: "campina-bucegi-panorama",
    photographer: "Iulian Patrascu",
    photographerUrl: "https://www.pexels.com/@gip07/",
    pageUrl: "https://www.pexels.com/photo/19755730/",
    placeKey: "campina",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 5601709,
    slug: "campina-prahova-mountain-peaks",
    photographer: "Filip Marcus Adam",
    photographerUrl: "https://www.pexels.com/@filip-marcus-adam-3638207/",
    pageUrl: "https://www.pexels.com/photo/5601709/",
    placeKey: "campina",
  },
  {
    tripFolder: "2024-06-romania-wallachia",
    id: 6558453,
    slug: "campina-carpathian-forest-boardwalk",
    photographer: "Andrei Tanase",
    photographerUrl: "https://www.pexels.com/@andreimike/",
    pageUrl: "https://www.pexels.com/photo/6558453/",
    placeKey: "campina",
  },

  // ---- Covasna (2 -> 5) — Carpathian / Transylvanian villages ----
  {
    tripFolder: "2019-01-romania",
    id: 35684347,
    slug: "covasna-rimetea-village-mountains",
    photographer: "Madalina Brandasiu",
    photographerUrl:
      "https://www.pexels.com/@madalina-brandasiu-2149502434/",
    pageUrl: "https://www.pexels.com/photo/35684347/",
    placeKey: "covasna",
  },
  {
    tripFolder: "2019-01-romania",
    id: 30735312,
    slug: "covasna-sheep-snowcapped-peaks",
    photographer: "Ábrahám Szilárd",
    photographerUrl: "https://www.pexels.com/@abraham-szilard-2149600427/",
    pageUrl: "https://www.pexels.com/photo/30735312/",
    placeKey: "covasna",
  },
  {
    tripFolder: "2019-01-romania",
    id: 19264990,
    slug: "covasna-toplita-snow-village-dusk",
    photographer: "Denis Zagorodniuc",
    photographerUrl: "https://www.pexels.com/@imdennyz/",
    pageUrl: "https://www.pexels.com/photo/19264990/",
    placeKey: "covasna",
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
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) {
    throw new Error(
      `Suspiciously small response (${buf.length} bytes) for ${url}`,
    );
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
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
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
  console.error(
    `\n${failures.length} downloads failed; aborting catalogue update.`,
  );
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
const licenseHeaderIdx = lines.findIndex((l) =>
  l.startsWith("## License terms"),
);
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
while (totalIdx >= 0 && !lines[totalIdx].startsWith("Total stock photos:"))
  totalIdx--;

const newTotal =
  catalogue.filter((e) => e.source?.type === "stock").length +
  newEntries.length;
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
console.log(
  `Appended ${newRows.length} attribution rows. New total: ${newTotal}.`,
);

writeFileSync(
  join(__dirname, "apply-pexels-results.json"),
  JSON.stringify(results, null, 2) + "\n",
  "utf8",
);
