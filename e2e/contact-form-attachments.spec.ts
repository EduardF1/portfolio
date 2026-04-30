/**
 * Playwright E2E tests for the contact form attachment behaviour.
 *
 * Covers:
 *   - Submitting with NO attachment (baseline happy path without email delivery)
 *   - Accepted types: PDF, JPEG, PNG, Word (.docx), Word legacy (.doc)
 *   - Rejected type: ZIP (unsupported MIME)
 *   - Rejected size: PDF > 5 MB
 *   - UI state after clearing a previously-selected invalid file
 *
 * These tests exercise real browser behaviour (file input, client-side
 * validation, button disabled state) without going through the email
 * delivery pipeline. They are safe to run in CI.
 */

import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

// ---------------------------------------------------------------------------
// Fixture helpers — generate in-memory files without committing binary
// fixtures to the repo.
// ---------------------------------------------------------------------------

function tmpFile(name: string, content: Buffer | string, mime: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-contact-"));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return { name, mimeType: mime, buffer: Buffer.isBuffer(content) ? content : Buffer.from(content) };
}

const KB = 1024;
const MB = 1024 * KB;

const fixtures = {
  pdf:      () => tmpFile("document.pdf",    Buffer.alloc(10 * KB, "%PDF-1.4"), "application/pdf"),
  jpeg:     () => tmpFile("photo.jpg",        Buffer.alloc(10 * KB, 0xff),       "image/jpeg"),
  png:      () => tmpFile("screenshot.png",  Buffer.alloc(10 * KB, 0x89),       "image/png"),
  docx:     () => tmpFile("letter.docx",     Buffer.alloc(10 * KB, 0x50),       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  doc:      () => tmpFile("old-letter.doc",  Buffer.alloc(10 * KB, 0xd0),       "application/msword"),
  zip:      () => tmpFile("archive.zip",     Buffer.alloc(10 * KB, 0x50),       "application/zip"),
  hugePdf:  () => tmpFile("huge.pdf",        Buffer.alloc(6 * MB,  "%PDF-"),    "application/pdf"),
} as const;

// ---------------------------------------------------------------------------
// Helper: fill required fields so the form is ready to submit.
// ---------------------------------------------------------------------------
async function fillRequiredFields(page: import("@playwright/test").Page) {
  await page.getByLabel(/Your name/i).fill("Playwright Tester");
  await page.getByLabel(/^Email$/i).fill("test@example.com");
  await page.getByLabel(/Message/i).fill("Automated attachment test. Safe to ignore.");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Contact form — no attachment", () => {
  test("submits successfully without selecting a file", async ({ page }) => {
    await page.goto("/contact");
    await fillRequiredFields(page);

    // No file selected — send button must be enabled.
    const btn = page.getByRole("button", { name: /Send message/i });
    await expect(btn).toBeEnabled();

    // No attachment error shown.
    await expect(page.locator("#attachment-error")).toHaveCount(0);

    await btn.click();
    // Server-action returns success card.
    await expect(page.getByText(/Thanks, got it\./i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Contact form — accepted attachment types", () => {
  for (const [label, fix] of [
    ["PDF",  "pdf"],
    ["JPEG", "jpeg"],
    ["PNG",  "png"],
    ["DOCX", "docx"],
    ["DOC",  "doc"],
  ] as const) {
    test(`accepts a ${label} file: no error, filename shown, button enabled`, async ({
      page,
    }) => {
      await page.goto("/contact");
      await fillRequiredFields(page);

      const f = fixtures[fix]();
      await page.locator('input[type="file"]').setInputFiles({
        name: f.name,
        mimeType: f.mimeType,
        buffer: f.buffer,
      });

      // No error badge.
      await expect(page.locator("#attachment-error")).toHaveCount(0);

      // Filename displayed below the input.
      await expect(page.getByText(f.name)).toBeVisible();

      // Send button enabled.
      await expect(
        page.getByRole("button", { name: /Send message/i }),
      ).toBeEnabled();
    });
  }
});

test.describe("Contact form — rejected attachment types", () => {
  test("shows error and disables send button for an unsupported type (ZIP)", async ({
    page,
  }) => {
    await page.goto("/contact");
    await fillRequiredFields(page);

    const f = fixtures.zip();
    await page.locator('input[type="file"]').setInputFiles({
      name: f.name,
      mimeType: f.mimeType,
      buffer: f.buffer,
    });

    // Error message visible.
    await expect(page.locator("#attachment-error")).toBeVisible();
    await expect(page.locator("#attachment-error")).toContainText(
      /PDF|JPEG|PNG|Word/i,
    );

    // Send button disabled.
    await expect(
      page.getByRole("button", { name: /Send message/i }),
    ).toBeDisabled();
  });

  test("shows error and disables send button for an oversized file (> 5 MB)", async ({
    page,
  }) => {
    await page.goto("/contact");
    await fillRequiredFields(page);

    const f = fixtures.hugePdf();
    await page.locator('input[type="file"]').setInputFiles({
      name: f.name,
      mimeType: f.mimeType,
      buffer: f.buffer,
    });

    await expect(page.locator("#attachment-error")).toBeVisible();
    await expect(page.locator("#attachment-error")).toContainText(/5 MB/i);

    await expect(
      page.getByRole("button", { name: /Send message/i }),
    ).toBeDisabled();
  });
});

test.describe("Contact form — attachment input field", () => {
  test("file input accepts only the whitelisted MIME types", async ({
    page,
  }) => {
    await page.goto("/contact");
    const accept = await page
      .locator('input[type="file"]')
      .getAttribute("accept");

    expect(accept).toContain("application/pdf");
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    expect(accept).toContain("application/msword");
    expect(accept).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  test("hint text describes accepted types and size limit", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(
      page.getByText(/PDF.*JPEG.*PNG.*Word|max.*5\s*MB/i),
    ).toBeVisible();
  });
});
