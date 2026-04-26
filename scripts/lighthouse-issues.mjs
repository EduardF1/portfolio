#!/usr/bin/env node
/** Print top failing audits per Lighthouse JSON report. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = [
  ["/", "root"],
  ["/work", "work"],
  ["/writing", "writing"],
  ["/recommends", "recommends"],
  ["/personal", "personal"],
  ["/travel", "travel"],
  ["/contact", "contact"],
  ["/now", "now"],
];

const OUT = "docs/lighthouse-reports";

for (const [path, slug] of ROUTES) {
  let j;
  try {
    j = JSON.parse(readFileSync(join(OUT, `${slug}.json`), "utf8"));
  } catch {
    continue;
  }
  console.log(`\n## ${path}`);
  const audits = Object.values(j.audits)
    .filter((a) => a.score !== null && a.score < 1 && a.score !== undefined)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 12);
  for (const a of audits) {
    const sc = a.score === null ? "n/a" : Math.round(a.score * 100);
    const dn = a.displayValue ? ` [${a.displayValue}]` : "";
    console.log(`- ${sc}/100 ${a.id} — ${a.title}${dn}`);
  }
}
