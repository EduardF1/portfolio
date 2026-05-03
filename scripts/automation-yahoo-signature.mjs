/**
 * scripts/automation-yahoo-signature.mjs
 * ─────────────────────────────────────────────────────────────────
 * Step 2 of 2 — sets the Yahoo Mail signature using a saved session
 * (no password needed).
 *
 * Run  npm run automate:yahoo:login  first to create the session.
 *
 * Usage:
 *   npm run automate:yahoo-signature
 */

import { chromium }   from "playwright";
import { existsSync } from "node:fs";
import { resolve }    from "node:path";

const SESSION_FILE = resolve(".playwright-sessions/yahoo.json");

const SIGNATURE_LINES = [
  "Eduard Fischer-Szava",
  "Software Engineer · IT Consultant",
  "🌐 eduardfischer.dev",
  "💼 linkedin.com/in/eduard-fischer-szava",
];

async function main() {
  if (!existsSync(SESSION_FILE)) {
    console.error("\n  No saved session found.");
    console.error("  Run  npm run automate:yahoo:login  first.\n");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page    = await context.newPage();

  try {
    // ── 1. Open Yahoo Mail ────────────────────────────────────────
    console.log("Opening Yahoo Mail...");
    await page.goto("https://mail.yahoo.com/", { waitUntil: "networkidle" });

    if (/login\.yahoo\.com/.test(page.url())) {
      console.error("\n  Session expired. Run  npm run automate:yahoo:login  to refresh it.\n");
      process.exit(1);
    }

    // ── 2. Settings gear ─────────────────────────────────────────
    const gearBtn = page
      .locator('[data-test-id="settings-button"], [aria-label*="Setting" i]')
      .first();
    await gearBtn.waitFor({ state: "visible", timeout: 15_000 });
    await gearBtn.click();
    await page.waitForTimeout(500);

    // ── 3. More Settings ─────────────────────────────────────────
    const moreSettings = page.getByText(/More Settings/i).first();
    await moreSettings.waitFor({ state: "visible", timeout: 10_000 });
    await moreSettings.click();

    // ── 4. Writing email ─────────────────────────────────────────
    await page.waitForTimeout(1000);
    const writingEmail = page
      .getByRole("link", { name: /Writing email/i })
      .or(page.getByText(/Writing email/i).first());
    await writingEmail.waitFor({ state: "visible", timeout: 15_000 });
    await writingEmail.click();
    await page.waitForTimeout(800);

    // ── 5. Enable signature toggle if needed ─────────────────────
    const signatureToggle = page
      .locator('[data-test-id="signature-enabled-toggle"], [aria-label*="Signature" i] input[type="checkbox"]')
      .first();

    if (await signatureToggle.count() > 0 && !(await signatureToggle.isChecked())) {
      console.log("Enabling signature...");
      await signatureToggle.click();
      await page.waitForTimeout(500);
    }

    // ── 6. Clear + type new signature ────────────────────────────
    const editor = page
      .locator('[data-test-id="signature-editor"] [contenteditable="true"]')
      .or(page.locator('.signature-editor [contenteditable="true"]'))
      .or(page.locator('[contenteditable="true"][aria-label*="Signature" i]'))
      .first();

    await editor.waitFor({ state: "visible", timeout: 15_000 });
    await editor.click();
    await page.keyboard.shortcut("Control+A");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(300);

    for (let i = 0; i < SIGNATURE_LINES.length; i++) {
      await editor.pressSequentially(SIGNATURE_LINES[i], { delay: 20 });
      if (i < SIGNATURE_LINES.length - 1) await page.keyboard.press("Enter");
    }

    // ── 7. Save ───────────────────────────────────────────────────
    const saveBtn = page
      .getByRole("button", { name: /^Save$/i })
      .or(page.locator('[data-test-id="save-button"]'))
      .first();

    await saveBtn.waitFor({ state: "visible", timeout: 10_000 });
    await saveBtn.click();
    await page.waitForTimeout(1500);

    console.log("\n✓ Yahoo Mail signature set!");
    console.log("  " + SIGNATURE_LINES.join(" | "));
  } catch (err) {
    console.error("\n✗ Script failed:", err.message);
    console.error("  Browser stays open 15 s for inspection.");
    await page.waitForTimeout(15_000);
  } finally {
    await browser.close();
  }
}

main();
