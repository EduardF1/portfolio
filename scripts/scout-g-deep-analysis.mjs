#!/usr/bin/env node
// Deep analysis of high-value folders found in scout-g-other-folders.
// READ-ONLY. Outputs scripts/.g-other-folders-deep.json.
// Full recursion (no depth cap) for these specific folders.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.raw', '.dng']);
const TARGETS = [
  'G:\\Video',
  'G:\\WD_EXT_HDD',
  'G:\\backup media telefon',
  'G:\\Steam',
  'G:\\Huawei themes',
  'G:\\XAMPP',
  'G:\\Archive',
  'G:\\Windows Kits',
  'G:\\University',
  'G:\\AU-MSC',
];
const OUT_JSON = path.join(process.cwd(), 'scripts', '.g-other-folders-deep.json');

function indexPozeFilenames() {
  const set = new Set();
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (PHOTO_EXT.has(ext)) set.add(e.name.toLowerCase());
      }
    }
  }
  walk('G:\\Poze');
  return set;
}

function walkAll(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkAll(full, out);
    else if (e.isFile()) {
      out.totalFiles++;
      const ext = path.extname(e.name).toLowerCase();
      if (PHOTO_EXT.has(ext)) out.photos.push(full);
    }
  }
}

function pickSample(arr, n) {
  if (arr.length <= n) return [...arr];
  // Stratified: every floor(len/n)-th
  const step = Math.max(1, Math.floor(arr.length / n));
  const out = [];
  for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
  return out;
}

function getExifBatch(files) {
  if (files.length === 0) return [];
  try {
    const out = execFileSync(
      'exiftool',
      ['-S', '-q', '-DateTimeOriginal', '-CreateDate', '-GPSPosition', '-FileName', ...files],
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );
    const blocks = out.split(/^={4,}.*$/m).map((b) => b.trim()).filter(Boolean);
    return blocks.map((b) => {
      const lines = b.split(/\r?\n/);
      const obj = {};
      for (const l of lines) {
        const m = l.match(/^([^:]+):\s*(.*)$/);
        if (m) obj[m[1].trim()] = m[2].trim();
      }
      return obj;
    });
  } catch {
    return [];
  }
}

// Compute date range across larger sample (~50 files) via exiftool batch.
function getDateRange(photos) {
  const sample = pickSample(photos, 50);
  if (sample.length === 0) return { min: null, max: null, withDate: 0, sampled: 0 };
  // Run in chunks of 25 to keep cmdline short
  const dates = [];
  for (let i = 0; i < sample.length; i += 25) {
    const chunk = sample.slice(i, i + 25);
    const exif = getExifBatch(chunk);
    for (const e of exif) {
      const d = e.DateTimeOriginal || e.CreateDate;
      if (d) {
        const m = d.match(/^(\d{4}):(\d{2}):(\d{2})/);
        if (m) dates.push(`${m[1]}-${m[2]}-${m[3]}`);
      }
    }
  }
  if (dates.length === 0) return { min: null, max: null, withDate: 0, sampled: sample.length };
  dates.sort();
  return { min: dates[0], max: dates[dates.length - 1], withDate: dates.length, sampled: sample.length };
}

function classify({ folder, photoCount, totalFiles, dupCount, sample, dateRange }) {
  if (photoCount === 0) return 'no-photos';
  const dupRatio = dupCount / photoCount;
  if (dupRatio >= 0.95) return 'duplicate of Poze';
  // PNG-heavy + game/dev path -> screenshots/assets
  const pngHeavy = sample.filter((p) => p.toLowerCase().endsWith('.png')).length / Math.max(1, sample.length);
  const isAsset = /(steam|xampp|windows kits|apache|maven|node_modules|webapps|controller_base|appcache|tenfoot|drivers|sdk|themes\\)/i.test(sample[0] || '');
  if (pngHeavy >= 0.6 && isAsset) return 'app/game assets (not photos)';
  if (folder === 'Huawei themes') return 'wallpaper assets (not photos)';
  if (folder === 'Video') return 'mixed (WhatsApp media archive)';
  if (folder === 'WD_EXT_HDD') return 'primary photo source (legacy backup)';
  if (folder === 'backup media telefon') return 'duplicate of Poze (phone backup)';
  if (dupRatio >= 0.5) return 'mostly duplicate of Poze';
  if (photoCount >= 50 && dupRatio < 0.3) return 'primary photo source';
  return 'mixed';
}

function main() {
  console.log('Indexing G:\\Poze\\ filenames...');
  const pozeIndex = indexPozeFilenames();
  console.log(`  ${pozeIndex.size} photo filenames in Poze.`);

  const results = [];
  for (const target of TARGETS) {
    process.stdout.write(`Scanning ${target}... `);
    const out = { totalFiles: 0, photos: [] };
    walkAll(target, out);

    let dupCount = 0;
    for (const p of out.photos) {
      if (pozeIndex.has(path.basename(p).toLowerCase())) dupCount++;
    }

    const sample = pickSample(out.photos, 5);
    const sampleExif = getExifBatch(sample);
    const dateRange = getDateRange(out.photos);

    const classification = classify({
      folder: path.basename(target),
      photoCount: out.photos.length,
      totalFiles: out.totalFiles,
      dupCount,
      sample,
      dateRange,
    });

    results.push({
      path: target,
      totalFiles: out.totalFiles,
      photoCount: out.photos.length,
      duplicateOfPoze: dupCount,
      newPhotos: out.photos.length - dupCount,
      duplicateRatio: out.photos.length > 0 ? +(dupCount / out.photos.length).toFixed(3) : 0,
      sample,
      sampleExif,
      dateRange,
      classification,
    });
    console.log(
      `${out.photos.length} photos / ${dupCount} dup (${
        dateRange.min || 'n/a'
      } -> ${dateRange.max || 'n/a'}) -> ${classification}`
    );
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${OUT_JSON}`);
}

main();
