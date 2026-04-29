#!/usr/bin/env node
// Scout G:\ for photo locations OUTSIDE G:\Poze\ and G:\Whatsapp\.
// READ-ONLY. Outputs JSON summary at scripts/.g-other-folders-scout.json.
// Cap recursion depth at 4. If folder has >10k files, sample every 100th when reading EXIF.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'G:\\';
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.raw', '.dng']);
const MAX_DEPTH = 4;
const OUT_JSON = path.join(process.cwd(), 'scripts', '.g-other-folders-scout.json');

// Folders to skip per task spec.
const SKIP = new Set([
  'Citizenship',
  'Citizenship_Application',
  'Important Documents',
  'backup NC (24.02.2026)',
  'Whatsapp',
  'Poze',
  'Dev',
  'Documents',
  'Calendars',
  'Courses',
  'System Volume Information',
  '$RECYCLE.BIN',
]);

// Top-level dirs to scan (everything not in SKIP).
function listTopLevel() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !SKIP.has(n));
}

function walkPhotos(dir, depth, out) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkPhotos(full, depth + 1, out);
    } else if (e.isFile()) {
      out.totalFiles++;
      const ext = path.extname(e.name).toLowerCase();
      if (PHOTO_EXT.has(ext)) {
        out.photos.push(full);
      }
    }
  }
}

// Build set of filenames already in G:\Poze\ for duplicate cross-check.
function indexPozeFilenames() {
  const set = new Set();
  function walk(dir, depth) {
    if (depth > 6) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (PHOTO_EXT.has(ext)) set.add(e.name.toLowerCase());
      }
    }
  }
  walk('G:\\Poze', 0);
  return set;
}

function getExifBatch(files) {
  // Return DateTimeOriginal + GPSPosition for up to ~5 files via single exiftool call.
  if (files.length === 0) return [];
  try {
    const out = execFileSync(
      'exiftool',
      ['-S', '-DateTimeOriginal', '-CreateDate', '-GPSPosition', '-FileName', ...files],
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );
    // Parse: blocks separated by ======== File: line
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
  } catch (err) {
    return [];
  }
}

function pickRandom(arr, n) {
  if (arr.length <= n) return [...arr];
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function main() {
  console.log('Indexing G:\\Poze\\ filenames...');
  const pozeIndex = indexPozeFilenames();
  console.log(`  ${pozeIndex.size} photo filenames in Poze.`);

  const candidates = listTopLevel();
  console.log(`Scanning ${candidates.length} candidate folders...`);

  const results = [];
  for (const name of candidates) {
    const full = path.join(ROOT, name);
    process.stdout.write(`  ${name}... `);
    const out = { totalFiles: 0, photos: [] };
    walkPhotos(full, 0, out);

    const photoCount = out.photos.length;
    let dupCount = 0;
    for (const p of out.photos) {
      if (pozeIndex.has(path.basename(p).toLowerCase())) dupCount++;
    }

    let sample = pickRandom(out.photos, 5);
    // For very large folders, also scan every 100th to bias toward middle of list
    if (out.photos.length > 10000) {
      sample = [];
      for (let i = 0; i < out.photos.length && sample.length < 5; i += Math.max(1, Math.floor(out.photos.length / 5))) {
        sample.push(out.photos[i]);
      }
    }
    const exif = getExifBatch(sample);

    results.push({
      folder: name,
      path: full,
      totalFiles: out.totalFiles,
      photoCount,
      duplicateOfPoze: dupCount,
      sample,
      exif,
    });
    console.log(`${out.totalFiles} files / ${photoCount} photos / ${dupCount} dup`);
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${OUT_JSON}`);
}

main();
