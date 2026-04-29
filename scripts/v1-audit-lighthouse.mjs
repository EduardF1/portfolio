#!/usr/bin/env node
/**
 * Run Lighthouse against a local Next production server for the V1
 * QA-gate routes and emit a per-route JSON + an aggregate markdown
 * scoreboard.
 *
 * Usage:
 *   BASE_URL=http://localhost:3100 OUT_DIR=docs/lighthouse-reports/v1-audit-before \
 *     node scripts/v1-audit-lighthouse.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
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

mkdirSync(OUT, { recursive: true });

const rows = [];
for (const [path, slug] of ROUTES) {
  const url = `${BASE}${path}`;
  const file = join(OUT, `${slug}.json`);
  console.log(`> ${url}`);
  // Lighthouse on Windows can exit non-zero on tmp-dir cleanup
  // (EPERM) even after writing the JSON successfully. We deliberately
  // ignore the exit code and read the JSON below.
  spawnSync(
    "npx",
    [
      "lighthouse",
      url,
      "--quiet",
      `--chrome-flags=--headless=new --no-sandbox`,
      "--output=json",
      `--output-path=${file}`,
      "--only-categories=performance,accessibility,best-practices,seo",
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  // Lighthouse on Windows can exit non-zero on tmp-dir cleanup
  // (EPERM) even after writing the JSON successfully — so try the
  // JSON first regardless of exit code.
  try {
    const raw = readFileSync(file, "utf8");
    const j = JSON.parse(raw);
    if (!j.categories) throw new Error("no categories in report");
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
console.log("\n" + md);
