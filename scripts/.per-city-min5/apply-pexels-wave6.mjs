// Wave 6 — backfill to bring 4 under-stocked city×trip combos to ≥5 photos:
//   Prague        / 2025-04-czechia-poland-slovakia-austria  (4 → 5)
//   Brașov        / 2023-08-romania                          (3 → 5)
//   Bușteni       / 2023-08-romania                          (4 → 5)
//   Azuga         / 2023-08-romania                          (4 → 5)

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
  "2025-04-czechia-poland-slovakia-austria": "2025-04-15T12:00:00Z",
  "2023-08-romania-brasov": "2023-08-15T12:00:00Z",
  "2023-08-romania-busteni": "2023-08-25T12:00:00Z",
  "2023-08-romania-azuga": "2023-08-27T12:00:00Z",
};

const PLACES = {
  prague: {
    gps: { lat: 50.0755, lon: 14.4378 },
    place: { city: "Prague", country: "Czechia", display: "Prague, Czechia" },
  },
  brasov: {
    gps: { lat: 45.6427, lon: 25.5887 },
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },
  busteni: {
    gps: { lat: 45.4075, lon: 25.5424 },
    place: { city: "Bușteni", country: "Romania", display: "Bușteni, Romania" },
  },
  azuga: {
    gps: { lat: 45.4484, lon: 25.5638 },
    place: { city: "Azuga", country: "Romania", display: "Azuga, Romania" },
  },
};

const PICKS = [
  // ---- Prague (4 → 5) — Charles Bridge over Vltava ----
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria",
    midKey: "2025-04-czechia-poland-slovakia-austria",
    id: 16945287,
    slug: "prague-charles-bridge-vltava-view",
    photographer: "l . kaplenig",
    photographerUrl: "https://www.pexels.com/@l-kaplenig-575435782",
    pageUrl: "https://www.pexels.com/photo/charles-bridge-over-vltava-river-in-prague-16945287/",
    placeKey: "prague",
  },

  // ---- Brașov (3 → 5) — Black Church summer + Weaver's Bastion winter ----
  {
    tripFolder: "2023-08-romania",
    midKey: "2023-08-romania-brasov",
    id: 17713520,
    slug: "brasov-black-church-summer",
    photographer: "Reanimatedmanx",
    photographerUrl: "https://www.pexels.com/@reanimatedmanx/",
    pageUrl: "https://www.pexels.com/photo/gothic-black-church-in-brasov-17713520/",
    placeKey: "brasov",
  },
  {
    tripFolder: "2023-08-romania",
    midKey: "2023-08-romania-brasov",
    id: 11534893,
    slug: "brasov-weaver-bastion-winter",
    photographer: "Παναγιώτης Αρκουμάνης",
    photographerUrl: "https://www.pexels.com/@179554791/",
    pageUrl: "https://www.pexels.com/photo/snowy-winter-scene-at-weaver-bastion-in-brasov-with-benches-and-fortress-walls-11534893/",
    placeKey: "brasov",
  },

  // ---- Bușteni (4 → 5) — Bucegi mountain panorama ----
  {
    tripFolder: "2023-08-romania",
    midKey: "2023-08-romania-busteni",
    id: 19755730,
    slug: "busteni-bucegi-mountain-panorama",
    photographer: "Iulian Patrascu",
    photographerUrl: "https://www.pexels.com/@gip07/",
    pageUrl: "https://www.pexels.com/photo/19755730/",
    placeKey: "busteni",
  },

  // ---- Azuga (4 → 5) — Bucegi fog and clouds ----
  {
    tripFolder: "2023-08-romania",
    midKey: "2023-08-romania-azuga",
    id: 25026864,
    slug: "azuga-bucegi-fog-clouds",
    photographer: "Balázs Gábor",
    photographerUrl: "https://www.pexels.com/@gaborbalazs97/",
    pageUrl: "https://www.pexels.com/photo/25026864/",
    placeKey: "azuga",
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
    console.log(`  [skip] ${rel} already exists (${(sz / 1024).toFixed(0)} KB)`);
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
  results.push(await processOne(pick));
}

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  if (existingSrc.has(r.rel)) {
    console.log(`  [skip-cat] ${r.rel} already in catalogue`);
    continue;
  }
  const placeData = PLACES[r.pick.placeKey];
  const takenAt = MID[r.pick.midKey];
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
console.log(`Appended ${newEntries.length} catalogue entries.`);

const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");
const lines = attribRaw.split("\n");
const licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
for (const r of results) {
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
console.log(`Appended ${newRows.length} attribution rows.`);
