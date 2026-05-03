/**
 * scripts/automation-yahoo-signature.mjs
 * ─────────────────────────────────────────────────────────────────
 * Automates setting the Yahoo Mail signature to include the portfolio
 * URL and LinkedIn profile.
 *
 * Usage:
 *   node --env-file=.env.local scripts/automation-yahoo-signature.mjs
 *
 * Required in .env.local (or as inline env vars):
 *   YAHOO_EMAIL=you@yahoo.com
 *   YAHOO_PASSWORD=yourpassword
 *
 * Note: if you use a Yahoo App Password (recommended when 2-step
 * verification is on), put that in YAHOO_PASSWORD.
 */

import { chromium } from "playwright";

const SIGNATURE_LINES = [
  "Eduard Fischer-Szava",
  "Software Engineer · IT Consultant",
  "🌐 eduardfischer.dev",
  "💼 linkedin.com/in/eduard-fischer-szava",
];

async function main() {
  const email    = process.env.YAHOO_EMAIL;
  const password = process.env.YAHOO_PASSWORD;

  if (!email || !password) {
    console.error("\n  Missing credentials. Set YAHOO_EMAIL and YAHOO_PASSWORD.");
    console.error("  e.g.  node --env-file=.env.local scripts/automation-yahoo-signature.mjs\n");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // ── 1. Login ──────────────────────────────────────────────────
    console.log("Navigating to Yahoo Mail...");
    await page.goto("https://login.yahoo.com/", { waitUntil: "domcontentloaded" });

    await page.locator("#login-username").fill(email);
    await page.locator("#login-signin").click();

    await page.waitForTimeout(1500);

    await page.locator("#login-passwd").waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("#login-passwd").fill(password);
    await page.locator("#login-signin").click();

    // Wait for mail inbox or a verification challenge
    await page.waitForURL(/mail\.yahoo\.com|login\.yahoo\.com\/account\/challenge/, {
      timeout: 30_000,
    });

    if (/challenge/.test(page.url())) {
      console.log("\n⚠  Yahoo requires verification. Complete it in the browser window.");
      console.log("   Waiting up to 2 minutes...\n");
      await page.waitForURL(/mail\.yahoo\.com/, { timeout: 120_000 });
    }

    console.log("✓ Logged in to Yahoo Mail.");

    // ── 2. Open More Settings ─────────────────────────────────────
    // Go directly to the settings URL to skip UI navigation
    await page.goto("https://mail.yahoo.com/", { waitUntil: "networkidle" });

    // Click the settings gear
    const gearBtn = page.locator('[data-test-id="settings-button"], [aria-label*="Setting" i]').first();
    await gearBtn.waitFor({ state: "visible", timeout: 15_000 });
    await gearBtn.click();
    await page.waitForTimeout(500);

    // Click "More Settings"
    const moreSettings = page.getByText(/More Settings/i).first();
    await moreSettings.waitFor({ state: "visible", timeout: 10_000 });
    await moreSettings.click();

    // ── 3. Navigate to Writing email ─────────────────────────────
    await page.waitForTimeout(1000);
    const writingEmailLink = page.getByRole("link", { name: /Writing email/i })
      .or(page.getByText(/Writing email/i).first());
    await writingEmailLink.waitFor({ state: "visible", timeout: 15_000 });
    await writingEmailLink.click();
    await page.waitForTimeout(800);

    // ── 4. Find the Signature section ────────────────────────────
    // Yahoo renders the signature toggle + editor on this page
    const signatureToggle = page
      .locator('[data-test-id="signature-enabled-toggle"], [aria-label*="Signature" i] input[type="checkbox"]')
      .first();

    if (await signatureToggle.count() > 0) {
      const isEnabled = await signatureToggle.isChecked();
      if (!isEnabled) {
        console.log("Enabling signature...");
        await signatureToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // ── 5. Find the signature editor ─────────────────────────────
    // Yahoo uses a contenteditable div for the signature editor
    const editor = page
      .locator('[data-test-id="signature-editor"] [contenteditable="true"]')
      .or(page.locator('.signature-editor [contenteditable="true"]'))
      .or(page.locator('[contenteditable="true"][aria-label*="Signature" i]'))
      .first();

    await editor.waitFor({ state: "visible", timeout: 15_000 });

    // Clear existing content and type the new signature
    await editor.click();
    await page.keyboard.shortcut("Control+A");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(300);

    // Type each line (contenteditable needs keyboard input, not .fill())
    for (let i = 0; i < SIGNATURE_LINES.length; i++) {
      await editor.pressSequentially(SIGNATURE_LINES[i], { delay: 20 });
      if (i < SIGNATURE_LINES.length - 1) {
        await page.keyboard.press("Enter");
      }
    }

    // ── 6. Save ───────────────────────────────────────────────────
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
    console.error("  The browser will stay open for 15 s for inspection.");
    await page.waitForTimeout(15_000);
  } finally {
    await browser.close();
  }
}

main();
