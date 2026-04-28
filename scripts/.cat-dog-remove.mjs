// One-shot helper for the artistic-portfolio cat+dog cleanup.
//
// Filters scripts/photo-catalogue.json to drop entries whose src appears in
// scripts/.cat-dog-scan.json's `removals` array. The companion shell step
// `git mv`s the JPGs to scripts/.removed-non-artistic/<trip>/<file>.jpg.
//
// Idempotent: re-running on an already-pruned catalogue is a no-op.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOGUE = path.join(ROOT, "scripts", "photo-catalogue.json");
const SCAN = path.join(ROOT, "scripts", ".cat-dog-scan.json");

const cat = JSON.parse(await fs.readFile(CATALOGUE, "utf-8"));
const scan = JSON.parse(await fs.readFile(SCAN, "utf-8"));
const remove = new Set(scan.removals.map((r) => r.src));

const before = cat.length;
const kept = cat.filter((e) => !remove.has(e.src));
const removed = cat.filter((e) => remove.has(e.src));
const after = kept.length;

await fs.writeFile(CATALOGUE, JSON.stringify(kept, null, 2) + "\n", "utf-8");

console.log(JSON.stringify({
  before,
  after,
  removed: removed.length,
  removedSrcs: removed.map((e) => e.src),
}, null, 2));
