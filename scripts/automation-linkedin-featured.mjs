/**
 * scripts/automation-linkedin-featured.mjs
 * ─────────────────────────────────────────────────────────────────
 * Automates adding eduardfischer.dev as a Featured link on LinkedIn.
 *
 * Usage:
 *   node --env-file=.env.local scripts/automation-linkedin-featured.mjs
 *
 * Required in .env.local (or as inline env vars):
 *   LINKEDIN_EMAIL=you@email.com
 *   LINKEDIN_PASSWORD=yourpassword
 *
 * The browser opens visibly so you can handle 2FA / CAPTCHA if
 * LinkedIn challenges the login. The script waits up to 2 minutes.
 */

import { chromium } from "playwright";

const PORTFOLIO_URL   = "https://eduardfischer.dev";
const PORTFOLIO_TITLE = "Portfolio & Case Studies";
const PORTFOLIO_DESC  = "Case studies, writing, travel and recommendations.";

async function main() {
  const email    = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    console.error("\n  Missing credentials. Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD.");
    console.error("  e.g.  node --env-file=.env.local scripts/automation-linkedin-featured.mjs\n");
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 80,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
    ],
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    // ── 1. Login ──────────────────────────────────────────────────
    console.log("Navigating to LinkedIn login...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

    await page.locator("#username").fill(email);
    await page.locator("#password").fill(password);
    await page.locator('[data-litms-control-urn="login-submit"], button[type=submit]').first().click();

    await page.waitForURL(/linkedin\.com\/(feed|checkpoint|challenge|home)/, {
      timeout: 30_000,
    });

    if (/checkpoint|challenge/.test(page.url())) {
      console.log("\n⚠  LinkedIn requires verification. Complete it in the browser window.");
      console.log("   Waiting up to 2 minutes for you to finish...\n");
      await page.waitForURL(/linkedin\.com\/feed/, { timeout: 120_000 });
    }

    console.log("✓ Logged in.");

    // ── 2. Navigate to own profile ────────────────────────────────
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // ── 3. Check if portfolio is already featured ─────────────────
    const alreadyFeatured = page.locator('section[id*="featured"] a[href*="eduardfischer"]');
    if (await alreadyFeatured.count() > 0) {
      console.log("✓ Portfolio link is already in your Featured section — nothing to do.");
      return;
    }

    // ── 4. Open Featured section controls ─────────────────────────
    const featuredSection = page.locator('section[id*="featured-summary"]').first();
    const hasFeatured = await featuredSection.count() > 0;

    if (hasFeatured) {
      console.log('Featured section found. Clicking its add (+) button...');
      const addBtn = featuredSection.locator('button[aria-label*="Add"]').first();
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
    } else {
      console.log('No Featured section yet. Adding via "Add profile section"...');
      const addSectionBtn = page.getByRole("button", { name: /Add profile section/i }).first();
      await addSectionBtn.scrollIntoViewIfNeeded();
      await addSectionBtn.click();
      await page.waitForTimeout(600);

      const featuredOption = page.getByRole("button", { name: /Featured/i });
      await featuredOption.waitFor({ state: "visible", timeout: 10_000 });
      await featuredOption.click();
    }

    await page.waitForTimeout(600);

    // ── 5. Click "Add a link" menu item ──────────────────────────
    const addLinkItem = page.getByRole("menuitem", { name: /Add a link/i });
    await addLinkItem.waitFor({ state: "visible", timeout: 10_000 });
    await addLinkItem.click();

    // ── 6. Fill in the URL ────────────────────────────────────────
    await page.waitForTimeout(800);

    const urlInput = page
      .locator("input[placeholder*='URL' i], input[placeholder*='url' i], input[id*='url' i]")
      .first();
    await urlInput.waitFor({ state: "visible", timeout: 10_000 });
    await urlInput.fill(PORTFOLIO_URL);

    // Trigger LinkedIn's URL resolver (fetches title + thumbnail)
    await page.keyboard.press("Tab");
    await page.waitForTimeout(2500);

    // ── 7. Update title ───────────────────────────────────────────
    const titleInput = page
      .locator("input[placeholder*='Title' i], input[id*='title' i]")
      .first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(PORTFOLIO_TITLE);
    }

    // ── 8. Update description (if the field is present) ──────────
    const descInput = page
      .locator("input[placeholder*='Description' i], textarea[placeholder*='Description' i]")
      .first();
    if (await descInput.isVisible()) {
      await descInput.fill(PORTFOLIO_DESC);
    }

    // ── 9. Save ───────────────────────────────────────────────────
    const saveBtn = page.getByRole("button", { name: /^Save$/i }).last();
    await saveBtn.waitFor({ state: "visible", timeout: 10_000 });
    await saveBtn.click();
    await page.waitForLoadState("networkidle");

    console.log("\n✓ Portfolio link added to LinkedIn Featured section!");
    console.log(`  ${PORTFOLIO_URL} — "${PORTFOLIO_TITLE}"`);
  } catch (err) {
    console.error("\n✗ Script failed:", err.message);
    console.error("  The browser will stay open for 15 s for inspection.");
    await page.waitForTimeout(15_000);
  } finally {
    await browser.close();
  }
}

main();
