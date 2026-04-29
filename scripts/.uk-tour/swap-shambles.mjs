// Swap the York Shambles pick (33622985) — too many foreground faces per
// the banned-content rule in docs/photo-organization.md section 6 — for
// a cleaner architecture-only York street shot from the same
// photographer (Oliver Schröder, 33622980).

import {
  unlinkSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const TRIP_FOLDER = "2023-07-uk-tour";
const TAKEN_AT = "2023-07-07T12:00:00Z";

const OLD = {
  rel: `trips/${TRIP_FOLDER}/pexels-york-shambles-historic-street-33622985.jpg`,
};
const NEW = {
  id: 33622980,
  slug: "york-historic-architecture-church-spire",
  photographer: "Oliver Schröder",
  photographerUrl: "https://www.pexels.com/@olivers/",
  pageUrl: "https://www.pexels.com/photo/york-s-historic-architecture-with-church-spire-33622980/",
};

const newFile = `pexels-${NEW.slug}-${NEW.id}.jpg`;
const newRel = `trips/${TRIP_FOLDER}/${newFile}`;
const newAbs = join(repoRoot, "public", "photos", newRel);

// ---------- Download new ----------
async function downloadImage(id) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`Suspiciously small (${buf.length}b)`);
  return buf;
}

if (!existsSync(newAbs)) {
  const raw = await downloadImage(NEW.id);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(newAbs, out);
  console.log(`[ok] ${newRel} (${(out.length / 1024).toFixed(0)} KB)`);
} else {
  console.log(`[skip exists] ${newRel}`);
}

// ---------- Remove old file ----------
const oldAbs = join(repoRoot, "public", "photos", OLD.rel);
if (existsSync(oldAbs)) {
  unlinkSync(oldAbs);
  console.log(`[unlink] ${OLD.rel}`);
}

// ---------- Patch catalogue ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));

let patched = 0;
for (const e of catalogue) {
  if (e.src === OLD.rel) {
    e.src = newRel;
    e.takenAt = TAKEN_AT;
    e.source.url = NEW.pageUrl;
    e.source.photographer = NEW.photographer;
    e.source.photographerUrl = NEW.photographerUrl;
    patched += 1;
  }
}
writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
console.log(`Catalogue: patched ${patched} entry/entries.`);

// ---------- Patch attributions doc ----------
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
let attribRaw = readFileSync(attribPath, "utf8");

const oldRow =
  `| \`public/photos/${OLD.rel}\` | York, United Kingdom | [Oliver Schröder](https://www.pexels.com/@olivers/) | Pexels | [link](https://www.pexels.com/photo/bustling-street-scene-in-york-s-historic-shambles-33622985/) |`;
const newRow =
  `| \`public/photos/${newRel}\` | York, United Kingdom | [${NEW.photographer}](${NEW.photographerUrl}) | Pexels | [link](${NEW.pageUrl}) |`;

if (attribRaw.includes(oldRow)) {
  attribRaw = attribRaw.replace(oldRow, newRow);
  writeFileSync(attribPath, attribRaw, "utf8");
  console.log(`Attributions: swapped row.`);
} else {
  console.warn(`Attribution row not found exactly; manual review needed.`);
  // Try a more lenient match.
  const lines = attribRaw.split("\n");
  const idx = lines.findIndex((l) => l.includes("33622985"));
  if (idx >= 0) {
    lines[idx] = newRow;
    writeFileSync(attribPath, lines.join("\n"), "utf8");
    console.log(`Attributions: lenient replace at line ${idx + 1}.`);
  }
}
