/**
 * scripts/automation-session-helper.mjs
 * ─────────────────────────────────────────────────────────────────
 * Shared helper: ensures a valid saved session exists, running the
 * manual login flow automatically if the session is missing or expired.
 */

import { chromium }           from "playwright";
import { existsSync, mkdirSync } from "node:fs";

/**
 * Ensures a valid session file exists for the given site.
 *
 * @param {object} opts
 * @param {string} opts.sessionFile   - Path to the .json session file
 * @param {string} opts.startUrl      - URL to open for login
 * @param {Function} opts.isLoggedIn  - (page) => boolean — returns true once logged in
 * @param {string} opts.siteName      - Human-readable name for log messages
 */
export async function ensureSession({ sessionFile, startUrl, isLoggedIn, siteName }) {
  mkdirSync(".playwright-sessions", { recursive: true });

  if (existsSync(sessionFile)) {
    // Quick check: load the session and verify it's still valid
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: sessionFile });
    const page    = await context.newPage();
    try {
      await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await page.waitForTimeout(2000);
      const valid = await Promise.resolve(isLoggedIn(page)).catch(() => false);
      await browser.close();
      if (valid) {
        console.log(`✓ ${siteName} session is valid.`);
        return;
      }
      console.log(`  ${siteName} session expired — re-running login...`);
    } catch {
      await browser.close();
      console.log(`  ${siteName} session check failed — re-running login...`);
    }
  } else {
    console.log(`  No ${siteName} session found — running login...`);
  }

  // ── Interactive login ──────────────────────────────────────────
  console.log(`\n  A browser window will open for ${siteName}.`);
  console.log("  Log in normally (including any 2FA).");
  console.log("  The script continues automatically once you're in.\n");

  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  await page.goto(startUrl, { waitUntil: "domcontentloaded" });

  // Wait indefinitely for the user to reach the logged-in state
  await page.waitForFunction(
    async (checkFn) => {
      // We can't pass the function directly, so poll via URL/DOM check
      return true; // see waitForURL below
    },
    {},
    { timeout: 0 }
  ).catch(() => {});

  // Use URL-based detection passed as a string pattern
  await new Promise(resolve => {
    const check = async () => {
      const loggedIn = await Promise.resolve(isLoggedIn(page)).catch(() => false);
      if (loggedIn) return resolve();
      setTimeout(check, 1000);
    };
    check();
  });

  console.log(`✓ Logged in. Saving ${siteName} session...`);
  await context.storageState({ path: sessionFile });
  await browser.close();
  console.log(`✓ Session saved to ${sessionFile}\n`);
}
