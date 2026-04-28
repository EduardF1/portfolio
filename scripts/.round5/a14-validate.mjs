// Validation for Agent A14 deliverable.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));

const TARGET_FOLDERS = [
  "2018-04-sweden",
  "2019-07-belgium",
  "2019-07-luxembourg",
  "2020-02-denmark",
  "2022-07-greece",
  "2022-08-denmark",
  "2022-08-romania",
  "2022-10-denmark",
  "2022-10-germany",
  "2022-12-romania",
  "2023-04-italy",
  "2023-07-turkey",
  "2023-08-romania",
  "2024-09-albania-saranda",
  "2025-02-finland",
  "2025-03-romania",
];

// 1. every catalogue src resolves
const missing = [];
for (const e of catalogue) {
  const abs = join(repoRoot, "public", "photos", e.src);
  if (!existsSync(abs)) missing.push(e.src);
}

// 2. no duplicate src
const seen = new Set();
const dupes = [];
for (const e of catalogue) {
  if (seen.has(e.src)) dupes.push(e.src);
  seen.add(e.src);
}

// 3. cluster counts
const folderCounts = new Map();
const folderStockCounts = new Map();
for (const e of catalogue) {
  const m = e.src.match(/^trips\/([^/]+)\//);
  if (!m) continue;
  const f = m[1];
  folderCounts.set(f, (folderCounts.get(f) || 0) + 1);
  if (e.source && e.source.type === "stock") {
    folderStockCounts.set(f, (folderStockCounts.get(f) || 0) + 1);
  }
}

const summary = TARGET_FOLDERS.map((f) => ({
  folder: f,
  total: folderCounts.get(f) || 0,
  stock: folderStockCounts.get(f) || 0,
  personal: (folderCounts.get(f) || 0) - (folderStockCounts.get(f) || 0),
  meets5: (folderCounts.get(f) || 0) >= 5,
}));

console.log("=== Cluster counts (target ≥5) ===");
for (const s of summary) {
  const ok = s.meets5 ? "OK " : "FAIL";
  console.log(
    `  [${ok}] ${s.folder.padEnd(28)} total=${String(s.total).padStart(2)}  personal=${s.personal}  stock=${s.stock}`,
  );
}

console.log("");
console.log("=== Provider breakdown (new stock entries) ===");
const providers = new Map();
for (const e of catalogue) {
  if (!e.source || e.source.type !== "stock") continue;
  const p = e.source.provider;
  providers.set(p, (providers.get(p) || 0) + 1);
}
for (const [p, n] of providers) console.log(`  ${p}: ${n}`);

console.log("");
console.log(`Catalogue total entries: ${catalogue.length}`);
console.log(`Missing files: ${missing.length}`);
if (missing.length > 0) console.log(missing.join("\n"));
console.log(`Duplicate src: ${dupes.length}`);
if (dupes.length > 0) console.log(dupes.join("\n"));

const allOk =
  missing.length === 0 && dupes.length === 0 && summary.every((s) => s.meets5);
console.log("");
console.log(allOk ? "VALIDATION: PASS" : "VALIDATION: FAIL");
process.exit(allOk ? 0 : 1);
