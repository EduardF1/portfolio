/**
 * scripts/automation-linkedin-featured.mjs
 * ─────────────────────────────────────────────────────────────────
 * Step 2 of 2 — adds eduardfischer.dev as a Featured link on your
 * LinkedIn profile using a saved session (no password needed).
 *
 * Run  npm run automate:linkedin:login  first to create the session.
 *
 * Usage:
 *   npm run automate:linkedin
 */

import { chromium }   from "playwright";
import { existsSync } from "node:fs";
import { resolve }    from "node:path";

const SESSION_FILE    = resolve(".playwright-sessions/linkedin.json");
const PORTFOLIO_URL   = "https://eduardfischer.dev";
const PORTFOLIO_TITLE = "Portfolio & Case Studies";
const PORTFOLIO_DESC  = "Case studies, writing, travel and recommendations.";

async function main() {
  if (!existsSync(SESSION_FILE)) {
    console.error("\n  No saved session found.");
    console.error("  Run  npm run automate:linkedin:login  first.\n");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page    = await context.newPage();

  try {
    // ── 1. Go to own profile ──────────────────────────────────────
    console.log("Opening LinkedIn profile...");
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });

    // Detect session expiry
    if (/login|authwall/.test(page.url())) {
      console.error("\n  Session expired. Run  npm run automate:linkedin:login  to refresh it.\n");
      process.exit(1);
    }

    await page.waitForTimeout(2000);

    // ── 2. Check idempotency ──────────────────────────────────────
    const alreadyFeatured = page.locator('section[id*="featured"] a[href*="eduardfischer"]');
    if (await alreadyFeatured.count() > 0) {
      console.log("✓ Portfolio link is already in your Featured section — nothing to do.");
      return;
    }

    // ── 3. Open Featured controls ─────────────────────────────────
    const featuredSection = page.locator('section[id*="featured-summary"]').first();

    if (await featuredSection.count() > 0) {
      console.log("Featured section found. Clicking its add (+) button...");
      const addBtn = featuredSection.locator('button[aria-label*="Add"]').first();
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
    } else {
      console.log('No Featured section yet — creating via "Add profile section"...');
      const addSectionBtn = page.getByRole("button", { name: /Add profile section/i }).first();
      await addSectionBtn.scrollIntoViewIfNeeded();
      await addSectionBtn.click();
      await page.waitForTimeout(600);

      const featuredOption = page.getByRole("button", { name: /Featured/i });
      await featuredOption.waitFor({ state: "visible", timeout: 10_000 });
      await featuredOption.click();
    }

    await page.waitForTimeout(600);

    // ── 4. Add a link ─────────────────────────────────────────────
    const addLinkItem = page.getByRole("menuitem", { name: /Add a link/i });
    await addLinkItem.waitFor({ state: "visible", timeout: 10_000 });
    await addLinkItem.click();
    await page.waitForTimeout(800);

    // ── 5. Fill URL ───────────────────────────────────────────────
    const urlInput = page
      .locator("input[placeholder*='URL' i], input[id*='url' i]")
      .first();
    await urlInput.waitFor({ state: "visible", timeout: 10_000 });
    await urlInput.fill(PORTFOLIO_URL);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(2500); // let LinkedIn resolve the URL

    // ── 6. Title & description ────────────────────────────────────
    const titleInput = page.locator("input[placeholder*='Title' i], input[id*='title' i]").first();
    if (await titleInput.isVisible()) await titleInput.fill(PORTFOLIO_TITLE);

    const descInput = page
      .locator("input[placeholder*='Description' i], textarea[placeholder*='Description' i]")
      .first();
    if (await descInput.isVisible()) await descInput.fill(PORTFOLIO_DESC);

    // ── 7. Save ───────────────────────────────────────────────────
    const saveBtn = page.getByRole("button", { name: /^Save$/i }).last();
    await saveBtn.waitFor({ state: "visible", timeout: 10_000 });
    await saveBtn.click();
    await page.waitForLoadState("networkidle");

    console.log(`\n✓ Featured link added: ${PORTFOLIO_URL} — "${PORTFOLIO_TITLE}"`);
  } catch (err) {
    console.error("\n✗ Script failed:", err.message);
    console.error("  Browser stays open 15 s for inspection.");
    await page.waitForTimeout(15_000);
  } finally {
    await browser.close();
  }
}

main();
