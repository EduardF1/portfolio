#!/usr/bin/env node
/**
 * Extract failing audits per route from the Lighthouse JSON in OUT_DIR.
 *
 * Usage:
 *   OUT_DIR=docs/lighthouse-reports/v1-audit-before \
 *     node scripts/v1-audit-issues.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.OUT_DIR ?? "docs/lighthouse-reports/v1-audit-before";

const files = readdirSync(OUT).filter((f) => f.endsWith(".json"));
files.sort();

for (const file of files) {
  const path = join(OUT, file);
  let j;
  try {
    j = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  if (!j.categories) continue;

  const url = j.finalUrl ?? j.requestedUrl ?? file;
  console.log(`\n=== ${file} (${url}) ===`);
  for (const catKey of [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
  ]) {
    const cat = j.categories[catKey];
    if (!cat) continue;
    const score = Math.round((cat.score ?? 0) * 100);
    console.log(`  [${catKey}] ${score}`);
    const failed = (cat.auditRefs ?? [])
      .map((r) => j.audits[r.id])
      .filter((a) => a && a.score !== null && a.score < 0.9 && !a.scoreDisplayMode?.includes("manual") && !a.scoreDisplayMode?.includes("notApplicable") && !a.scoreDisplayMode?.includes("informative"));
    for (const a of failed) {
      const score = a.score === null ? "n/a" : Math.round(a.score * 100);
      let extra = "";
      if (a.numericValue !== undefined && a.displayValue) extra = ` [${a.displayValue}]`;
      console.log(`    - ${a.id} (${score})${extra}: ${a.title}`);
    }
  }
}
