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
    const alreadyFeatured = page.locator('a[href*="eduardfischer"]');
    if (await alreadyFeatured.count() > 0) {
      console.log("✓ Portfolio link is already in your Featured section — nothing to do.");
      return;
    }

    // ── 3. Open Featured overflow menu ("...") ────────────────────
    // The Featured section already exists — its overflow menu is the
    // entry point for adding new items.
    console.log('Opening Featured overflow menu...');
    const overflowBtn = page.locator('[aria-label="Featured overflow menu"]').first();
    await overflowBtn.scrollIntoViewIfNeeded();
    await overflowBtn.click();
    await page.waitForTimeout(600);

    // ── 4. Click "Add a link" inside the dropdown ─────────────────
    // LinkedIn shows: Add a link / Add a post / Add media / Reorder
    const addLinkItem = page.getByRole("menuitem", { name: /Add a link/i }).last();
    await addLinkItem.waitFor({ state: "visible", timeout: 10_000 });
    await addLinkItem.click();
    await page.waitForTimeout(800);

    // ── 5. Fill URL ───────────────────────────────────────────────
    // LinkedIn's "Add a link" form has no role="dialog" — find input by aria-label
    const urlInput = page.locator('[aria-label*="Paste or type a link" i]').first();
    await urlInput.waitFor({ state: "visible", timeout: 15_000 });
    await urlInput.fill(PORTFOLIO_URL);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(4000); // wait for URL validation XHR

    // ── 6. Title & description ────────────────────────────────────
    const titleInput = page.locator("input[aria-label*='Title' i], input[placeholder*='Title' i]").first();
    if (await titleInput.isVisible()) {
      await titleInput.fill("");
      await titleInput.fill(PORTFOLIO_TITLE);
    }

    const descInput = page.locator("input[aria-label*='Description' i], textarea[aria-label*='Description' i]").first();
    if (await descInput.isVisible()) await descInput.fill(PORTFOLIO_DESC);

    // ── 7. Save ───────────────────────────────────────────────────
    await page.waitForFunction(() => {
      const btns = [...document.querySelectorAll("button")];
      return btns.some(b => /^save$/i.test(b.innerText.trim()) && !b.disabled);
    }, { timeout: 15_000 });
    await page.getByRole("button", { name: /^Save$/i }).last().click();
    await page.waitForTimeout(3000); // SPA — networkidle never fires

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
