// Imports the clean candidates produced by thin-trip-detect.py into the
// repo: copy-and-resize via PowerShell, geocode (cache-first, Nominatim on
// miss), append to scripts/photo-catalogue.json. Stable-sort the merged
// catalogue and write back.
//
// Usage:
//   node scripts/thin-trip-wider-import.mjs --gap-plus 5 --total-cap 100

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCatalogueEntry,
  geocodeCacheKey,
  parseNominatimResponse,
} from "./build-photo-catalogue.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const CATALOGUE_PATH = join(__dirname, "photo-catalogue.json");
const GEOCODE_CACHE_PATH = join(__dirname, ".geocode-cache.json");
const DETECT_NDJSON = join(__dirname, ".thin-trip-wider-detect.ndjson");
const PUBLIC_TRIPS = join(ROOT, "public", "photos", "trips");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT = "EduardFischer.dev portfolio batch-geocoder/1.0";
const NOMINATIM_MIN_INTERVAL_MS = 1100;

function parseArgs(argv) {
  const opts = { gapPlus: 5, totalCap: 100 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--gap-plus") opts.gapPlus = Number(argv[++i]);
    else if (a === "--total-cap") opts.totalCap = Number(argv[++i]);
  }
  return opts;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for ${lat},${lon}`);
  return parseNominatimResponse(await res.json());
}

function loadDetect() {
  const text = readFileSync(DETECT_NDJSON, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

function evenSpread(arr, n) {
  if (arr.length <= n) return arr.slice();
  const step = (arr.length - 1) / (n - 1);
  const idxs = new Set();
  for (let i = 0; i < n; i++) idxs.add(Math.round(i * step));
  return [...idxs].sort((a, b) => a - b).map((i) => arr[i]);
}

function copyResize(srcPath, destPath, maxLong = 1920, quality = 82) {
  // Use the System.Drawing-based resize from copy-and-resize-photos.ps1, inlined.
  const ps = `
Add-Type -AssemblyName System.Drawing
$srcPath = '${srcPath.replaceAll("'", "''")}'
$destPath = '${destPath.replaceAll("'", "''")}'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]${quality})
$encoderParams.Param[0] = $qualityParam
$img = [System.Drawing.Image]::FromFile($srcPath)
try {
  $orientation = 1
  if ($img.PropertyIdList -contains 0x0112) {
    $prop = $img.GetPropertyItem(0x0112)
    $orientation = [BitConverter]::ToUInt16($prop.Value, 0)
  }
  $w = $img.Width; $h = $img.Height
  $long = [Math]::Max($w, $h)
  $scale = [Math]::Min(1.0, ${maxLong} / $long)
  $newW = [int]($w * $scale)
  $newH = [int]($h * $scale)
  $bmp = New-Object System.Drawing.Bitmap $newW, $newH
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($img, 0, 0, $newW, $newH)
  $g.Dispose()
  switch ($orientation) {
    2 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
    3 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
    4 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
    5 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
    6 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
    7 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
    8 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
  }
  $bmp.Save($destPath, $jpegCodec, $encoderParams)
  $bmp.Dispose()
} finally { $img.Dispose() }
Write-Output "OK"
`;
  const res = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", ps], {
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(`copy-resize failed (${res.status}): ${res.stderr || res.stdout}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8"));
  const cache = existsSync(GEOCODE_CACHE_PATH)
    ? JSON.parse(readFileSync(GEOCODE_CACHE_PATH, "utf8"))
    : {};
  const detect = loadDetect();

  // Group clean rows by slug.
  const bySlug = {};
  for (const r of detect) {
    if (!r.clean) continue;
    if (!bySlug[r.slug]) bySlug[r.slug] = [];
    bySlug[r.slug].push(r);
  }

  // Compute current trip counts.
  const counts = {};
  for (const e of catalogue) {
    const m = e.src.match(/^trips\/([^/]+)\//);
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  }

  const allPicks = []; // { slug, row }
  for (const [slug, rows] of Object.entries(bySlug)) {
    rows.sort((a, b) => (a.iso || "").localeCompare(b.iso || ""));
    const have = counts[slug] || 0;
    const gap = Math.max(0, 5 - have);
    if (gap === 0) continue; // safety
    const wantedTotal = gap + opts.gapPlus; // overshoot allowed
    const cap = Math.min(rows.length, wantedTotal);
    const picks = evenSpread(rows, cap);
    console.log(`${slug}: have ${have}, gap ${gap}, candidates ${rows.length} -> picking ${picks.length}`);
    for (const p of picks) allPicks.push({ slug, row: p });
  }
  if (allPicks.length > opts.totalCap) {
    console.log(`Total picks ${allPicks.length} > cap ${opts.totalCap}; trimming.`);
    allPicks.length = opts.totalCap;
  }
  console.log(`\nTotal picks: ${allPicks.length}`);
  if (allPicks.length === 0) {
    console.log("Nothing to import. Exiting.");
    return;
  }

  // Geocode missing keys.
  const need = new Set();
  for (const { row } of allPicks) {
    if (typeof row.lat === "number" && typeof row.lon === "number") {
      need.add(geocodeCacheKey(row.lat, row.lon));
    }
  }
  const missing = [...need].filter((k) => !cache[k]);
  console.log(`Geocode: ${need.size} unique keys, ${missing.length} missing.`);
  for (const key of missing) {
    const [latStr, lonStr] = key.split(",");
    const start = Date.now();
    try {
      const place = await reverseGeocode(Number(latStr), Number(lonStr));
      cache[key] = place;
      console.log(`  geocoded ${key} -> ${place.display}`);
    } catch (err) {
      console.warn(`  WARN ${key}: ${err.message}`);
    }
    const elapsed = Date.now() - start;
    if (elapsed < NOMINATIM_MIN_INTERVAL_MS) await sleep(NOMINATIM_MIN_INTERVAL_MS - elapsed);
  }
  writeFileSync(GEOCODE_CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");

  // Copy + build new entries.
  const newEntries = [];
  for (const { slug, row } of allPicks) {
    const file = row.file;
    const destDir = join(PUBLIC_TRIPS, slug);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    const destPath = join(destDir, file);
    if (existsSync(destPath)) {
      console.log(`SKIP existing: trips/${slug}/${file}`);
      continue;
    }
    console.log(`COPY ${row.src} -> trips/${slug}/${file}`);
    copyResize(row.src, destPath);
    const place = cache[geocodeCacheKey(row.lat, row.lon)] || null;
    const exif = {
      file: `trips/${slug}/${file}`,
      hasGps: true,
      lat: row.lat,
      lon: row.lon,
      dateTimeOriginal: row.iso ? row.iso.replace("T", " ").replace("Z", "") : null,
      cameraModel: row.cameraModel || null,
    };
    // Adjust dateTimeOriginal back to "YYYY:MM:DD HH:MM:SS" for exifDateToIso.
    if (row.iso) {
      const m = row.iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
      if (m) exif.dateTimeOriginal = `${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
    }
    newEntries.push(buildCatalogueEntry(exif, place));
  }

  // Append + sort by takenAt (stable).
  const merged = [...catalogue, ...newEntries];
  merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
  writeFileSync(CATALOGUE_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`\nWrote catalogue (${merged.length} entries, +${newEntries.length}).`);

  // Per-trip after counts.
  const after = {};
  for (const e of merged) {
    const m = e.src.match(/^trips\/([^/]+)\//);
    if (m) after[m[1]] = (after[m[1]] || 0) + 1;
  }
  console.log("\nPer-trip count after import:");
  for (const slug of Object.keys(counts).sort()) {
    const a = after[slug] || 0;
    const b = counts[slug] || 0;
    if (a !== b) console.log(`  ${slug}: ${b} -> ${a}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
