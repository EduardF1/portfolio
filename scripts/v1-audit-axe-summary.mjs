#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.OUT_DIR ?? "docs/lighthouse-reports/v1-audit-before";

const files = readdirSync(OUT).filter((f) => f.startsWith("axe-") && f.endsWith(".json"));
files.sort();

for (const f of files) {
  const j = JSON.parse(readFileSync(join(OUT, f), "utf8"));
  console.log(`\n=== ${j.route} (${j.url}) ===`);
  console.log(`  violations: ${j.violations.length}`);
  for (const v of j.violations) {
    console.log(`  - ${v.id} (${v.impact}): ${v.help}  [${v.nodeCount} nodes]`);
    for (const n of v.nodes) {
      console.log(`      target: ${(n.target ?? []).join(" ")}`);
      if (n.html) console.log(`      html: ${n.html.replace(/\n/g, " ").slice(0, 160)}`);
    }
  }
}
