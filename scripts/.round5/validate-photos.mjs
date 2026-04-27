// Verify every catalogue entry's src maps to an existing file under
// public/photos/, and confirm every personal-page photo ref resolves.

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const PHOTOS_DIR = path.join(ROOT, "public", "photos");
const CATALOGUE_PATH = path.join(ROOT, "scripts", "photo-catalogue.json");
const PERSONAL_PAGE = path.join(
  ROOT,
  "src",
  "app",
  "[locale]",
  "personal",
  "page.tsx",
);

async function main() {
  const cat = JSON.parse(await fs.readFile(CATALOGUE_PATH, "utf-8"));
  const missing = [];
  const orphans = [];
  const knownFiles = new Set();

  for (const e of cat) {
    const abs = path.join(PHOTOS_DIR, e.src);
    if (!existsSync(abs)) {
      missing.push(e.src);
    } else {
      knownFiles.add(path.resolve(abs));
    }
  }

  // Walk public/photos to find orphans (files on disk not referenced
  // in catalogue and not in personal/ — those are page-only assets).
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(p);
      else if (/\.(jpe?g|png|webp)$/i.test(ent.name)) {
        const rel = path.relative(PHOTOS_DIR, p).replaceAll("\\", "/");
        if (!knownFiles.has(path.resolve(p)) && !rel.startsWith("personal/")) {
          orphans.push(rel);
        }
      }
    }
  }
  await walk(PHOTOS_DIR);

  // Check that all hardcoded /photos/... refs in personal/page.tsx exist.
  const page = await fs.readFile(PERSONAL_PAGE, "utf-8");
  const refs = [...page.matchAll(/['"](\/photos\/[^'"]+)['"]/g)].map(
    (m) => m[1],
  );
  const pageMissing = [];
  for (const r of refs) {
    const abs = path.join(ROOT, "public", r.replace(/^\//, ""));
    if (!existsSync(abs)) pageMissing.push(r);
  }

  const result = {
    catalogueEntries: cat.length,
    missingFiles: missing,
    orphanFiles: orphans,
    pageRefs: refs,
    pageMissing,
  };
  console.log(JSON.stringify(result, null, 2));
  await fs.writeFile(
    path.join(ROOT, "scripts", ".round5", "validation-report.json"),
    JSON.stringify(result, null, 2),
    "utf-8",
  );
}

await main();
