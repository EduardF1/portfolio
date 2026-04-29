#!/usr/bin/env node
/**
 * One-shot doc generator: reads scripts/.g-trip-cluster.summary.json and
 * emits docs/g-trip-clusters-applied.md. Run after cluster-g-trips.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUMMARY = path.join(__dirname, '.g-trip-cluster.summary.json');
const OUT = path.join(__dirname, '..', 'docs', 'g-trip-clusters-applied.md');

const s = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));

function fmtDate(iso) {
  return iso.slice(0, 10);
}

function clusterDateRange(c) {
  const a = fmtDate(c.firstAt);
  const b = fmtDate(c.lastAt);
  return a === b ? a : `${a} → ${b}`;
}

function fmtCentroid(c) {
  if (typeof c.centroidLat === 'number' && typeof c.centroidLon === 'number') {
    return `${c.centroidLat.toFixed(3)}, ${c.centroidLon.toFixed(3)}`;
  }
  return '—';
}

const allClusters = [];
for (const y of s.perYear) {
  for (const c of y.clusters) {
    allClusters.push({ ...c, year: y.year });
  }
}
allClusters.sort((a, b) => b.photoCount - a.photoCount);
const top10 = allClusters.slice(0, 10);

let md = '';
md += `# G:\\Poze\\<year>\\ semantic trip-folder clustering — applied 2026-04-28\n\n`;
md += `Within each \`G:\\Poze\\<YYYY>\\\` year-bucket (created by PR #57 WhatsApp\n`;
md += `reorg, PR #61 dedup quarantine, PR #62 bulk-delete quarantine, and the\n`;
md += `latest camera-source reorg), photos are now clustered into\n`;
md += `semantically-named trip subfolders such as \`Hamburg 22\`, \`Milan 24\`, or\n`;
md += `\`Bucharest 18\`. Move-only, reversible, no deletes.\n\n`;
md += `## Run summary\n\n`;
md += `- Script: \`scripts/cluster-g-trips.mjs\`\n`;
md += `- Log: \`scripts/.g-trip-cluster.log\` (TSV, one line per moved file plus\n`;
md += `  \`# CLUSTER\` and run-boundary comments)\n`;
md += `- Branch: \`docs/g-semantic-trip-folders\`\n`;
md += `- Started: \`${s.startedAt}\`\n`;
md += `- Finished: \`${s.finishedAt}\`\n`;
md += `- Duration: ${(s.durationMs / 1000).toFixed(1)} s\n`;
md += `- **Total clusters created: ${s.totalClusters.toLocaleString()}**\n`;
md += `- **Total photos relocated: ${s.totalMoved.toLocaleString()}**\n`;
md += `- **Singletons left at year root: ${s.totalSingletons.toLocaleString()}**\n`;
md += `- GPS-box lookup hits (offline city/country resolver): ${s.gpsBoxLookupHits}\n`;
md += `- Nominatim cache hits: ${s.nominatimCacheHits}\n`;
md += `- Nominatim live network calls: ${s.nominatimNetworkCalls}\n`;
md += `- Nominatim rate-limited (429): ${s.nominatimRateLimited}\n\n`;

md += `## Clustering rules\n\n`;
md += `Two photos belong to the same trip when **both** hold:\n\n`;
md += `1. \`takenAt\` gap ≤ 36 h, **AND**\n`;
md += `2. GPS within a 200 km radius of the running cluster mean (skipped\n`;
md += `   when no GPS is available — date-only fallback).\n\n`;
md += `Naming is \`<City> <YY>\` (e.g. "Hamburg 22") when the cluster's GPS\n`;
md += `centroid resolves to a known city via a deterministic offline\n`;
md += `bounding-box table. When only the country resolves, the cluster is\n`;
md += `named \`<Country> <YY>\` (e.g. "Denmark 19"). When no GPS is available\n`;
md += `at all, the fallback is a date-range slug like \`2018-03-15..17 trip\`.\n\n`;
md += `Singletons (clusters with a single photo) are intentionally **left at\n`;
md += `the year root** rather than being forced into a one-photo folder. The\n`;
md += `same applies to photos with no readable date in EXIF *or* in the\n`;
md += `filename — they stay at the root for manual review.\n\n`;

md += `## Top 10 clusters by photo count\n\n`;
md += `| Rank | Cluster | Photos | Year | Date range | Centroid |\n`;
md += `| ----:| ------- | -----:| ---- | ---------- | -------- |\n`;
top10.forEach((c, i) => {
  md += `| ${i + 1} | \`${c.name}\` | ${c.photoCount.toLocaleString()} | ${c.year} | ${clusterDateRange(c)} | ${fmtCentroid(c)} |\n`;
});
md += '\n';

md += `## Per-year breakdown\n\n`;
md += `| Year | Files at root (start) | Clusters | Moved | Singletons (left at root) |\n`;
md += `| ---- | ---------------------:| --------:| -----:| -------------------------:|\n`;
for (const y of s.perYear) {
  const clustersN = y.clusters?.length ?? 0;
  md += `| ${y.year} | ${(y.files ?? 0).toLocaleString()} | ${clustersN} | ${(y.moved ?? 0).toLocaleString()} | ${(y.singletons ?? 0).toLocaleString()} |\n`;
}
md += `| **Total** | — | **${s.totalClusters}** | **${s.totalMoved.toLocaleString()}** | **${s.totalSingletons.toLocaleString()}** |\n\n`;

md += `## Per-year cluster detail\n\n`;
for (const y of s.perYear) {
  if (!y.clusters || y.clusters.length === 0) continue;
  md += `### ${y.year} — ${y.clusters.length} cluster${y.clusters.length === 1 ? '' : 's'}, ${y.moved.toLocaleString()} photo${y.moved === 1 ? '' : 's'} moved\n\n`;
  md += `| Cluster | Photos | Date range | Centroid | City |\n`;
  md += `| ------- | -----:| ---------- | -------- | ---- |\n`;
  // Sort by photo count desc within year for readability.
  const sorted = [...y.clusters].sort((a, b) => b.photoCount - a.photoCount);
  for (const c of sorted) {
    md += `| \`${c.name}\` | ${c.photoCount.toLocaleString()} | ${clusterDateRange(c)} | ${fmtCentroid(c)} | ${c.city ?? '—'} |\n`;
  }
  md += '\n';
}

md += `## Recovery / reversal\n\n`;
md += `Each move is logged as a TSV row in \`scripts/.g-trip-cluster.log\`:\n\n`;
md += `\`\`\`\n`;
md += `<timestamp>\\t<old_path>\\t<new_path>\\t<cluster_name>\\t<year>\n`;
md += `\`\`\`\n\n`;
md += `One-liner to undo every move (PowerShell, dry-run friendly — flip \`-WhatIf\` off when ready):\n\n`;
md += '```powershell\n';
md += `Get-Content scripts\\.g-trip-cluster.log |\n`;
md += `  Where-Object { $_ -notmatch '^#' -and $_ -ne '' } |\n`;
md += `  ForEach-Object {\n`;
md += `    $cols = $_ -split "\`t"\n`;
md += `    if ($cols.Count -ge 3 -and (Test-Path $cols[2])) {\n`;
md += `      Move-Item -LiteralPath $cols[2] -Destination $cols[1] -WhatIf\n`;
md += `    }\n`;
md += `  }\n`;
md += '```\n\n';
md += `Or use bash + the same TSV:\n\n`;
md += '```bash\n';
md += `awk -F'\\t' '/^[^#]/ && NF>=3 { printf("mv -n \\"%s\\" \\"%s\\"\\n", $3, $2) }' \\\n`;
md += `  scripts/.g-trip-cluster.log\n`;
md += '```\n\n';

md += `## Sign-off and renaming\n\n`;
md += `Auto-derived cluster names are intentionally short and conservative\n`;
md += `(\`<City> <YY>\` or \`<Country> <YY>\`). To rename any cluster to\n`;
md += `something more meaningful (e.g. "Milan trip 2024", "Greece roadtrip\n`;
md += `2022"), Eduard can run from PowerShell:\n\n`;
md += '```powershell\n';
md += `mv 'G:\\Poze\\2024\\Milan 24'       'G:\\Poze\\2024\\Milan trip'\n`;
md += `mv 'G:\\Poze\\2022\\Hamburg 22'     'G:\\Poze\\2022\\Hamburg trip'\n`;
md += `mv 'G:\\Poze\\2025\\Bucharest 25'   'G:\\Poze\\2025\\Bucharest 25 visit'\n`;
md += '```\n\n';
md += `Folder renames are reversible too — they don't break the catalogue or\n`;
md += `the live site (which keys off \`public/photos/\` slugs, not\n`;
md += `\`G:\\Poze\\\`).\n\n`;
md += `## Caveats\n\n`;
md += `- The 36 h gap rule treats local life and trips identically. For years\n`;
md += `  where Eduard didn't travel much, daily Aarhus / Bucharest commute\n`;
md += `  shots create many small "Aarhus 2X" / "Bucharest 2X" clusters that\n`;
md += `  are technically correct but feel noisy. Fine for archive readability\n`;
md += `  but not what you'd put on a portfolio.\n`;
md += `- Disambiguation suffixes \`(MM)\` and \`(MM-N)\` appear when several\n`;
md += `  same-month, same-city clusters exist in a year. Cleanest fix is a\n`;
md += `  manual rename (see above).\n`;
md += `- A handful of clusters fall back to \`YYYY-MM-DD trip\` naming when\n`;
md += `  the GPS centroid sits outside every box in the lookup table\n`;
md += `  (mostly rural / on-the-road shots between cities). Renaming those\n`;
md += `  to a regional label (e.g. "Tuscany road trip 23") is a 5-minute\n`;
md += `  pass.\n`;

fs.writeFileSync(OUT, md, 'utf8');
console.log(`Wrote ${OUT}`);
