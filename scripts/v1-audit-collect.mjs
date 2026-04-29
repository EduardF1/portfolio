#!/usr/bin/env node
/**
 * Re-parse the per-route Lighthouse JSON in OUT_DIR and rewrite scores.md.
 * Useful when the lighthouse CLI exited non-zero (Windows tmp-cleanup race)
 * but the JSON was written successfully.
 *
 * Usage:
 *   OUT_DIR=docs/lighthouse-reports/v1-audit-before \
 *     node scripts/v1-audit-collect.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.OUT_DIR ?? "docs/lighthouse-reports/v1-audit-before";

const ROUTES = [
  ["/en", "home"],
  ["/en/travel", "travel"],
  ["/en/travel/photos/germany-2022-10", "trip-germany-2022-10"],
  ["/en/travel/photos/romania-2024-06", "trip-romania-2024-06"],
  ["/en/travel/photos/united-kingdom-2023-07", "trip-uk-2023-07"],
  ["/en/personal", "personal"],
  ["/en/work", "work"],
  ["/en/writing", "writing"],
  ["/en/now", "now"],
  ["/en/contact", "contact"],
];

const rows = [];
for (const [path, slug] of ROUTES) {
  const file = join(OUT, `${slug}.json`);
  if (!existsSync(file)) {
    rows.push([path, "—", "—", "—", "—"]);
    continue;
  }
  try {
    const j = JSON.parse(readFileSync(file, "utf8"));
    if (!j.categories) {
      rows.push([path, "—", "—", "—", "—"]);
      continue;
    }
    const score = (k) => Math.round((j.categories[k]?.score ?? 0) * 100);
    rows.push([
      path,
      score("performance"),
      score("accessibility"),
      score("best-practices"),
      score("seo"),
    ]);
  } catch (err) {
    console.error(`failed to parse ${file}: ${err}`);
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
