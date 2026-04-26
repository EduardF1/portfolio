#!/usr/bin/env node
/**
 * Copies the pdfjs-dist worker into `public/pdf/` so it can be loaded by
 * the read-only CV viewer without depending on a CDN. Run on demand after
 * upgrading pdfjs-dist:
 *
 *   node scripts/sync-pdfjs-worker.mjs
 *
 * The worker is a static asset; serving it from /pdf/ on our own origin
 * avoids the cross-origin module-worker hoop and keeps the viewer working
 * offline / behind corporate proxies.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const src = resolve(
  projectRoot,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const dst = resolve(projectRoot, "public/pdf/pdf.worker.min.mjs");

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log(`pdf.worker.min.mjs copied to ${dst}`);
