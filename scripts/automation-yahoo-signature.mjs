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
    // ── 1. Load inbox first so the SPA initialises ────────────────
    console.log("Opening Yahoo Mail...");
    await page.goto("https://mail.yahoo.com/", { waitUntil: "domcontentloaded" });

    if (/login\.yahoo\.com/.test(page.url())) {
      console.error("\n  Session expired. Run  npm run automate:yahoo:login  to refresh it.\n");
      process.exit(1);
    }
    await page.waitForTimeout(4000);

    // ── 2. Navigate to Writing email settings ─────────────────────
    console.log("Navigating to signature settings...");
    await page.goto("https://mail.yahoo.com/n/settings/writing-email", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click "Writing email" in the left nav to trigger content render
    await page.getByText("Writing email").first().click();
    await page.waitForTimeout(4000);

    // ── 3. Enable signature toggle if off ─────────────────────────
    // Toggle is next to the email address in the Signature section
    const toggle = page.locator('section:has-text("Signature") [role="switch"], [role="switch"]')
      .or(page.locator('input[type="checkbox"]').nth(0))
      .first();

    const toggleVisible = await toggle.isVisible().catch(() => false);
    if (toggleVisible) {
      const isOn = await toggle.evaluate(el =>
        el.getAttribute("aria-checked") === "true" || el.checked
      ).catch(() => false);
      if (!isOn) {
        console.log("Enabling signature toggle...");
        await toggle.click();
        await page.waitForTimeout(1500);
      } else {
        console.log("Signature toggle already enabled.");
      }
    }

    // ── 4. Find and fill the signature editor ─────────────────────
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.waitFor({ state: "visible", timeout: 15_000 });
    console.log("Signature editor found. Filling...");
    await editor.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(300);

    for (let i = 0; i < SIGNATURE_LINES.length; i++) {
      await editor.pressSequentially(SIGNATURE_LINES[i], { delay: 20 });
      if (i < SIGNATURE_LINES.length - 1) await page.keyboard.press("Enter");
    }

    // ── 5. Wait for auto-save (Yahoo Mail saves automatically) ────
    console.log("Waiting for auto-save...");
    await page.waitForTimeout(3000);

    // Verify by checking the editor still has our content
    const savedText = await editor.innerText().catch(() => "");
    console.log("Editor content after save:", savedText.trim().slice(0, 100));

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
