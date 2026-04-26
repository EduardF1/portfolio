#!/usr/bin/env node
/**
 * Run Lighthouse against the production site for a fixed list of public
 * routes and emit a markdown table + per-route JSON to docs/lighthouse-reports/.
 *
 * Usage: node scripts/lighthouse-batch.mjs
 *
 * Honours BASE_URL env (defaults to https://eduardfischer.dev).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "https://eduardfischer.dev";
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
mkdirSync(OUT, { recursive: true });

const rows = [];
for (const [path, slug] of ROUTES) {
  const url = `${BASE}${path}`;
  const file = join(OUT, `${slug}.json`);
  console.log(`> ${url}`);
  const r = spawnSync(
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
  if (r.status !== 0) {
    console.error(`lighthouse failed for ${url}`);
    rows.push([path, "—", "—", "—", "—"]);
    continue;
  }
  const j = JSON.parse(readFileSync(file, "utf8"));
  const score = (k) => Math.round((j.categories[k]?.score ?? 0) * 100);
  rows.push([
    path,
    score("performance"),
    score("accessibility"),
    score("best-practices"),
    score("seo"),
  ]);
}

const md = [
  "| Route | Perf | A11y | BP | SEO |",
  "|---|---:|---:|---:|---:|",
  ...rows.map(([p, ...s]) => `| \`${p}\` | ${s.join(" | ")} |`),
].join("\n");

writeFileSync(join(OUT, "scores.md"), md + "\n", "utf8");
console.log("\n" + md);
