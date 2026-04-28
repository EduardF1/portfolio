/**
 * Smoke test for `scripts/build-cv-pdf.mjs`.
 *
 * Per the task brief: "don't try to test PDF rendering output;
 * smoke-test the build script (it exits 0 + writes both files when
 * run on the test fixture)". This confirms:
 *   1. buildCv() resolves (no thrown error → script would exit 0)
 *   2. exactly two output files are written, one per locale
 *   3. both files are non-empty PDFs (header bytes "%PDF-")
 *
 * The test writes into a `tmp/` directory under the project root so
 * we don't pollute `public/cv/` from the unit-test pass.
 */

import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

describe("build-cv-pdf smoke test", () => {
  let outDir;
  let results;

  beforeAll(async () => {
    outDir = path.join(ROOT, "tmp", "cv-smoke-test");
    fs.rmSync(outDir, { recursive: true, force: true });
    const mod = await import("./build-cv-pdf.mjs");
    results = await mod.buildCv({ outDir });
  }, 120_000);

  it("writes one PDF per locale (EN + DA)", () => {
    expect(results).toHaveLength(2);
    const locales = results.map((r) => r.locale).sort();
    expect(locales).toEqual(["da", "en"]);
  });

  it("each output file exists on disk and is non-empty", () => {
    for (const r of results) {
      expect(fs.existsSync(r.outFile)).toBe(true);
      const stat = fs.statSync(r.outFile);
      expect(stat.size).toBeGreaterThan(1024); // sanity floor
    }
  });

  it("each output file starts with the PDF magic bytes", () => {
    for (const r of results) {
      const buf = fs.readFileSync(r.outFile);
      expect(buf.slice(0, 5).toString("utf8")).toBe("%PDF-");
    }
  });
});
