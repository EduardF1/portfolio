// Integrate A10's photo-discovery.json + fix the Israel folder rename.
// 1. Updates catalogue entries with src "trips/2018-04-israel/*" to
//    "trips/2018-03-israel/*" (folder rename to match A10's manifest).
// 2. Copies any photo-discovery entries with alreadyInPublicPhotos=false
//    from their source path to public/photos/<suggestedFolder>/.
// 3. Adds catalogue entries for any newly-imported photos.

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const PHOTOS_DIR = path.join(ROOT, "public", "photos");
const CATALOGUE_PATH = path.join(ROOT, "scripts", "photo-catalogue.json");
const DISCOVERY_PATH = path.join(
  ROOT,
  "scripts",
  ".round5",
  "photo-discovery.json",
);

async function main() {
  const catalogue = JSON.parse(await fs.readFile(CATALOGUE_PATH, "utf-8"));
  const discovery = JSON.parse(await fs.readFile(DISCOVERY_PATH, "utf-8"));

  const renamedCount = catalogue
    .filter((e) => e.src?.startsWith("trips/2018-04-israel/"))
    .map((e) => {
      e.src = e.src.replace("trips/2018-04-israel/", "trips/2018-03-israel/");
      return e;
    }).length;

  const copyLog = [];
  const newEntries = [];
  const existingSrcs = new Set(
    catalogue.map((e) => path.basename(e.src ?? "")),
  );

  for (const item of discovery) {
    const targetFolder = item.suggestedFolder; // "trips/2018-03-israel"
    const targetFilename = item.suggestedFilename ?? item.filename;
    const targetSrc = `${targetFolder}/${targetFilename}`;
    const targetAbs = path.join(PHOTOS_DIR, targetSrc);

    // Make sure file is on disk under target path.
    if (!existsSync(targetAbs)) {
      // Try copying from source
      if (item.src && existsSync(item.src)) {
        await fs.mkdir(path.dirname(targetAbs), { recursive: true });
        await fs.copyFile(item.src, targetAbs);
        copyLog.push(`COPIED ${item.src} -> ${targetSrc}`);
      } else {
        copyLog.push(
          `SKIP-MISSING source not found: ${item.src} (target ${targetSrc})`,
        );
        continue;
      }
    } else {
      copyLog.push(`PRESENT ${targetSrc}`);
    }

    // Add catalogue entry if not already there.
    if (!existingSrcs.has(targetFilename)) {
      const entry = {
        src: targetSrc,
        takenAt: item.takenAt,
        hasGps: Array.isArray(item.coords),
        cameraModel: item.cameraModel,
        gps: item.coords ? { lat: item.coords[0], lon: item.coords[1] } : undefined,
        place: {
          city: item.city,
          country: item.country,
          display: [item.city, item.country].filter(Boolean).join(", "),
        },
      };
      // Drop undefined keys
      Object.keys(entry).forEach((k) => entry[k] === undefined && delete entry[k]);
      newEntries.push(entry);
      existingSrcs.add(targetFilename);
    }
  }

  const merged = [...catalogue, ...newEntries].sort((a, b) =>
    (a.takenAt ?? "").localeCompare(b.takenAt ?? ""),
  );

  await fs.writeFile(
    CATALOGUE_PATH,
    JSON.stringify(merged, null, 2) + "\n",
    "utf-8",
  );

  const report = {
    foldersRenamed: renamedCount > 0 ? `2018-04-israel -> 2018-03-israel (${renamedCount} entries)` : "n/a",
    copies: copyLog,
    catalogueAddedFromDiscovery: newEntries.length,
    finalCatalogueCount: merged.length,
  };
  console.log(JSON.stringify(report, null, 2));
  await fs.writeFile(
    path.join(ROOT, "scripts", ".round5", "integrate-handoffs-report.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );
}

await main();
