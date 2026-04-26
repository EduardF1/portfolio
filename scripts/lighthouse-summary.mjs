#!/usr/bin/env node
/** Read every JSON report under docs/lighthouse-reports and emit scores.md. */
import { readFileSync, writeFileSync } from "node:fs";
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
const rows = [];
for (const [path, slug] of ROUTES) {
  try {
    const j = JSON.parse(readFileSync(join(OUT, `${slug}.json`), "utf8"));
    const s = (k) => Math.round((j.categories[k]?.score ?? 0) * 100);
    rows.push([
      path,
      s("performance"),
      s("accessibility"),
      s("best-practices"),
      s("seo"),
    ]);
  } catch {
    rows.push([path, "—", "—", "—", "—"]);
  }
}

const md = [
  "| Route | Perf | A11y | BP | SEO |",
  "|---|---:|---:|---:|---:|",
  ...rows.map(([p, ...s]) => `| \`${p}\` | ${s.join(" | ")} |`),
].join("\n");

writeFileSync(join(OUT, "scores.md"), md + "\n", "utf8");
console.log(md);
